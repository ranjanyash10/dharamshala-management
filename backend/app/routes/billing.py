from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Invoice, InvoiceLineItem, Payment, Booking, BookingRoom
from app.extensions import db
from datetime import datetime
from app.utils import get_ist_now, get_ist_date

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/invoices', methods=['GET'])
@jwt_required()
def get_invoices():
    invoices = Invoice.query.order_by(Invoice.issued_date.desc()).all()
    result = []
    for inv in invoices:
        result.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "guest_name": inv.booking.guest.full_name,
            "status": inv.status,
            "total": str(inv.total),
            "issued_date": inv.issued_date.isoformat()
        })
    return jsonify(result), 200

@billing_bp.route('/bookings/<int:booking_id>/invoice', methods=['GET', 'POST'])
@jwt_required()
def manage_booking_invoice(booking_id):
    current_user_id = int(get_jwt_identity())
    booking = Booking.query.get_or_404(booking_id)
    
    # Check if invoice already exists
    invoice = Invoice.query.filter_by(booking_id=booking.id).first()
    
    if not invoice:
        # Generate new invoice
        nights = (booking.departure_date - booking.arrival_date).days
        if nights <= 0:
            nights = 1
            
        inv_number = f"INV-{booking.id}-{get_ist_now().strftime('%Y%m%d%H%M')}"
        invoice = Invoice(
            invoice_number=inv_number,
            booking_id=booking.id,
            status='Draft',
            created_by_id=current_user_id
        )
        db.session.add(invoice)
        db.session.flush() # get id
        
        subtotal = 0.0
        # Create line items for rooms
        for br in booking.rooms:
            amount = float(br.applied_rate) * nights
            li = InvoiceLineItem(
                invoice_id=invoice.id,
                description=f"Room {br.room.room_number} for {nights} nights",
                amount=amount,
                tax_rate=0.0 # Simplify tax for now
            )
            db.session.add(li)
            subtotal += amount
            
        invoice.subtotal = subtotal
        invoice.total = subtotal # Assuming no tax for now
        db.session.commit()
        
    if not invoice:
        return jsonify({"message": "No invoice found for this booking"}), 404
        
    # Calculate stay duration
    nights = (booking.departure_date - booking.arrival_date).days if booking.departure_date and booking.arrival_date else 1
    if nights <= 0:
        nights = 1

    occupant_count = sum(br.occupant_count for br in booking.rooms) if booking.rooms else 1

    # Build payload
    data = {
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "status": invoice.status,
        "subtotal": str(invoice.subtotal),
        "total": str(invoice.total),
        "guest_name": booking.guest.full_name,
        "issued_date": invoice.issued_date.isoformat(),
        "line_items": [{"id": li.id, "description": li.description, "amount": str(li.amount)} for li in invoice.line_items],
        "payments": [{"id": p.id, "amount": str(p.amount), "method": p.payment_method, "date": p.payment_date.isoformat()} for p in invoice.payments],
        "booking_details": {
            "booking_id": booking.id,
            "guest_name": booking.guest.full_name,
            "mobile_number": booking.guest.mobile_number,
            "id_details": booking.guest.id_details,
            "address": booking.guest.address,
            "arrival_date": booking.arrival_date.isoformat() if booking.arrival_date else None,
            "departure_date": booking.departure_date.isoformat() if booking.departure_date else None,
            "occupant_count": occupant_count,
            "nights": nights,
            "rooms": [{
                "room_number": br.room.room_number,
                "type": br.room.room_type.name if br.room.room_type else "Standard",
                "floor": br.room.floor,
                "rate": str(br.applied_rate)
            } for br in booking.rooms]
        }
    }
    
    return jsonify(data), 200

@billing_bp.route('/invoices/<int:id>/pay', methods=['POST'])
@jwt_required()
def pay_invoice(id):
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    amount = float(data.get('amount', 0))
    method = data.get('payment_method', 'Cash')
    
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400
        
    invoice = Invoice.query.get_or_404(id)
    
    if invoice.status == 'Paid':
        return jsonify({"message": "Invoice already fully paid"}), 400
        
    payment = Payment(
        invoice_id=invoice.id,
        amount=amount,
        payment_method=method,
        received_by_id=current_user_id
    )
    db.session.add(payment)
    db.session.flush()
    
    # Check if fully paid
    total_paid = sum([float(p.amount) for p in invoice.payments])
    if total_paid >= float(invoice.total):
        invoice.status = 'Paid'
    else:
        invoice.status = 'Issued'
        
    db.session.commit()
    
    return jsonify({"message": "Payment recorded successfully", "status": invoice.status}), 200

@billing_bp.route('/invoices/<int:id>/line_items', methods=['POST'])
@jwt_required()
def add_invoice_line_item(id):
    data = request.get_json()
    description = data.get('description', 'Extra Charge')
    amount = float(data.get('amount', 0))
    
    if amount <= 0:
        return jsonify({"message": "Invalid amount"}), 400
        
    invoice = Invoice.query.get_or_404(id)
    
    if invoice.status == 'Paid':
        return jsonify({"message": "Cannot add charges to a paid invoice"}), 400
        
    li = InvoiceLineItem(
        invoice_id=invoice.id,
        description=description,
        amount=amount
    )
    db.session.add(li)
    
    # Update totals
    invoice.subtotal = float(invoice.subtotal) + amount
    invoice.total = float(invoice.total) + amount
    invoice.status = 'Issued' # Re-issue if it was draft or partially paid
    
    db.session.commit()
    
    return jsonify({"message": "Charge added successfully"}), 201

@billing_bp.route('/invoices/all', methods=['GET'])
@jwt_required()
def get_all_invoices():
    # Fetch all invoices ordered by latest first
    invoices = Invoice.query.order_by(Invoice.issued_date.desc()).all()
    result = []
    for inv in invoices:
        guest_name = inv.booking.guest.full_name if inv.booking and inv.booking.guest else "Unknown"
        result.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "booking_id": inv.booking_id,
            "guest_name": guest_name,
            "status": inv.status,
            "total": str(inv.total),
            "issued_date": inv.issued_date.isoformat()
        })
    return jsonify(result), 200

@billing_bp.route('/payments/all', methods=['GET'])
@jwt_required()
def get_all_payments():
    # Fetch all payments ordered by latest first
    payments = Payment.query.order_by(Payment.payment_date.desc()).all()
    result = []
    for pay in payments:
        inv = pay.invoice
        guest_name = inv.booking.guest.full_name if inv and inv.booking and inv.booking.guest else "Unknown"
        result.append({
            "id": pay.id,
            "invoice_number": inv.invoice_number if inv else "Unknown",
            "guest_name": guest_name,
            "amount": str(pay.amount),
            "payment_method": pay.payment_method,
            "transaction_reference": pay.transaction_reference,
            "payment_date": pay.payment_date.isoformat()
        })
    return jsonify(result), 200
