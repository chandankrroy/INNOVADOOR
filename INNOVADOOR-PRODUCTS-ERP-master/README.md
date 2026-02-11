# Full Stack Authentication App

A complete authentication system with FastAPI backend and React frontend.

## Features

- **Role-Based Access Control (RBAC)**: User, Production Manager, and Admin roles
- **Production Documentation Management Portal**: Specialized dashboard for production managers
- User registration with role selection
- User login with JWT token authentication and refresh tokens
- Protected routes with role-based access
- User profile management
- **Production Management Features**:
  - Measurements management (Create, View)
  - Parties management (Create, View)
  - Production Papers management (Create, View, Update)
- SQLite database (can be easily switched to PostgreSQL)

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (if not already created):
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - On Windows:
   ```bash
   venv\Scripts\activate
   ```
   - On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the `backend` directory (copy from `.env.example` if it exists):
```env
DATABASE_URL=sqlite:///./app.db
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://127.0.0.1:3000","http://127.0.0.1:5173"]
SECRET_KEY=your-secret-key-change-this-in-production-to-a-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

6. Initialize the database:
```bash
python init_db.py
```

7. Start the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be running at `http://localhost:8000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be running at `http://localhost:3000`

## Usage

### Quick Start (Using Scripts)

**For Windows users (PowerShell):**

1. **Start Backend:**
   ```powershell
   cd backend
   .\start.ps1
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   .\start.ps1
   ```

**Note:** If you get an execution policy error, run this first:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**For Windows users (Alternative):**
- Use the `.bat` files in the root directory: `start-backend.bat` and `start-frontend.bat`

**For Mac/Linux users (or Windows with Git Bash):**

1. **Start Backend:**
   ```bash
   cd backend
   bash start.sh
   # Or: chmod +x start.sh && ./start.sh
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   bash start.sh
   # Or: chmod +x start.sh && ./start.sh
   ```

### Manual Start

1. Start both the backend and frontend servers (in separate terminals)
2. Open your browser and navigate to `http://localhost:3000`
3. Register a new account or login with existing credentials
4. Access the dashboard after successful authentication

## API Endpoints

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user information (requires authentication)

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   └── endpoints/
│   │   │   │       └── auth.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── models/
│   │   │   └── database.py
│   │   ├── schemas/
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Notes

- The default database is SQLite for easy setup. For production, consider using PostgreSQL.
- Change the `SECRET_KEY` in the `.env` file to a secure random string in production.
- The CORS origins are configured to allow requests from the frontend development server.

