@echo off
echo Starting Backend Server...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
if not exist .env (
    echo Creating .env file...
    echo DATABASE_URL=sqlite:///./app.db > .env
    echo BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"] >> .env
    echo SECRET_KEY=your-secret-key-change-this-in-production-to-a-random-string >> .env
    echo ALGORITHM=HS256 >> .env
    echo ACCESS_TOKEN_EXPIRE_MINUTES=30 >> .env
)
pip install -r requirements.txt
if not exist app.db (
    echo Initializing database...
    python init_db.py
)
echo Starting server on http://localhost:8000
uvicorn app.main:app --reload --port 8000
pause

