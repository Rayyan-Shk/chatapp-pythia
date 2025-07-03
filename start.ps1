# Pythia Conversations - PowerShell Startup Script
Write-Host "🚀 Starting Pythia Conversations..." -ForegroundColor Green
docker-compose up --build -d
Write-Host "✅ Done! Frontend: http://localhost:3000" -ForegroundColor Green 