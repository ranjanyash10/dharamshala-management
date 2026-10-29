from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Room, RoomType, RatePlan
from app.extensions import db

rooms_bp = Blueprint('rooms', __name__)

@rooms_bp.route('/', methods=['GET'])
@jwt_required()
def get_rooms():
    rooms = Room.query.all()
    result = []
    for r in rooms:
        result.append({
            "id": r.id,
            "room_number": r.room_number,
            "floor": r.floor,
            "type": r.room_type.name,
            "capacity": r.capacity,
            "status": r.status,
            "is_active": r.is_active
        })
    return jsonify(result), 200

@rooms_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_room(id):
    room = Room.query.get_or_404(id)
    return jsonify({
        "id": room.id,
        "room_number": room.room_number,
        "floor": room.floor,
        "type": room.room_type.name,
        "capacity": room.capacity,
        "status": room.status,
        "amenities": room.amenities,
        "notes": room.notes,
        "is_active": room.is_active
    }), 200

@rooms_bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_room_status(id):
    room = Room.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    valid_statuses = ['Available', 'Reserved', 'Occupied', 'Cleaning', 'Maintenance', 'Inactive']
    if new_status not in valid_statuses:
        return jsonify({"message": "Invalid status"}), 400
        
    room.status = new_status
    db.session.commit()
    return jsonify({"message": "Room status updated successfully"}), 200
