import requests
res = requests.post('http://127.0.0.1:5001/api/v1/auth/login', json={'username': 'admin', 'password': 'admin123'})
print("Login:", res.status_code, res.text)
if res.status_code == 200:
    token = res.json()['access_token']
    res2 = requests.get('http://127.0.0.1:5001/api/v1/rooms/', headers={'Authorization': f'Bearer {token}'})
    print("Rooms:", res2.status_code, res2.text)
