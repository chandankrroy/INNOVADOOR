"""
Migration script to add raw_material_order_status column to production_papers table.

Allowed values: pending, issued, progress, received.
Default: pending.
Run once. Works with both PostgreSQL and SQLite.
"""
from sqlalchemy import text, inspect
from app.db.database import engine

ALLOWED_STATUSES = ("pending", "issued", "progress", "received")


def migrate_add_raw_material_order_status():
    """Add raw_material_order_status column to production_papers if it does not exist"""
    print("Starting raw_material_order_status migration...")

    inspector = inspect(engine)

    with engine.connect() as conn:
        if "production_papers" not in inspector.get_table_names():
            print("[WARN] production_papers table does not exist, skipping")
            return

        columns = [col["name"] for col in inspector.get_columns("production_papers")]
        if "raw_material_order_status" in columns:
            print("[SKIP] raw_material_order_status column already exists in production_papers")
            return

        print("Adding raw_material_order_status column to production_papers...")
        conn.execute(text("""
            ALTER TABLE production_papers
            ADD COLUMN raw_material_order_status VARCHAR NOT NULL DEFAULT 'pending'
        """))
        conn.commit()
        print("[OK] Added raw_material_order_status column")

        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_production_papers_raw_material_order_status
                ON production_papers(raw_material_order_status)
            """))
            conn.commit()
            print("[OK] Created index on production_papers.raw_material_order_status")
        except Exception as e:
            if "already exists" not in str(e).lower():
                print(f"[INFO] Index creation: {e}")

        print("\n[SUCCESS] raw_material_order_status migration completed!")


if __name__ == "__main__":
    migrate_add_raw_material_order_status()
