# How to Start Both Frontend and Backend

## The Problem
You're seeing `ECONNREFUSED` errors because the **backend server is not running**. The frontend is trying to connect to `http://localhost:8000` but nothing is listening there.

## Solution: Start Both Servers

You need **TWO terminal windows** - one for backend, one for frontend.

### Terminal 1: Start Backend Server

**Option A: Use the start script (Recommended)**
```powershell
.\start-backend.ps1
```

**Option B: Manual start**
```powershell
# Navigate to backend
cd backend

# Activate virtual environment
venv\Scripts\Activate.ps1

# Start server
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Terminal 2: Start Frontend Server

```powershell
# Navigate to frontend
cd frontend

# Start dev server
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 782 ms
➜  Local:   http://localhost:3000/
```

## Quick Start Script

You can also create a script to start both. Here's a PowerShell script:

```powershell
# Start both servers
# Save as: start-all.ps1

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"

# Start frontend in current window
cd frontend
npm run dev
```

## Verify Backend is Running

1. Open browser: http://localhost:8000
2. You should see: `{"message":"Welcome to the API"}`
3. Check API docs: http://localhost:8000/docs

## Common Issues

### Port 8000 already in use
```powershell
# Find what's using port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill the process or use a different port
uvicorn app.main:app --reload --port 8001
```

Then update `frontend/vite.config.ts`:
```typescript
target: 'http://localhost:8001',
```

### Backend starts but frontend still can't connect
1. Check CORS settings in `backend/app/main.py`
2. Verify backend is actually running: http://localhost:8000/docs
3. Check browser console for specific error messages

## Order of Operations

1. ✅ **First**: Start backend server (Terminal 1)
2. ✅ **Then**: Start frontend server (Terminal 2)
3. ✅ **Finally**: Open browser to http://localhost:3000
