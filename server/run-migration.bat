@echo off
echo =====================================
echo  KPI Calculation System Migration
echo =====================================
echo.

REM Prompt for PostgreSQL connection details
set /p PGHOST="Enter PostgreSQL host (default: localhost): " || set PGHOST=localhost
set /p PGPORT="Enter PostgreSQL port (default: 5432): " || set PGPORT=5432
set /p PGUSER="Enter PostgreSQL username (default: postgres): " || set PGUSER=postgres
set /p PGDATABASE="Enter database name (default: hyloc_db): " || set PGDATABASE=hyloc_db
set /p PGPASSWORD="Enter PostgreSQL password: "

echo.
echo Running migration...
echo.

psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f migrations\add-formula-columns.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================
    echo  Migration completed successfully!
    echo =====================================
    echo.
    echo Next steps:
    echo 1. Restart the server: npm run dev
    echo 2. Restart the client: npm start
    echo 3. Read KPI_CALCULATION_IMPLEMENTATION.md for usage guide
) else (
    echo.
    echo =====================================
    echo  Migration failed!
    echo =====================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Connection details are correct
    echo 3. You have permission to modify the database
)

pause
