#!/bin/bash

echo "🚀 Interior Design Matcher - Deployment Helper"
echo "=============================================="
echo ""

echo "📋 Step 1: GitHub Repository"
echo "Please go to: https://github.com/new"
echo "- Repository name: interior-design-matcher"
echo "- Description: AI-powered interior design matching tool"
echo "- Make it Public"
echo "- Don't initialize with README"
echo "- Click 'Create repository'"
echo ""

echo "⏳ Waiting for you to create the GitHub repository..."
echo "Press Enter when you've created the repository and have the URL..."
read -p ""

echo ""
echo "📝 Please enter your GitHub repository URL:"
echo "Example: https://github.com/yourusername/interior-design-matcher.git"
read -p "GitHub URL: " github_url

echo ""
echo "🔗 Adding GitHub remote..."
git remote add origin "$github_url"

echo ""
echo "📤 Pushing code to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub successfully!"
echo ""

echo "🌐 Step 2: Vercel Deployment"
echo "Now go to: https://vercel.com"
echo "1. Sign up with GitHub"
echo "2. Click 'Import Project'"
echo "3. Select your 'interior-design-matcher' repository"
echo "4. Click 'Deploy'"
echo ""
echo "🎉 Your app will be live in ~2 minutes!"
echo "You'll get a URL like: https://interior-design-matcher.vercel.app"
echo ""
echo "✨ All features will work perfectly on the web, including:"
echo "   - Visual room style detection"
echo "   - Color palette visualization"
echo "   - Advanced filtering"
echo "   - Real furniture images"
echo "   - Room completion suggestions"