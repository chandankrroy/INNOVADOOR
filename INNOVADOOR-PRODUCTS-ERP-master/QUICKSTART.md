# Quick Start Guide

## Windows Users

### Option 1: Using PowerShell Scripts (Recommended)

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

### Option 2: Using Batch Files

1. **Start Backend:**
   - Double-click `start-backend.bat` from the root directory
   - Or run from command prompt: `start-backend.bat`

2. **Start Frontend:**
   - Double-click `start-frontend.bat` from the root directory
   - Or run from command prompt: `start-frontend.bat`

### Option 3: Using Git Bash

1. **Start Backend:**
   ```bash
   cd backend
   chmod +x start.sh
   ./start.sh
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   chmod +x start.sh
   ./start.sh
   ```

3. **Open Browser:**
   - Navigate to http://localhost:3000
   - Register a new account or login

## Mac/Linux Users

1. **Start Backend:**
   ```bash
   cd backend
   chmod +x start.sh
   ./start.sh
   ```
   Or simply: `bash start.sh`

2. **Start Frontend:**
   ```bash
   cd frontend
   chmod +x start.sh
   ./start.sh
   ```
   Or simply: `bash start.sh`

3. **Open Browser:**
   - Navigate to http://localhost:3000

## Manual Setup

If the scripts don't work, follow the detailed instructions in README.md

## Troubleshooting

- **Backend won't start:** Make sure Python 3.8+ is installed and in your PATH
- **Frontend won't start:** Make sure Node.js 16+ is installed
- **CORS errors:** Make sure backend .env has the correct CORS origins
- **Database errors:** Run `python backend/init_db.py` manually
- **Script opens in text editor instead of running (Windows):**
  - **PowerShell:** Use `.\start.ps1` (you may need to set execution policy first)
  - **Git Bash:** Use `bash start.sh` or `./start.sh` (after `chmod +x start.sh`)
  - **Command Prompt:** Use the `.bat` files from the root directory
  - **PowerShell Execution Policy Error:** Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
  
- **chmod not recognized (Windows PowerShell):**
  - `chmod` is a Unix command. On Windows PowerShell, use the `.ps1` scripts instead
  - Or use Git Bash where `chmod` works

