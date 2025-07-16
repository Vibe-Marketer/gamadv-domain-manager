#!/bin/bash

echo "🚀 Setting up GAMADV Domain Manager..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Download and install GAMADV-XTD3
echo "⬇️ Downloading GAMADV-XTD3..."
wget -q https://github.com/taers232c/GAMADV-XTD3/releases/latest/download/gamadv-xtd3-6.72.00-linux-x86_64.tar.xz

echo "📁 Extracting GAMADV-XTD3..."
tar -xf gamadv-xtd3-*.tar.xz

# Move to standard location
sudo mv gamadv-xtd3 /usr/local/
sudo ln -sf /usr/local/gamadv-xtd3/gam /usr/local/bin/gam

# Clean up
rm gamadv-xtd3-*.tar.xz

echo "✅ Setup complete!"
echo "📋 Next steps:"
echo "   1. Run 'npm start' to launch the web interface"
echo "   2. Open http://localhost:3000 in your browser"
echo "   3. Follow the setup guide to configure Google Workspace credentials"
echo ""
echo "🔧 To configure GAMADV-XTD3 with your Google Workspace:"
echo "   Run: gam version"
echo "   Then follow the authentication prompts"
