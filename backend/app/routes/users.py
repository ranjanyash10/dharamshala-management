from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import User, Role
from app.extensions import db

users_bp = Blueprint('users', __name__)

def admin_required():
    claims = get_jwt()
    if claims.get('role') != 'Admin':
        return False
    return True

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "role": u.role.name if u.role else 'Unknown',
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        })
    return jsonify(result), 200

@users_bp.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = Role.query.all()
    return jsonify([{"id": r.id, "name": r.name} for r in roles]), 200

@users_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    if not admin_required():
        return jsonify({"message": "Admin privileges required"}), 403
        
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role_name = data.get('role', 'Staff')
    
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 400
        
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({"message": "Role does not exist"}), 400
        
    new_user = User(username=username, role_id=role.id, is_active=True)
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@users_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    if not admin_required():
        return jsonify({"message": "Admin privileges required"}), 403
        
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if 'password' in data and data['password']:
        user.set_password(data['password'])
        
    if 'role' in data:
        role = Role.query.filter_by(name=data['role']).first()
        if role:
            user.role_id = role.id
            
    if 'is_active' in data:
        user.is_active = data['is_active']
        
    db.session.commit()
    return jsonify({"message": "User updated successfully"}), 200

@users_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    if not admin_required():
        return jsonify({"message": "Admin privileges required"}), 403
        
    current_user_id = get_jwt_identity()
    if int(current_user_id) == id:
        return jsonify({"message": "Cannot delete your own account"}), 400
        
    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"message": "User deleted successfully"}), 200
