@echo off
cd backend
venv\Scripts\python.exe migrate_add_frame_columns_to_production_papers.py > ..\migration_log_3.txt 2>&1
type ..\migration_log_3.txt
