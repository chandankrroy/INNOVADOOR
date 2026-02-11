import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    try:
        print("Creating production_shutter_items table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS production_shutter_items (
                id SERIAL PRIMARY KEY,
                production_paper_id INTEGER NOT NULL REFERENCES production_papers(id) ON DELETE CASCADE,
                item_no VARCHAR,
                ro_width VARCHAR,
                ro_height VARCHAR,
                thickness VARCHAR,
                quantity INTEGER,
                sq_ft DOUBLE PRECISION,
                sq_meter DOUBLE PRECISION,
                laminate_sheets DOUBLE PRECISION,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_psi_pp_id ON production_shutter_items(production_paper_id)"))
        print("[OK] Created production_shutter_items table and index")

        print("Creating raw_material_shutter_items table...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS raw_material_shutter_items (
                id SERIAL PRIMARY KEY,
                production_paper_id INTEGER NOT NULL REFERENCES production_papers(id) ON DELETE CASCADE,
                item_no VARCHAR,
                ro_width VARCHAR,
                ro_height VARCHAR,
                thickness VARCHAR,
                quantity INTEGER,
                sq_ft DOUBLE PRECISION,
                sq_meter DOUBLE PRECISION,
                laminate_sheets DOUBLE PRECISION,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_rmsi_pp_id ON raw_material_shutter_items(production_paper_id)"))
        print("[OK] Created raw_material_shutter_items table and index")

        db.commit()
        print("\nMigration completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"\nError during migration: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
