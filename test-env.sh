#!/bin/bash

# Environment Variable Test Script
# This script helps debug and validate environment variable loading

echo "🔍 Environment Variable Diagnostic"
echo "================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "📁 Location: $(pwd)/.env"
    
    # Check if it has the required variables
    if grep -q "WIKI_BOT_USERNAME=" .env && grep -q "WIKI_BOT_PASSWORD=" .env; then
        echo "✅ Required variables present"
        
        # Check if they're still placeholder values
        if grep -q "your_bot_username" .env || grep -q "your_bot_password" .env; then
            echo "⚠️  Still contains placeholder values"
            echo "📝 Please edit .env with real credentials"
        else
            echo "✅ Variables appear to be configured"
        fi
    else
        echo "❌ Missing required variables"
        echo "📝 .env should contain WIKI_BOT_USERNAME and WIKI_BOT_PASSWORD"
    fi
else
    echo "❌ .env file not found"
    echo "📝 Create it with: cp .env.example .env"
fi

echo ""
echo "🔧 Testing with the app..."
echo ""

# Test loading environment variables
if command -v node >/dev/null 2>&1; then
    node -e "
        require('dotenv').config();
        console.log('Username:', process.env.WIKI_BOT_USERNAME ? '✅ Set' : '❌ Missing');
        console.log('Password:', process.env.WIKI_BOT_PASSWORD ? '✅ Set' : '❌ Missing');
        console.log('');
        if (process.env.WIKI_BOT_USERNAME && process.env.WIKI_BOT_PASSWORD) {
            console.log('🎉 Environment variables loaded successfully!');
        } else {
            console.log('❌ Environment variables not properly configured');
        }
    "
else
    echo "❌ Node.js not found, skipping variable test"
fi

echo ""
echo "💡 Next steps:"
echo "   1. Ensure .env file exists and has real credentials"
echo "   2. Run: pnpm electron"
echo "   3. Check the app footer for credential status"
echo ""
