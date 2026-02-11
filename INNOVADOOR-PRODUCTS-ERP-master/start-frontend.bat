@echo off
echo Starting Frontend Server...
cd frontend
if not exist node_modules (
    echo Installing dependencies...
    npm install
)
echo Starting development server on http://localhost:3000
npm run dev
pause

