import os
import re

APP_DIR = "/Users/yashsmac/Documents/Projects/Dharamshala Management Software/backend/app"

def process_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Ensure import is present if we are injecting get_ist_now
    if 'get_ist_now' not in content:
        content = content.replace('from datetime import datetime', 'from datetime import datetime\nfrom app.utils import get_ist_now, get_ist_date')
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w') as f:
        f.write(content)

# models.py
process_file(f"{APP_DIR}/models.py", [
    ('default=datetime.utcnow', 'default=get_ist_now')
])

# reports.py
process_file(f"{APP_DIR}/routes/reports.py", [
    ('datetime.utcnow().date()', 'get_ist_date()')
])

# expenses.py
process_file(f"{APP_DIR}/routes/expenses.py", [
    ('datetime.utcnow().date()', 'get_ist_date()')
])

# billing.py
process_file(f"{APP_DIR}/routes/billing.py", [
    ('datetime.utcnow()', 'get_ist_now()')
])

# bookings.py
process_file(f"{APP_DIR}/routes/bookings.py", [
    ('datetime.utcnow().date()', 'get_ist_date()'),
    ('datetime.now()', 'get_ist_now()')
])

print("IST updates applied!")
