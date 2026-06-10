# DapurMind AI - Deployment Script
# This script helps you deploy to GitHub and Cloudflare Pages

Write-Host "🚀 DapurMind AI Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Run: git init" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Git repository detected" -ForegroundColor Green
Write-Host ""

# Check if remote exists
$remote = git remote -v 2>&1
if ($LASTEXITCODE -ne 0 -or $remote -eq "") {
    Write-Host "⚠️  No remote repository configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To add remote, run:" -ForegroundColor Cyan
    Write-Host "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor White
    Write-Host ""
    
    $addRemote = Read-Host "Do you want to add remote now? (y/n)"
    
    if ($addRemote -eq "y") {
        $repoUrl = Read-Host "Enter GitHub repository URL"
        git remote add origin $repoUrl
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Remote added successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to add remote" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "Please create GitHub repository first:" -ForegroundColor Yellow
        Write-Host "  1. Go to: https://github.com/new" -ForegroundColor White
        Write-Host "  2. Create repository: dapumindai" -ForegroundColor White
        Write-Host "  3. Copy the repository URL" -ForegroundColor White
        Write-Host "  4. Run this script again" -ForegroundColor White
        exit 0
    }
}

Write-Host "✅ Remote repository configured" -ForegroundColor Green
Write-Host "   Remote: $remote" -ForegroundColor Gray
Write-Host ""

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes" -ForegroundColor Yellow
    Write-Host ""
    
    $commit = Read-Host "Commit changes now? (y/n)"
    
    if ($commit -eq "y") {
        Write-Host ""
        $message = Read-Host "Commit message (default: Update)"
        
        if ($message -eq "") {
            $message = "Update"
        }
        
        git add .
        git commit -m $message
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Changes committed!" -ForegroundColor Green
        } else {
            Write-Host "❌ Commit failed" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "📤 Ready to push to GitHub" -ForegroundColor Cyan
Write-Host ""

$push = Read-Host "Push to GitHub now? (y/n)"

if ($push -eq "y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    
    git branch -M main
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Next steps:" -ForegroundColor Cyan
        Write-Host "  1. Go to: https://dash.cloudflare.com/pages" -ForegroundColor White
        Write-Host "  2. Find project: dapumindai" -ForegroundColor White
        Write-Host "  3. Settings → Connect to Git" -ForegroundColor White
        Write-Host "  4. Select your GitHub repository" -ForegroundColor White
        Write-Host "  5. Configure build settings:" -ForegroundColor White
        Write-Host "     - Build command: npm run build" -ForegroundColor Gray
        Write-Host "     - Build output: .next" -ForegroundColor Gray
        Write-Host "  6. Save and Deploy!" -ForegroundColor White
        Write-Host ""
        Write-Host "Environment variables are already set! ✅" -ForegroundColor Green
        Write-Host "  - NEXT_PUBLIC_CONVEX_URL" -ForegroundColor Gray
        Write-Host "  - NEXT_PUBLIC_CONVEX_SITE_URL" -ForegroundColor Gray
        Write-Host ""
        
        $openDashboard = Read-Host "Open Cloudflare Dashboard? (y/n)"
        if ($openDashboard -eq "y") {
            Start-Process "https://dash.cloudflare.com/pages"
        }
    } else {
        Write-Host ""
        Write-Host "❌ Push failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. Authentication failed - use GitHub Personal Access Token" -ForegroundColor White
        Write-Host "  2. Repository doesn't exist - create it first" -ForegroundColor White
        Write-Host "  3. Wrong remote URL - check with: git remote -v" -ForegroundColor White
        Write-Host ""
        Write-Host "For GitHub token:" -ForegroundColor Cyan
        Write-Host "  https://github.com/settings/tokens" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "⏸️  Push cancelled" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "When ready, run:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - GITHUB_SETUP.md - Step-by-step guide" -ForegroundColor White
Write-Host "  - DEPLOYMENT_SUCCESS.md - Deployment status" -ForegroundColor White
Write-Host "  - MIGRATION_COMPLETE.md - Technical details" -ForegroundColor White
Write-Host ""
