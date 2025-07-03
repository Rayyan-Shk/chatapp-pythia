@echo off
chcp 65001 >nul
 
echo 🚀 Starting Pythia Conversations...
docker-compose up --build -d
echo ✅ Done! Frontend: http://localhost:3000
pause 