"""
Root-level main.py wrapper for convenience
This allows running uvicorn from the project root

IMPORTANT: You MUST use the backend virtual environment!
Activate it with: backend\venv\Scripts\Activate.ps1

Or use the start script: .\start-backend.ps1
"""
import sys
import os

# Get the backend directory path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, 'backend')

# Verify backend directory exists
if not os.path.exists(backend_path):
    raise ImportError(
        f"Backend directory not found at: {backend_path}\n"
        "Please ensure you're running from the project root directory."
    )

# Add backend directory to Python path
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Change working directory to backend for proper relative imports and database access
original_cwd = os.getcwd()
try:
    os.chdir(backend_path)
    
    # Import the actual FastAPI app
    from app.main import app
    
finally:
    # Restore original working directory (optional, but cleaner)
    os.chdir(original_cwd)

# Export for uvicorn
__all__ = ['app']
