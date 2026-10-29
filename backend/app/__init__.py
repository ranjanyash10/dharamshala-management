import os
from flask import Flask
from flask_cors import CORS

def create_app(config_class=None):
    app = Flask(__name__)
    
    if config_class is None:
        app.config.from_object('config.Config')
    else:
        app.config.from_object(config_class)

    from app.extensions import db, migrate, jwt
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    CORS(app)

    # Import models for Flask-Migrate
    from app import models

    # Register Blueprints
    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.rooms import rooms_bp
    from app.routes.bookings import bookings_bp
    from app.routes.reports import reports_bp
    from app.routes.billing import billing_bp
    from app.routes.expenses import expenses_bp
    from app.routes.settings import settings_bp
    from app.routes.guests import guests_bp
    from app.routes.users import users_bp
    
    app.register_blueprint(health_bp, url_prefix='/api/v1')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(rooms_bp, url_prefix='/api/v1/rooms')
    app.register_blueprint(bookings_bp, url_prefix='/api/v1/bookings')
    app.register_blueprint(reports_bp, url_prefix='/api/v1/reports')
    app.register_blueprint(billing_bp, url_prefix='/api/v1/billing')
    app.register_blueprint(expenses_bp, url_prefix='/api/v1/expenses')
    app.register_blueprint(settings_bp, url_prefix='/api/v1/settings')
    app.register_blueprint(guests_bp, url_prefix='/api/v1/guests')
    app.register_blueprint(users_bp, url_prefix='/api/v1/users')

    from flask import send_from_directory
    upload_dir = os.path.join(app.root_path, '..', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(upload_dir, filename)

    return app
