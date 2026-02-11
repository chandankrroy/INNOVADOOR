# How to Start Both Servers

## Quick Start

### Method 1: Use the Script (Recommended)
```powershell
.\start-both.ps1
```

This opens two PowerShell windows automatically.

### Method 2: Manual Start

You need **TWO terminal windows**:

#### Terminal 1 - Backend Server
```powershell
cd backend
backend\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

#### Terminal 2 - Frontend Server
```powershell
cd frontend
npm run dev
```

## What You Should See

### Backend Terminal:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Frontend Terminal:
```
VITE v5.4.21  ready in 782 ms
➜  Local:   http://localhost:3000/
```

## Common Issues

### "ECONNREFUSED" Errors
- **Problem**: Backend server is not running
- **Solution**: Start the backend server in a separate terminal (see Terminal 1 above)

### "Module not found" Errors
- **Problem**: Wrong virtual environment activated
- **Solution**: Use `backend\venv\Scripts\Activate.ps1` (not root venv)

### Port Already in Use
- **Problem**: Another process is using port 8000 or 3000
- **Solution**: 
  - Find and stop the other process
  - Or use different ports (update vite.config.ts for frontend)

## Verification

1. Open browser to `http://localhost:8000` - should see `{"message":"Welcome to the API"}`
2. Open browser to `http://localhost:3000` - should see the frontend app
3. No proxy errors in frontend terminal
