"""
Migration script to add production_docs_settings table.

Stores feature flags for Production Documentation Management System, such as:
- auto_generate_rm_frame
- auto_generate_rm_shutter

Run this once after deployment. Works with both PostgreSQL and SQLite.
"""

from sqlalchemy import text, inspect
from app.db.database import engine


def migrate_add_production_docs_settings():
    """Create production_docs_settings table and insert default row if needed."""
    print("Starting production_docs_settings migration...")

    inspector = inspect(engine)

    with engine.connect() as conn:
        table_names = inspector.get_table_names()

        # Create table if it does not exist
        if "production_docs_settings" not in table_names:
            print("Creating production_docs_settings table...")
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS production_docs_settings (
                        id INTEGER PRIMARY KEY,
                        auto_generate_rm_frame BOOLEAN NOT NULL DEFAULT FALSE,
                        auto_generate_rm_shutter BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                    """
                )
            )
            conn.commit()
            print("[OK] Created production_docs_settings table")
        else:
            print("[SKIP] production_docs_settings table already exists")

        # Ensure there is a default row with id=1
        result = conn.execute(
            text(
                """
                SELECT id FROM production_docs_settings
                WHERE id = 1
                """
            )
        )
        row = result.fetchone()
        if not row:
            print("Inserting default production_docs_settings row (id=1)...")
            conn.execute(
                text(
                    """
                    INSERT INTO production_docs_settings (id, auto_generate_rm_frame, auto_generate_rm_shutter)
                    VALUES (1, FALSE, FALSE)
                    """
                )
            )
            conn.commit()
            print("[OK] Inserted default settings row")
        else:
            print("[SKIP] Default settings row already exists")

        print("\n[SUCCESS] production_docs_settings migration completed!")


if __name__ == "__main__":
    migrate_add_production_docs_settings()

