# Korean Learning App - Quick Start Guide

Write-Host "🚀 Starting Korean Learning App Development Environment..." -ForegroundColor Green

Write-Host ""
Write-Host "📋 Setup Checklist:" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found - Please install Node.js first" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}

# Check if backend exists and install dependencies
if (Test-Path "backend") {
    Write-Host ""
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    }
    
    Set-Location ..
} else {
    Write-Host "⚠️  Backend directory not found - run setup-backend.ps1 first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "Frontend (in main directory):" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend (in backend directory):" -ForegroundColor White
Write-Host "  cd backend" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "• Frontend will run on http://localhost:5173" -ForegroundColor White
Write-Host "• Backend will run on http://localhost:5000" -ForegroundColor White
Write-Host "• Edit .env file in backend/ for database and API keys" -ForegroundColor White
Write-Host "• Check browser console for any auth-related errors" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start both frontend and backend servers" -ForegroundColor White
Write-Host "2. Test registration and login flow" -ForegroundColor White
Write-Host "3. Configure MongoDB connection" -ForegroundColor White
Write-Host "4. Set up Stripe for subscriptions" -ForegroundColor White
