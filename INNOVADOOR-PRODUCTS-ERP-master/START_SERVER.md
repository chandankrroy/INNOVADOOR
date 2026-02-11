# How to Start the Server Correctly

## Option 1: From Project Root (Recommended)

1. **Activate the BACKEND virtual environment:**
   ```powershell
   backend\venv\Scripts\Activate.ps1
   ```

2. **Start the server:**
   ```powershell
   uvicorn main:app --reload
   ```

## Option 2: From Backend Directory (Alternative)

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

## Why the Error Happened

You were using the root `venv` which doesn't have FastAPI installed. The backend dependencies are in `backend\venv`.

**Solution**: Always use `backend\venv\Scripts\Activate.ps1` to activate the correct virtual environment!
