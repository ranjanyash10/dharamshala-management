# Dharamshala Management System

## Project Structure
- `frontend/`: React + TypeScript + Vite + Tailwind CSS
- `backend/`: Flask + PostgreSQL + SQLAlchemy

## Phase 1 Setup

### Backend setup
1. `cd backend`
2. `python3 -m venv venv`
3. `source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `cp .env.example .env`
6. `python run.py`

Backend will run on http://localhost:5000/
Health check API: http://localhost:5000/api/v1/health

### Frontend setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend will run on http://localhost:5173/ (or similar Vite port).
