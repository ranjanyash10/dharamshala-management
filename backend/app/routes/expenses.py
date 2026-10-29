from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Expense, ExpenseCategory
from app.extensions import db
from datetime import datetime
from app.utils import get_ist_now, get_ist_date

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    categories = ExpenseCategory.query.filter_by(is_active=True).all()
    return jsonify([{"id": c.id, "name": c.name} for c in categories]), 200

@expenses_bp.route('/', methods=['GET'])
@jwt_required()
def get_expenses():
    expenses = Expense.query.order_by(Expense.date.desc()).all()
    result = []
    for e in expenses:
        result.append({
            "id": e.id,
            "category": e.category.name,
            "amount": str(e.amount),
            "date": e.date.isoformat(),
            "description": e.description,
            "vendor_name": e.vendor_name,
            "receipt_ref": e.receipt_ref,
            "created_by": e.created_by.username if e.created_by else 'System'
        })
    return jsonify(result), 200

@expenses_bp.route('/', methods=['POST'])
@jwt_required()
def add_expense():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    amount = float(data.get('amount', 0))
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400
        
    date_str = data.get('date')
    try:
        exp_date = datetime.strptime(date_str, '%Y-%m-%d').date() if date_str else get_ist_date()
    except ValueError:
        return jsonify({"message": "Invalid date format. Use YYYY-MM-DD"}), 400

    expense = Expense(
        category_id=data.get('category_id'),
        amount=amount,
        date=exp_date,
        description=data.get('description', ''),
        vendor_name=data.get('vendor_name', ''),
        receipt_ref=data.get('receipt_ref', ''),
        created_by_id=current_user_id
    )
    
    db.session.add(expense)
    db.session.commit()
    
    return jsonify({"message": "Expense recorded successfully", "id": expense.id}), 201
