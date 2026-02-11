# 🚀 Quick Start Guide

## ⚠️ Important: Read This First!

**The scripts are designed to KEEP RUNNING** - they start servers that run continuously. 
- Don't close the terminal window while the server is running
- You'll see the server output in the terminal
- Press `Ctrl+C` to stop the server when you're done

## Step-by-Step Instructions

### 1. Start Backend Server

Open PowerShell and run:

```powershell
cd backend
.\start.ps1
```

**What you should see:**
- ✅ "Starting Backend Server..." (green)
- ✅ Python version
- ✅ "Activating virtual environment..."
- ✅ "Starting server on http://localhost:8000" (green)
- ✅ Server logs showing it's running

**Keep this terminal open!** The server is running.

### 2. Start Frontend Server

Open a **NEW** PowerShell window (keep backend running) and run:

```powershell
cd frontend
.\start.ps1
```

**What you should see:**
- ✅ "Starting Frontend Server..." (green)
- ✅ Node.js version
- ✅ npm version
- ✅ "Starting development server on http://localhost:3000" (green)
- ✅ Vite server output

**Keep this terminal open too!** The frontend server is running.

### 3. Open in Browser

Once both servers are running:
- Open your browser
- Go to: `http://localhost:3000`
- You should see your application!

## Troubleshooting

### Script exits immediately with no output
- Make sure you're in the correct directory
- Check if Python/Node.js is installed: `python --version` or `node --version`
- Try running the commands manually (see below)

### "Execution Policy" error
Run this once (one-time setup):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Script shows errors in red
- Read the error message - it will tell you what's wrong
- Common issues: Missing Python, missing Node.js, missing dependencies

## Manual Alternative (If Scripts Don't Work)

### Backend (in backend folder):
```powershell
venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

### Frontend (in frontend folder):
```powershell
npm run dev
```

## Diagnostic Tests

If scripts aren't working, run these diagnostic tests first:

### Test Backend Setup:
```powershell
cd backend
.\test.ps1
```

### Test Frontend Setup:
```powershell
cd frontend
.\test.ps1
```

These will tell you exactly what's missing or wrong.

## Need Help?

Check these files:
- `WINDOWS_SETUP.md` - Detailed Windows setup
- `TEST_SCRIPTS.md` - Testing your scripts
- `README.md` - Full documentation

