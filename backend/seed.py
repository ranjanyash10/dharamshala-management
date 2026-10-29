from app import create_app
from app.extensions import db
from app.models import Role, User, RoomType, RatePlan, Room

app = create_app()

def seed_database():
    with app.app_context():
        # Create tables
        db.create_all()

        # Seed Roles
        roles = ['Admin', 'Receptionist', 'Accountant']
        for r_name in roles:
            if not Role.query.filter_by(name=r_name).first():
                db.session.add(Role(name=r_name))
        db.session.commit()

        # Seed Admin User
        admin_role = Role.query.filter_by(name='Admin').first()
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', role_id=admin_role.id)
            admin.set_password('admin123')
            db.session.add(admin)
        db.session.commit()

        # Seed Room Types and Rate Plans
        room_types_data = [
            {'name': 'Standard', 'desc': 'Basic comfortable room', 'rate': 1500.00},
            {'name': 'Deluxe', 'desc': 'Spacious room with better amenities', 'rate': 2500.00},
            {'name': 'Suite', 'desc': 'Premium suite with living area', 'rate': 4500.00}
        ]
        
        type_objs = {}
        for rt_data in room_types_data:
            rt = RoomType.query.filter_by(name=rt_data['name']).first()
            if not rt:
                rt = RoomType(name=rt_data['name'], description=rt_data['desc'])
                db.session.add(rt)
                db.session.commit()
            
            type_objs[rt_data['name']] = rt
            
            if not RatePlan.query.filter_by(name=f"{rt.name} Base").first():
                rp = RatePlan(name=f"{rt.name} Base", room_type_id=rt.id, base_rate=rt_data['rate'])
                db.session.add(rp)
        db.session.commit()

        # Seed 70 Rooms
        if Room.query.count() == 0:
            rooms_to_add = []
            
            for i in range(1, 71):
                if i <= 20:
                    r_type = type_objs['Standard'].id
                    cap = 2
                    floor = "1"
                    amenities = {"wifi": True, "ac": False}
                elif i <= 45:
                    r_type = type_objs['Deluxe'].id
                    cap = 2
                    floor = "2"
                    amenities = {"wifi": True, "ac": True, "tv": True}
                else:
                    r_type = type_objs['Suite'].id
                    cap = 4
                    floor = "3"
                    amenities = {"wifi": True, "ac": True, "tv": True, "minibar": True}
                    
                rooms_to_add.append(Room(
                    room_number=str(i),
                    floor=floor,
                    room_type_id=r_type,
                    capacity=cap,
                    amenities=amenities
                ))
                
            db.session.bulk_save_objects(rooms_to_add)
            db.session.commit()
            print("Successfully seeded 70 rooms (numbered 1-70).")
        else:
            print("Rooms already seeded.")
            
        # Seed Expense Categories
        from app.models import ExpenseCategory
        expense_cats = [
            'Salary & Wages',
            'Electricity & Utilities',
            'Maintenance & Repairs',
            'Kitchen & Bhojanalay',
            'Cleaning Supplies',
            'Miscellaneous'
        ]
        for cat_name in expense_cats:
            if not ExpenseCategory.query.filter_by(name=cat_name).first():
                db.session.add(ExpenseCategory(name=cat_name))
        db.session.commit()
            
        print("Database seeding completed!")

if __name__ == '__main__':
    seed_database()
