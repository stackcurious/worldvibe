# PowerShell script to test Next.js
Write-Host "Testing with a clean Next.js installation..." -ForegroundColor Cyan

# Navigate to the test directory
cd minimal-test

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Start development server
Write-Host "Starting development server..." -ForegroundColor Green
npm run dev