from datetime import datetime
from app.utils import get_ist_now, get_ist_date
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) # Admin, Receptionist, Accountant
    users = db.relationship('User', backref='role', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class RoomType(db.Model):
    __tablename__ = 'room_types'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    rooms = db.relationship('Room', backref='room_type', lazy=True)
    rate_plans = db.relationship('RatePlan', backref='room_type', lazy=True)

class RatePlan(db.Model):
    __tablename__ = 'rate_plans'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    room_type_id = db.Column(db.Integer, db.ForeignKey('room_types.id'), nullable=False)
    base_rate = db.Column(db.Numeric(10, 2), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(20), unique=True, nullable=False)
    floor = db.Column(db.String(20), nullable=False)
    room_type_id = db.Column(db.Integer, db.ForeignKey('room_types.id'), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Available') # Available, Reserved, Occupied, Cleaning, Maintenance, Inactive
    amenities = db.Column(db.JSON)
    notes = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)

class Guest(db.Model):
    __tablename__ = 'guests'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    mobile_number = db.Column(db.String(20))
    id_details = db.Column(db.String(255))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=get_ist_now)
    bookings = db.relationship('Booking', backref='guest', lazy=True)

class GuestDocument(db.Model):
    __tablename__ = 'guest_documents'
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey('guests.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    document_type = db.Column(db.String(50), default='ID Proof')
    person_name = db.Column(db.String(150)) # Useful if it's an accompanying family member's ID
    uploaded_at = db.Column(db.DateTime, default=get_ist_now)
    
    guest = db.relationship('Guest', backref=db.backref('documents', lazy=True, cascade="all, delete-orphan"))

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    guest_id = db.Column(db.Integer, db.ForeignKey('guests.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Reserved') # Reserved, CheckedIn, CheckedOut, Cancelled
    source = db.Column(db.String(50), default='Walk-in')
    arrival_date = db.Column(db.Date, nullable=False)
    departure_date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=get_ist_now)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    rooms = db.relationship('BookingRoom', backref='booking', lazy=True, cascade="all, delete-orphan")

class BookingRoom(db.Model):
    __tablename__ = 'booking_rooms'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    occupant_count = db.Column(db.Integer, nullable=False, default=1)
    applied_rate = db.Column(db.Numeric(10, 2), nullable=False)
    room = db.relationship('Room')

class Invoice(db.Model):
    __tablename__ = 'invoices'
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    status = db.Column(db.String(20), default='Draft') # Draft, Issued, Paid, Cancelled
    subtotal = db.Column(db.Numeric(10, 2), default=0.0)
    tax_total = db.Column(db.Numeric(10, 2), default=0.0)
    discount = db.Column(db.Numeric(10, 2), default=0.0)
    total = db.Column(db.Numeric(10, 2), default=0.0)
    issued_date = db.Column(db.DateTime, default=get_ist_now)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    booking = db.relationship('Booking', backref='invoice', uselist=False)
    line_items = db.relationship('InvoiceLineItem', backref='invoice', lazy=True, cascade="all, delete-orphan")
    payments = db.relationship('Payment', backref='invoice', lazy=True, cascade="all, delete-orphan")

class InvoiceLineItem(db.Model):
    __tablename__ = 'invoice_line_items'
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    tax_rate = db.Column(db.Numeric(5, 2), default=0.0)

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50)) # Cash, UPI, Card
    transaction_reference = db.Column(db.String(100))
    payment_date = db.Column(db.DateTime, default=get_ist_now)
    received_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))

class ExpenseCategory(db.Model):
    __tablename__ = 'expense_categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('expense_categories.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.Date, nullable=False, default=get_ist_now)
    description = db.Column(db.String(255), nullable=False)
    vendor_name = db.Column(db.String(150))
    receipt_ref = db.Column(db.String(100)) # Simple text reference for now
    created_at = db.Column(db.DateTime, default=get_ist_now)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    category = db.relationship('ExpenseCategory', backref='expenses')
    created_by = db.relationship('User', foreign_keys=[created_by_id])

class Setting(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50))

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)
    resource = db.Column(db.String(100))
    resource_id = db.Column(db.Integer)
    details = db.Column(db.JSON)
    timestamp = db.Column(db.DateTime, default=get_ist_now)
