#!/bin/bash

echo "====================================="
echo " KPI Calculation System Migration"
echo "====================================="
echo ""

# Prompt for PostgreSQL connection details
read -p "Enter PostgreSQL host (default: localhost): " PGHOST
PGHOST=${PGHOST:-localhost}

read -p "Enter PostgreSQL port (default: 5432): " PGPORT
PGPORT=${PGPORT:-5432}

read -p "Enter PostgreSQL username (default: postgres): " PGUSER
PGUSER=${PGUSER:-postgres}

read -p "Enter database name (default: hyloc_db): " PGDATABASE
PGDATABASE=${PGDATABASE:-hyloc_db}

read -sp "Enter PostgreSQL password: " PGPASSWORD
export PGPASSWORD
echo ""
echo ""

echo "Running migration..."
echo ""

psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f migrations/add-formula-columns.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "====================================="
    echo " Migration completed successfully!"
    echo "====================================="
    echo ""
    echo "Next steps:"
    echo "1. Restart the server: npm run dev"
    echo "2. Restart the client: npm start"
    echo "3. Read KPI_CALCULATION_IMPLEMENTATION.md for usage guide"
else
    echo ""
    echo "====================================="
    echo " Migration failed!"
    echo "====================================="
    echo ""
    echo "Please check:"
    echo "1. PostgreSQL is running"
    echo "2. Connection details are correct"
    echo "3. You have permission to modify the database"
fi

read -p "Press Enter to continue..."
