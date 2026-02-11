"""
Script to check all database tables and their structure
This will display all tables defined in the SQLAlchemy models
"""
import sys
import os

# Add backend to path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Change to backend directory
os.chdir(backend_path)

from sqlalchemy import inspect, create_engine
from app.db.base import Base
from app.core.config import settings

# Import all models to register them
from app.db.models import *

def get_table_info():
    """Get information about all database tables"""
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
    inspector = inspect(engine)
    
    print("=" * 80)
    print("DATABASE TABLES CHECK")
    print("=" * 80)
    print(f"\nDatabase URL: {settings.DATABASE_URL}")
    print(f"Total Tables Found: {len(Base.metadata.tables)}")
    print("\n" + "=" * 80)
    
    # Get all table names from SQLAlchemy metadata
    tables = sorted(Base.metadata.tables.keys())
    
    print("\n📋 ALL DATABASE TABLES:\n")
    for i, table_name in enumerate(tables, 1):
        print(f"{i:3}. {table_name}")
    
    print("\n" + "=" * 80)
    print("\n📊 TABLE STRUCTURE DETAILS:\n")
    
    for table_name in tables:
        table = Base.metadata.tables[table_name]
        print(f"\n{'─' * 80}")
        print(f"Table: {table_name}")
        print(f"{'─' * 80}")
        
        # Get columns
        columns = table.columns
        print(f"  Columns ({len(columns)}):")
        
        for col in columns:
            col_type = str(col.type)
            nullable = "NULL" if col.nullable else "NOT NULL"
            primary_key = "PK" if col.primary_key else ""
            foreign_key = ""
            
            # Check for foreign keys
            for fk in col.foreign_keys:
                foreign_key = f"FK -> {fk.column.table.name}.{fk.column.name}"
            
            constraints = []
            if primary_key:
                constraints.append(primary_key)
            if foreign_key:
                constraints.append(foreign_key)
            
            constraint_str = f" [{', '.join(constraints)}]" if constraints else ""
            
            print(f"    • {col.name:30} {col_type:20} {nullable:10}{constraint_str}")
        
        # Get indexes
        indexes = [idx for idx in table.indexes]
        if indexes:
            print(f"\n  Indexes ({len(indexes)}):")
            for idx in indexes:
                cols = ', '.join([col.name for col in idx.columns])
                unique = "UNIQUE" if idx.unique else ""
                print(f"    • {idx.name:30} ({cols}) {unique}")
    
    # Check if tables exist in actual database
    print("\n" + "=" * 80)
    print("\n🗄️  DATABASE STATUS:\n")
    
    try:
        actual_tables = inspector.get_table_names()
        print(f"Tables in actual database: {len(actual_tables)}")
        
        # Compare SQLAlchemy tables with actual database tables
        defined_tables = set(tables)
        actual_tables_set = set(actual_tables)
        
        missing_in_db = defined_tables - actual_tables_set
        extra_in_db = actual_tables_set - defined_tables
        
        if missing_in_db:
            print(f"\n⚠️  Tables defined in models but NOT in database ({len(missing_in_db)}):")
            for tbl in sorted(missing_in_db):
                print(f"    • {tbl}")
        
        if extra_in_db:
            print(f"\n⚠️  Tables in database but NOT in models ({len(extra_in_db)}):")
            for tbl in sorted(extra_in_db):
                print(f"    • {tbl}")
        
        if not missing_in_db and not extra_in_db:
            print("\n✅ All tables are synchronized between models and database!")
        
    except Exception as e:
        print(f"⚠️  Could not inspect actual database: {e}")
        print("   (This is normal if the database hasn't been initialized yet)")
    
    print("\n" + "=" * 80)
    print("\n✅ Database check completed!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        get_table_info()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

