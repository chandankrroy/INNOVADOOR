# Quick Start Guide

## Starting the Backend Server

### Option 1: Use the Start Script (Recommended)
```powershell
cd backend
.\start.ps1
```

### Option 2: Manual Start
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

### Option 3: From Root Directory
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

## Important Notes

1. **Always run from the `backend` directory** - The FastAPI app is at `app.main:app`, not `main:app`
2. **Activate the virtual environment first** - Use `.\venv\Scripts\Activate.ps1` or the start script does this automatically
3. **Use the correct module path** - It's `app.main:app` (not `main:app`)

## Starting the Frontend

```powershell
cd frontend
npm run dev
```

## Common Errors

### Error: "Could not import module 'main'"
**Solution**: Make sure you're in the `backend` directory and use `app.main:app` as the module path.

### Error: "ModuleNotFoundError: No module named 'fastapi'"
**Solution**: Activate the virtual environment first: `.\venv\Scripts\Activate.ps1`

