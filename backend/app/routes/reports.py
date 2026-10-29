from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models import Room, Booking, Payment, Expense
from app.extensions import db
from datetime import datetime
from app.utils import get_ist_now, get_ist_date, timedelta
from sqlalchemy import func

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard_stats():
    total_rooms = Room.query.count()
    available_rooms = Room.query.filter(Room.status.in_(['Available', 'Cleaning'])).count()
    occupied_rooms = Room.query.filter_by(status='Occupied').count()
    active_bookings = Booking.query.filter_by(status='CheckedIn').count()
    reserved_rooms = Room.query.filter_by(status='Reserved').count()
    
    occupancy_rate = round((occupied_rooms / total_rooms) * 100, 1) if total_rooms > 0 else 0

    today = get_ist_date()
    start_of_month = today.replace(day=1)

    # Today's Financials
    today_payments = db.session.query(func.sum(Payment.amount)).filter(func.date(Payment.payment_date) == today).scalar() or 0
    today_expenses = db.session.query(func.sum(Expense.amount)).filter(Expense.date == today).scalar() or 0

    # Monthly Financials
    monthly_payments = db.session.query(func.sum(Payment.amount)).filter(func.date(Payment.payment_date) >= start_of_month).scalar() or 0
    monthly_expenses = db.session.query(func.sum(Expense.amount)).filter(Expense.date >= start_of_month).scalar() or 0

    # Chart Data (Last 7 Days)
    chart_data = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        rev = db.session.query(func.sum(Payment.amount)).filter(func.date(Payment.payment_date) == d).scalar() or 0
        exp = db.session.query(func.sum(Expense.amount)).filter(Expense.date == d).scalar() or 0
        chart_data.append({
            "name": d.strftime("%a"), # Mon, Tue, etc.
            "revenue": float(rev),
            "expenses": float(exp)
        })

    return jsonify({
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "occupied_rooms": occupied_rooms,
        "active_bookings": active_bookings,
        "reserved_rooms": reserved_rooms,
        "occupancy_rate": occupancy_rate,
        "today_revenue": float(today_payments),
        "today_expenses": float(today_expenses),
        "monthly_revenue": float(monthly_payments),
        "monthly_expenses": float(monthly_expenses),
        "chart_data": chart_data
    }), 200

from flask import request

@reports_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_report_summary():
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    # Parse dates or default to this month
    if start_date_str:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    else:
        start_date = get_ist_date().replace(day=1)
        
    if end_date_str:
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    else:
        end_date = get_ist_date()

    # Query Payments
    payments = Payment.query.filter(func.date(Payment.payment_date) >= start_date, func.date(Payment.payment_date) <= end_date).all()
    total_revenue = sum(float(p.amount) for p in payments)
    
    # Query Expenses 
    expenses = Expense.query.filter(Expense.date >= start_date, Expense.date <= end_date).all()
    total_expenses = sum(float(e.amount) for e in expenses)

    # Breakdown by Method
    method_breakdown = {}
    for p in payments:
        method_breakdown[p.payment_method] = method_breakdown.get(p.payment_method, 0.0) + float(p.amount)
        
    # Breakdown by Expense Category
    expense_breakdown = {}
    for e in expenses:
        cat_name = e.category.name if e.category else "Uncategorized"
        expense_breakdown[cat_name] = expense_breakdown.get(cat_name, 0.0) + float(e.amount)

    return jsonify({
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_income": total_revenue - total_expenses,
        "method_breakdown": method_breakdown,
        "expense_breakdown": expense_breakdown
    }), 200
