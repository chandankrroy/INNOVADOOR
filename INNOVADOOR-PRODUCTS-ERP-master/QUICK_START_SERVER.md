# Quick Start - Fix Uvicorn Error

## The Problem
You're getting: `ERROR: Error loading ASGI app. Could not import module "main"`

This happens because:
1. You're using the wrong virtual environment (root `venv` instead of `backend\venv`)
2. The `main.py` is in `backend\app\main.py`, not in the root

## The Solution

### Method 1: Use the Start Script (Easiest)
```powershell
.\start-backend.ps1
```

### Method 2: Manual Start (From Project Root)

1. **Activate the BACKEND virtual environment:**
   ```powershell
   backend\venv\Scripts\Activate.ps1
   ```

2. **Start the server:**
   ```powershell
   uvicorn main:app --reload
   ```

### Method 3: Start from Backend Directory

1. **Navigate to backend:**
   ```powershell
   cd backend
   ```

2. **Activate virtual environment:**
   ```powershell
   venv\Scripts\Activate.ps1
   ```

3. **Start the server:**
   ```powershell
   uvicorn app.main:app --reload
   ```

## Important Notes

- ✅ Always use `backend\venv\Scripts\Activate.ps1` (not the root venv)
- ✅ The root `main.py` is now a wrapper that imports from `backend/app/main.py`
- ✅ Make sure you're in the project root when using `uvicorn main:app`

## If You Still Get Errors

1. **Module not found errors**: Make sure `backend\venv` has all dependencies:
   ```powershell
   cd backend
   venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

2. **Import errors**: Make sure you activated the correct venv:
   ```powershell
   # Check which Python you're using
   python --version
   where python
   ```
