@echo off
echo Attempting to fix database columns...
echo Target Script: c:\Users\sagar\OneDrive\Desktop\Projects\backend\apply_sql_fix.py

echo Trying backend venv...
"c:\Users\sagar\OneDrive\Desktop\Projects\backend\venv\Scripts\python.exe" "c:\Users\sagar\OneDrive\Desktop\Projects\backend\apply_sql_fix.py"
if %errorlevel% equ 0 goto success

echo Backend venv failed. Trying root venv...
"c:\Users\sagar\OneDrive\Desktop\Projects\venv\Scripts\python.exe" "c:\Users\sagar\OneDrive\Desktop\Projects\backend\apply_sql_fix.py"
if %errorlevel% equ 0 goto success

echo Root venv failed. Trying system python...
python "c:\Users\sagar\OneDrive\Desktop\Projects\backend\apply_sql_fix.py"
if %errorlevel% equ 0 goto success

echo.
echo [ERROR] All attempts failed.
echo Please manually run the SQL in 'backend/fix_production_papers.sql' using your database tool.
goto end

:success
echo.
echo [SUCCESS] Database columns check/fix completed.
echo Please restart your backend server now.

:end
pause
