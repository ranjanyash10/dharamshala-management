from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Guest, Booking, BookingRoom, Room
from app.extensions import db
from datetime import datetime
from app.utils import get_ist_now, get_ist_date

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def get_bookings():
    bookings = Booking.query.order_by(Booking.created_at.desc()).all()
    result = []
    for b in bookings:
        result.append({
            "id": b.id,
            "guest_name": b.guest.full_name,
            "status": b.status,
            "arrival_date": b.arrival_date.isoformat(),
            "departure_date": b.departure_date.isoformat(),
            "rooms": [br.room.room_number for br in b.rooms]
        })
    return jsonify(result), 200

@bookings_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Extract data
    guest_name = data.get('guest_name')
    mobile = data.get('mobile_number')
    id_details = data.get('id_details')
    address = data.get('address')
    
    room_ids = data.get('room_ids', [])
    arrival_str = data.get('arrival_date')
    departure_str = data.get('departure_date')
    
    if not guest_name or not room_ids or not arrival_str or not departure_str:
        return jsonify({"message": "Missing required fields"}), 400
        
    try:
        arr_date = datetime.strptime(arrival_str, '%Y-%m-%d').date()
        dep_date = datetime.strptime(departure_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"message": "Invalid date format, use YYYY-MM-DD"}), 400

    # Handle Guest
    guest = Guest.query.filter_by(mobile_number=mobile).first() if mobile else None
    if not guest:
        guest = Guest(full_name=guest_name, mobile_number=mobile, id_details=id_details, address=address)
        db.session.add(guest)
        db.session.flush() # Get guest ID
        
    # Handle Booking
    booking = Booking(
        guest_id=guest.id,
        status='Reserved',
        source=data.get('source', 'Walk-in'),
        arrival_date=arr_date,
        departure_date=dep_date,
        notes=data.get('notes'),
        created_by_id=current_user_id
    )
    db.session.add(booking)
    db.session.flush()

    # Handle Room Allocations
    for r_id in room_ids:
        room = Room.query.get(r_id)
        if not room or room.status not in ['Available', 'Cleaning']:
            db.session.rollback()
            return jsonify({"message": f"Room ID {r_id} is not available"}), 400
            
        rate = room.room_type.rate_plans[0].base_rate if room.room_type.rate_plans else 0.0
        br = BookingRoom(booking_id=booking.id, room_id=r_id, occupant_count=data.get('occupant_count', 1), applied_rate=rate)
        db.session.add(br)
        
        # Reserve room
        room.status = 'Reserved'
        
    db.session.commit()
    return jsonify({"message": "Booking created successfully", "id": booking.id}), 201

@bookings_bp.route('/<int:id>/check-in', methods=['POST'])
@jwt_required()
def check_in(id):
    booking = Booking.query.get_or_404(id)
    if booking.status != 'Reserved':
        return jsonify({"message": "Booking is not in Reserved state"}), 400
        
    booking.status = 'CheckedIn'
    for br in booking.rooms:
        br.room.status = 'Occupied'
        
    db.session.commit()
    return jsonify({"message": "Checked in successfully"}), 200

@bookings_bp.route('/<int:id>/check-out', methods=['POST'])
@jwt_required()
def check_out(id):
    booking = Booking.query.get_or_404(id)
    if booking.status != 'CheckedIn':
        return jsonify({"message": "Booking is not CheckedIn"}), 400
        
    data = request.get_json() if request.is_json else {}
    next_status = data.get('room_status')
    
    if not next_status:
        # A room always needs to be cleaned after a guest checks out, regardless of the time of day.
        next_status = 'Cleaning'
            
    booking.status = 'CheckedOut'
    for br in booking.rooms:
        br.room.status = next_status
        
    db.session.commit()
    return jsonify({"message": "Checked out successfully"}), 200

from sqlalchemy import func

@bookings_bp.route('/today', methods=['GET'])
@jwt_required()
def get_todays_agenda():
    today = get_ist_date()
    
    # Arrivals: Bookings that are 'Reserved' and arrive on or before today
    arrivals = Booking.query.filter(
        Booking.status == 'Reserved',
        func.date(Booking.arrival_date) <= today
    ).all()
    
    # Departures: Bookings that are 'CheckedIn' and depart on or before today
    departures = Booking.query.filter(
        Booking.status == 'CheckedIn',
        func.date(Booking.departure_date) <= today
    ).all()
    
    def format_booking(b):
        return {
            'id': b.id,
            'guest_name': b.guest.full_name,
            'mobile_number': b.guest.mobile_number,
            'arrival_date': b.arrival_date.isoformat(),
            'departure_date': b.departure_date.isoformat(),
            'rooms': [br.room.room_number for br in b.rooms],
            'status': b.status
        }
        
    return jsonify({
        "arrivals": [format_booking(a) for a in arrivals],
        "departures": [format_booking(d) for d in departures]
    }), 200
