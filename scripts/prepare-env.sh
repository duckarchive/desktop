#!/bin/bash

# Script to prepare environment for distribution builds
# This ensures .env files are handled correctly for packaged apps

echo "🔧 Preparing environment for distribution..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual credentials before distribution!"
fi

# For distribution builds, we need to ensure the .env file is accessible
# Copy .env to the resources directory that will be packaged
if [ ! -d "resources" ]; then
    mkdir -p resources
fi

cp .env.example resources/
if [ -f ".env" ]; then
    cp .env resources/
fi

echo "✅ Environment preparation complete!"
echo ""
echo "📋 Environment Status:"

if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
    if grep -q "your_bot_username" .env; then
        echo "   ⚠️  .env still contains placeholder values"
        echo "   📝 Please edit .env with real credentials"
    else
        echo "   ✅ .env appears to be configured"
    fi
else
    echo "   ❌ .env file missing"
fi

echo ""
echo "💡 For production builds:"
echo "   1. Edit .env with real credentials"
echo "   2. Run: pnpm dist:win"
echo "   3. The installer will include .env.example as a template"
echo "   4. End users should copy .env.example to .env and configure it"
