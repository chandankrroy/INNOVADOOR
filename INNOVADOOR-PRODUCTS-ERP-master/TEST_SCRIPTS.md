# Testing Your Scripts

## Quick Test Commands

### Test Backend Script
```powershell
cd backend
.\start.ps1
```

**What to look for:**
- Should see "Starting Backend Server..." in green
- Should see Python version
- Should see "Activating virtual environment..."
- Should see "Starting server on http://localhost:8000"
- Server should stay running (don't close the window)

### Test Frontend Script
```powershell
cd frontend
.\start.ps1
```

**What to look for:**
- Should see "Starting Frontend Server..." in green
- Should see Node.js version
- Should see npm version
- Should see "Starting development server on http://localhost:3000"
- Server should stay running (don't close the window)

## If Scripts Exit Immediately

The scripts are designed to **keep running** - they start servers that run continuously. If they exit immediately, there's an error.

**Check for:**
1. Error messages in red
2. Missing Python/Node.js
3. Permission issues

## Manual Alternative

If scripts don't work, you can run commands manually:

### Backend (in backend folder):
```powershell
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Frontend (in frontend folder):
```powershell
npm run dev
```

