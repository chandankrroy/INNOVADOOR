# Fix ECONNREFUSED Error

## What This Error Means

`ECONNREFUSED` means the frontend cannot connect to the backend server because:
- ❌ The backend server is **not running**
- ❌ The backend server is running on a **different port**
- ❌ The backend server **crashed** or **failed to start**

## Quick Fix

### Step 1: Start the Backend Server

Open a **new terminal window** and run:

```powershell
# Option 1: Use the start script
.\start-backend.ps1

# Option 2: Manual start
cd backend
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Verify it's running:**
- Open http://localhost:8000 in your browser
- You should see: `{"message":"Welcome to the API"}`
- Or check: http://localhost:8000/docs (API documentation)

### Step 2: Keep Frontend Running

The frontend should automatically reconnect once the backend is running. You should see the proxy errors stop.

## Use the All-in-One Script

I've created `start-all.ps1` that starts both servers:

```powershell
.\start-all.ps1
```

This will:
1. Open backend server in a new window
2. Start frontend server in current window

## Verify Everything Works

1. ✅ Backend: http://localhost:8000/docs (should show API docs)
2. ✅ Frontend: http://localhost:3000 (should load without proxy errors)
3. ✅ Check terminal: No more `ECONNREFUSED` errors

## Common Issues

### "Port 8000 already in use"
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 8000

# Kill the process or use different port
uvicorn app.main:app --reload --port 8001
```

Then update `frontend/vite.config.ts`:
```typescript
target: 'http://localhost:8001',
```

### Backend starts but immediately crashes
- Check for Python errors in the backend terminal
- Verify database is accessible
- Check `.env` file exists in `backend/` directory

### Frontend still shows errors after backend starts
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for specific errors
- Verify CORS settings in backend

## Summary

**The fix is simple: Start the backend server!**

The frontend is working fine - it just needs the backend to be running on port 8000.
