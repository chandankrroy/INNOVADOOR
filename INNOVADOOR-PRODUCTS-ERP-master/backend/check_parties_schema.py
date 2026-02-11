import os
import sys
from sqlalchemy import create_engine, inspect, text

# Get DATABASE_URL from .env or use the one I found
DATABASE_URL = "postgresql+psycopg2://postgres:Root@localhost:5432/TestForProject"

def check_schema():
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    
    print(f"Columns in 'parties' table:")
    columns = inspector.get_columns('parties')
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

    # Also try to query directly to see if the field exists but is not in inspector (unlikely)
    with engine.connect() as conn:
        try:
            result = conn.execute(text("SELECT * FROM parties LIMIT 1"))
            print("\nAvailable columns from SELECT *:")
            print(result.keys())
        except Exception as e:
            print(f"\nError querying parties: {e}")

if __name__ == "__main__":
    check_schema()
