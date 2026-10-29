from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Setting, RatePlan, RoomType
from app.extensions import db

settings_bp = Blueprint('settings', __name__)

@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    settings = Setting.query.all()
    result = {s.key: s.value for s in settings}
    
    # Also fetch Room Rates
    rate_plans = RatePlan.query.all()
    for rp in rate_plans:
        # We prefix it so the frontend knows it's a room rate
        result[f"room_rate_{rp.room_type.name}"] = str(rp.base_rate)
        
    return jsonify(result), 200

@settings_bp.route('/', methods=['POST'])
@jwt_required()
def update_settings():
    data = request.get_json()
    
    for key, value in data.items():
        if key.startswith('room_rate_'):
            # Update the RatePlan instead of Setting table
            rt_name = key.replace('room_rate_', '')
            room_type = RoomType.query.filter_by(name=rt_name).first()
            if room_type:
                rp = RatePlan.query.filter_by(room_type_id=room_type.id).first()
                if rp:
                    rp.base_rate = float(value)
        else:
            setting = Setting.query.filter_by(key=key).first()
            if setting:
                setting.value = str(value)
            else:
                setting = Setting(key=key, value=str(value))
                db.session.add(setting)
            
    db.session.commit()
    return jsonify({"message": "Settings updated successfully"}), 200
