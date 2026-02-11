@echo off
echo Verifying database columns...
"c:\Users\sagar\OneDrive\Desktop\Projects\venv\Scripts\python.exe" "c:\Users\sagar\OneDrive\Desktop\Projects\backend\verify_columns_file.py"

if exist "verification_result.txt" (
    type verification_result.txt
    del verification_result.txt
) else (
    if exist "backend\verification_result.txt" (
        type backend\verification_result.txt
        del backend\verification_result.txt
    ) else (
        echo [UNKNOWN] Could not find verification result file.
    )
)
pause
