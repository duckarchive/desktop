#!/bin/bash

# Wikisource Manager - Build Demo Script
# This script demonstrates how to build the Electron app for different platforms

echo "🏗️  Wikisource Manager - Build Demo"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Build the application
echo "🔨 Building the application..."
pnpm build:electron
echo "✅ Build completed!"
echo ""

# Create a demo .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "ℹ️  Note: .env files are no longer needed!"
    echo "📝 The app now uses secure built-in credential storage."
    echo "✅ Use the Settings button in the app to configure credentials."
    echo ""
fi

echo "🚀 Available commands:"
echo ""
echo "  🖥️  Development:"
echo "    pnpm electron:dev     # Run in development mode"
echo "    pnpm electron         # Run the built app"
echo ""
echo "  📦 Building:"
echo "    pnpm pack            # Create package (no installer)"
echo "    pnpm dist            # Create installer for current platform"
echo "    pnpm dist:win        # Create Windows installer"
echo ""
echo "  🔧 Development:"
echo "    pnpm build           # Build TypeScript only"
echo "    pnpm build:electron  # Build everything for Electron"
echo ""

# Check current platform
case "$(uname -s)" in
    Linux*)     PLATFORM="Linux";;
    Darwin*)    PLATFORM="macOS";;
    CYGWIN*|MINGW32*|MSYS*|MINGW*) PLATFORM="Windows";;
    *)          PLATFORM="Unknown";;
esac

echo "🌍 Current platform: $PLATFORM"
echo ""

if [ "$PLATFORM" = "Linux" ]; then
    echo "💡 To build for Windows from Linux:"
    echo "   1. Install wine: sudo apt install wine"
    echo "   2. Run: pnpm dist:win"
    echo ""
fi

echo "📁 Project structure:"
echo "   src/electron/     - Electron main process & preload"
echo "   src/renderer/     - UI (HTML/CSS/JS)"
echo "   src/uploadFile.ts - Original upload logic"
echo "   src/parse.ts      - Filename parsing"
echo "   dist/             - Built files"
echo "   release/          - Distribution packages"
echo ""

echo "🎯 Next steps:"
echo "   1. Run 'pnpm electron' to launch the app"
echo "   2. Click '⚙️ Settings' in the app footer"
echo "   3. Enter your Wikimedia bot credentials"
echo "   4. Start uploading files!"
echo "   5. Run 'pnpm dist:win' to build Windows installer"
echo ""
echo "🔐 New Credentials System:"
echo "   ✅ No more .env files needed"
echo "   ✅ Secure encrypted storage"
echo "   ✅ User-friendly settings interface"
echo "   ✅ Cross-platform credential management"
echo ""
echo "✨ Happy uploading!"
