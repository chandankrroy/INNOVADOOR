
from sqlalchemy import text, inspect
from app.db.database import engine

def fix_missing_columns():
    print("Checking for missing columns in production_papers...")
    try:
        inspector = inspect(engine)
        all_tables = inspector.get_table_names()
        
        # Check and create production_shutter_items if missing
        if 'production_shutter_items' not in all_tables:
            print("Creating missing table: production_shutter_items")
            with engine.connect() as conn:
                conn.execute(text("""
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
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_psi_pp_id ON production_shutter_items(production_paper_id)"))
                conn.commit()
                print("  - Created production_shutter_items")

        # Check and create raw_material_shutter_items if missing
        if 'raw_material_shutter_items' not in all_tables:
            print("Creating missing table: raw_material_shutter_items")
            with engine.connect() as conn:
                conn.execute(text("""
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
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_rmsi_pp_id ON raw_material_shutter_items(production_paper_id)"))
                conn.commit()
                print("  - Created raw_material_shutter_items")

        if 'production_papers' not in all_tables:
            return
            
        columns = {col['name'] for col in inspector.get_columns('production_papers')}
        
        required_columns = [
            "total_quantity", "wall_type", "rebate", "sub_frame", 
            "construction", "cover_moulding", "frontside_laminate", 
            "backside_laminate", "grade", "side_frame", "filler", 
            "foam_bottom", "frp_coating", "frontside_design", "backside_design", "core",
            "raw_material_order_status"
        ]
        
        with engine.connect() as conn:
            for col in required_columns:
                if col not in columns:
                    print(f"Adding missing column: {col}")
                    try:
                        conn.execute(text(f"ALTER TABLE production_papers ADD COLUMN IF NOT EXISTS {col} VARCHAR"))
                        print(f"  - Added {col}")
                    except Exception as e:
                        print(f"  - Failed to add {col}: {e}")
            conn.commit()
            print("Database schema check completed.")
            
    except Exception as e:
        print(f"Error checking/fixing database schema: {e}")
