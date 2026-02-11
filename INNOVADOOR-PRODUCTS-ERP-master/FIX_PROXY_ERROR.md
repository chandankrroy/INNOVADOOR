# Fix Proxy Connection Error (ECONNREFUSED)

## The Problem
You're seeing errors like:
```
[vite] http proxy error: /api/v1/auth/me
AggregateError [ECONNREFUSED]
```

This means:
- ✅ Frontend is running on `http://localhost:3000`
- ❌ Backend is NOT running on `http://localhost:8000`

The Vite proxy is trying to forward API requests to the backend, but can't connect because the backend server isn't running.

## The Solution

### Option 1: Use the Start Script (Easiest)
```powershell
.\start-both.ps1
```

This will open two PowerShell windows - one for backend, one for frontend.

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```powershell
cd backend
backend\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Option 3: From Project Root

**Terminal 1 - Backend:**
```powershell
backend\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## Verify It's Working

1. **Backend should show:**
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

2. **Frontend should show:**
   ```
   ➜  Local:   http://localhost:3000/
   ```

3. **No more proxy errors** in the frontend terminal

## Troubleshooting

### Backend won't start?
- Make sure you're using `backend\venv\Scripts\Activate.ps1` (not root venv)
- Check if port 8000 is already in use
- Verify dependencies: `cd backend && pip install -r requirements.txt`

### Still getting proxy errors?
- Make sure backend is actually running (check the terminal)
- Try accessing `http://localhost:8000` directly in your browser
- Check if firewall is blocking the connection

### Port already in use?
- Change backend port: `uvicorn app.main:app --reload --port 8001`
- Update `frontend/vite.config.ts` proxy target to `http://localhost:8001`
