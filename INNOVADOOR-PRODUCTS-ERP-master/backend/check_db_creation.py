import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import engine, Base
# Import the models to register them with Base
from app.db.models.user import ProductionShutterItem, RawMaterialShutterItem

def main():
    try:
        print("Attempting to create tables via SQLAlchemy...")
        # This will only create tables that don't exist
        Base.metadata.create_all(bind=engine)
        print("Table creation successful or tables already exist.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
