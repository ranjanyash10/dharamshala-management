import os
import uuid
from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required
from app.models import Guest, Booking, GuestDocument
from app.extensions import db
from werkzeug.utils import secure_filename

guests_bp = Blueprint('guests', __name__)

@guests_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_guests():
    # Fetch all guests ordered by newest first
    guests = Guest.query.order_by(Guest.created_at.desc()).all()
    
    result = []
    for g in guests:
        bookings = Booking.query.filter_by(guest_id=g.id).all()
        stay_count = len(bookings)
        
        # Get all unique room numbers and total occupants from these bookings
        room_numbers = set()
        total_occupants = 0
        for b in bookings:
            for br in b.rooms:
                room_numbers.add(br.room.room_number)
                total_occupants += (br.occupant_count or 1)
                
        result.append({
            "id": g.id,
            "full_name": g.full_name,
            "mobile_number": g.mobile_number,
            "id_details": g.id_details,
            "address": g.address,
            "created_at": g.created_at.isoformat(),
            "total_stays": stay_count,
            "room_numbers": list(room_numbers),
            "total_occupants": total_occupants
        })
        
    return jsonify(result), 200

@guests_bp.route('/<int:guest_id>/documents', methods=['GET'])
@jwt_required()
def get_guest_documents(guest_id):
    docs = GuestDocument.query.filter_by(guest_id=guest_id).all()
    return jsonify([{
        'id': d.id,
        'file_url': f'/uploads/{d.file_path}',
        'document_type': d.document_type,
        'person_name': d.person_name,
        'uploaded_at': d.uploaded_at.isoformat()
    } for d in docs]), 200

@guests_bp.route('/<int:guest_id>/documents', methods=['POST'])
@jwt_required()
def upload_guest_document(guest_id):
    guest = Guest.query.get_or_404(guest_id)
    
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Generate unique filename to avoid overwrites
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        uploads_dir = os.path.join(current_app.root_path, '..', 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        file.save(os.path.join(uploads_dir, unique_filename))
        
        person_name = request.form.get('person_name', guest.full_name)
        document_type = request.form.get('document_type', 'ID Proof')
        
        doc = GuestDocument(
            guest_id=guest_id,
            file_path=unique_filename,
            document_type=document_type,
            person_name=person_name
        )
        db.session.add(doc)
        db.session.commit()
        
        return jsonify({"message": "Document uploaded successfully"}), 201
