#!/bin/bash

# Cloi MCP Server Startup Script

echo "🚀 Starting Cloi MCP Server..."

# Check Node.js version
node_version=$(node --version)
echo "📦 Node.js version: $node_version"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from cloi-mcp-server directory."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Check if we're in the Cloi project context
if [ ! -f "../package.json" ] || ! grep -q "cloi" "../package.json"; then
    echo "⚠️  Warning: Not running from Cloi repository. Some features may be limited."
fi

echo "✅ Starting MCP server..."
echo "📋 Available tools: codebase analysis, feature development, documentation generation"
echo "🔧 Ready to assist with Cloi development!"
echo ""

# Start the server
node src/index.js