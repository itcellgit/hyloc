# Hyloc - Development Setup Guide

This document provides instructions for setting up and running the Hyloc application.

## Quick Start

### Prerequisites
- Node.js v14+ installed
- PostgreSQL v12+ installed and running
- npm or yarn package manager

### Step 1: Database Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE hyloc_db;"

# Apply schema
psql -U postgres -d hyloc_db -f server/src/config/db.sql
```

### Step 2: Start Server
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### Step 3: Start Client
```bash
cd client
npm install
npm start
```
Client runs on `http://localhost:3000`

## Troubleshooting

**PostgreSQL Connection Error**: Verify connection details in `server/.env`

**Port Already in Use**: Change PORT in `.env` and `client/src/services/api.js`

**CORS Error**: Ensure server is running and API URL is correct in client

## Project Documentation

See [README.md](../README.md) for complete project documentation.
