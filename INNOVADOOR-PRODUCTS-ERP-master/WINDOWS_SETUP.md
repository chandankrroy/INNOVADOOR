# Windows Setup Guide

## Quick Start for Windows Users

Since you're already in the `backend` directory, here's what to do:

### Option 1: PowerShell (Recommended)

**First time setup (one-time only):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Then run the script:**
```powershell
# You're already in backend directory, so just run:
.\start.ps1
```

**Note:** Make sure you don't have a trailing period (`.`). Use `.\start.ps1` not `.\start.ps1.`

The script will:
- Check if Python is installed
- Create virtual environment if needed
- Install dependencies
- Create .env file if needed
- Initialize database if needed
- Start the server on http://localhost:8000

### Option 2: Use Git Bash

If you have Git Bash installed:
```bash
bash start.sh
```

### Option 3: Use Batch File from Root

Go back to the root directory and use the batch file:
```powershell
cd ..
start-backend.bat
```

## For Frontend

Open a **new** PowerShell window:

```powershell
cd frontend
.\start.ps1
```

## Common Issues

### "chmod is not recognized"
- `chmod` is a Unix command, not available in PowerShell
- Use `.\start.ps1` instead of `chmod +x start.sh`

### "Execution Policy Error"
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- This allows running local PowerShell scripts

### "Cannot find path 'backend\backend'"
- You're already in the backend directory
- Don't run `cd backend` again, just run `.\start.ps1`

## Summary

**Backend (in backend folder):**
```powershell
.\start.ps1
```

**Frontend (in a new terminal, in frontend folder):**
```powershell
cd frontend
.\start.ps1
```

## Important Notes

1. **Scripts keep running** - They start servers that run continuously. Don't close the terminal window!
2. **Use separate terminals** - Run backend and frontend in different PowerShell windows
3. **No trailing period** - Use `.\start.ps1` NOT `.\start.ps1.`
4. **If script exits immediately** - There's an error. Check the error messages in red

## Troubleshooting

### Script exits immediately with no error
- Check if Python/Node.js is installed: `python --version` or `node --version`
- Make sure you're in the correct directory
- Try running commands manually (see TEST_SCRIPTS.md)

### "Cannot be loaded because running scripts is disabled"
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Then try again

### Server starts but browser shows connection refused
- Make sure the server is actually running (check terminal output)
- Wait a few seconds for server to fully start
- Check the URL matches (backend: 8000, frontend: 3000)

