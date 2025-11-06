@echo off
echo Updating Satellite Catalog...
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

REM Run the catalog update
python update_catalog.py

echo.
echo 📁 Catalog file: fullcatalog.txt
echo 🌐 Ready to use in browser: http://localhost:8000/index_daynight.html
echo.
pause
