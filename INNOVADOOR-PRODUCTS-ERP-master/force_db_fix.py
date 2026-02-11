
import sys
import os
from sqlalchemy import create_engine, text

# Hardcoded DB URL
DATABASE_URL = "postgresql+psycopg2://postgres:Root@localhost:5432/TestForProject"

def fix_db():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            print("Connected.")
            
            columns = [
                "total_quantity", "wall_type", "rebate", "sub_frame", 
                "construction", "cover_moulding", "frontside_laminate", 
                "backside_laminate", "grade", "side_frame", "filler", 
                "foam_bottom", "frp_coating"
            ]
            
            for col in columns:
                print(f"Adding {col}...")
                try:
                    conn.execute(text(f"ALTER TABLE production_papers ADD COLUMN IF NOT EXISTS {col} VARCHAR"))
                    print(f" - Done")
                except Exception as e:
                    print(f" - Error (ignored): {e}")
            
            conn.commit()
            print("Migration completed successfully.")
            
    except Exception as e:
        print(f"FATAL ERROR: {e}")

if __name__ == "__main__":
    fix_db()
