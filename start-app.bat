@echo off
echo 🚀 Starting Pythia Conversations Application...
echo 📋 This will start:
echo    - PostgreSQL Database (port 5432)
echo    - Redis (port 6330)
echo    - FastAPI Backend (port 8000)
echo    - Next.js Frontend (port 3000)
echo.

REM Stop any existing containers
echo 🛑 Stopping any existing containers...
docker-compose down

REM Build and start all services
echo 🔨 Building and starting services...
docker-compose up --build

echo.
echo ✅ Application started successfully!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📊 Health Check: http://localhost:8000/health
pause 