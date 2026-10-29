from app import create_app

app = create_app()

with app.app_context():
    try:
        from seed import seed_database
        seed_database()
    except Exception as e:
        print(f"Database initialization note: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
