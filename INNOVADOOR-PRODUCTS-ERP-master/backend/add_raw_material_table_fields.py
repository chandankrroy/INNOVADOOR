"""
Migration script to add new fields to raw_material_shutter_items table:
- sr_no (String)
- bldg_wings (String)
- updated_at (DateTime)

Run this script to update the database schema.
"""
from app.db.database import engine
from sqlalchemy import text, inspect

def migrate_raw_material_table():
    """Add new fields to raw_material_shutter_items table"""
    inspector = inspect(engine)
    
    try:
        # Check if table exists
        if 'raw_material_shutter_items' not in inspector.get_table_names():
            print("Table 'raw_material_shutter_items' does not exist. Creating it...")
            # Table will be created by SQLAlchemy models
            return
        
        # Get existing columns
        columns = {col['name'] for col in inspector.get_columns('raw_material_shutter_items')}
        
        with engine.connect() as conn:
            # Add sr_no column if it doesn't exist
            if 'sr_no' not in columns:
                print("Adding 'sr_no' column...")
                conn.execute(text("ALTER TABLE raw_material_shutter_items ADD COLUMN sr_no VARCHAR"))
                print("✓ Added 'sr_no' column")
            else:
                print("✓ 'sr_no' column already exists")
            
            # Add bldg_wings column if it doesn't exist
            if 'bldg_wings' not in columns:
                print("Adding 'bldg_wings' column...")
                conn.execute(text("ALTER TABLE raw_material_shutter_items ADD COLUMN bldg_wings VARCHAR"))
                print("✓ Added 'bldg_wings' column")
            else:
                print("✓ 'bldg_wings' column already exists")
            
            # Add updated_at column if it doesn't exist
            if 'updated_at' not in columns:
                print("Adding 'updated_at' column...")
                conn.execute(text("ALTER TABLE raw_material_shutter_items ADD COLUMN updated_at TIMESTAMP"))
                print("✓ Added 'updated_at' column")
            else:
                print("✓ 'updated_at' column already exists")
            
            # Remove item_no if it exists (replaced by sr_no)
            if 'item_no' in columns and 'sr_no' in columns:
                print("Note: 'item_no' column exists. Consider migrating data to 'sr_no' if needed.")
            
            conn.commit()
            print("\n✓ Migration completed successfully!")
            
    except Exception as e:
        print(f"✗ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    print("Starting raw_material_shutter_items table migration...")
    migrate_raw_material_table()
