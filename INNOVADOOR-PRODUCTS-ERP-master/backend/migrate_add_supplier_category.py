"""
Migration script to add category_id column to suppliers table.

Run this to link suppliers to raw material categories.
Works with both PostgreSQL and SQLite.
"""
from sqlalchemy import text, inspect
from app.db.database import engine


def migrate_add_supplier_category():
    """Add category_id column to suppliers table if it does not exist"""
    print("Starting supplier category_id migration...")

    is_postgres = "postgresql" in str(engine.url).lower() or "postgres" in str(engine.url).lower()
    inspector = inspect(engine)

    with engine.connect() as conn:
        if "suppliers" not in inspector.get_table_names():
            print("[WARN] suppliers table does not exist, skipping")
            return

        columns = [col["name"] for col in inspector.get_columns("suppliers")]
        if "category_id" in columns:
            print("[SKIP] category_id column already exists in suppliers")
            return

        print("Adding category_id column to suppliers table...")
        if is_postgres:
            conn.execute(text("""
                ALTER TABLE suppliers
                ADD COLUMN category_id INTEGER REFERENCES raw_material_categories(id)
            """))
        else:
            conn.execute(text("""
                ALTER TABLE suppliers
                ADD COLUMN category_id INTEGER
            """))
        conn.commit()
        print("[OK] Added category_id column to suppliers")

        if is_postgres:
            try:
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_suppliers_category_id
                    ON suppliers(category_id)
                """))
                conn.commit()
                print("[OK] Created index on suppliers.category_id")
            except Exception as e:
                print(f"[INFO] Could not create index (may already exist): {e}")
        else:
            try:
                conn.execute(text("""
                    CREATE INDEX idx_suppliers_category_id
                    ON suppliers(category_id)
                """))
                conn.commit()
                print("[OK] Created index on suppliers.category_id")
            except Exception as e:
                if "already exists" not in str(e).lower():
                    print(f"[INFO] Could not create index: {e}")

        print("\n[SUCCESS] Supplier category migration completed!")


if __name__ == "__main__":
    migrate_add_supplier_category()
