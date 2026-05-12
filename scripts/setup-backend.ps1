# Korean Learning App - Backend Setup Script

Write-Host "🚀 Setting up Korean Learning Backend..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location backend

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📄 Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please edit the .env file with your actual values!" -ForegroundColor Yellow
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Backend setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env file with your MongoDB and Stripe credentials" -ForegroundColor White
Write-Host "2. Start MongoDB (if running locally)" -ForegroundColor White
Write-Host "3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the backend server:" -ForegroundColor Cyan
Write-Host "cd backend && npm run dev" -ForegroundColor Yellow
