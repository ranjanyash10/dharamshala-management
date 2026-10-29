from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User, Role
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid username or password"}), 401

    if not user.is_active:
        return jsonify({"message": "Account is inactive"}), 403

    access_token = create_access_token(
        identity=str(user.id), 
        additional_claims={"username": user.username, "role": user.role.name}
    )
    return jsonify({"access_token": access_token, "user": {"id": user.id, "username": user.username, "role": user.role.name}}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    return jsonify({"id": user.id, "username": user.username, "role": user.role.name}), 200
