from app.auto_migrate import fix_missing_columns
import os
import sys

# Add the current directory to sys.path
sys.path.append(os.getcwd())

if __name__ == "__main__":
    print("Running auto-migration manually...")
    fix_missing_columns()
    print("Manual migration run finished.")
