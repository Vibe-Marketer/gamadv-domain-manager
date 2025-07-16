#!/bin/bash

echo "🚀 Setting up GAMADV Domain Manager..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create directories
echo "📁 Creating directories..."
mkdir -p /tmp/gamadv-setup
cd /tmp/gamadv-setup

# Download and install GAMADV-XTD3
echo "⬇️ Downloading GAMADV-XTD3..."
# Get the latest release download URL
DOWNLOAD_URL=$(curl -s https://api.github.com/repos/taers232c/GAMADV-XTD3/releases/latest | grep "browser_download_url.*linux-x86_64.tar.xz" | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "❌ Could not find download URL. Using fallback..."
    DOWNLOAD_URL="https://github.com/taers232c/GAMADV-XTD3/releases/download/v6.72.00/gamadv-xtd3-6.72.00-linux-x86_64.tar.xz"
fi

echo "📥 Downloading from: $DOWNLOAD_URL"
wget -O gamadv-xtd3.tar.xz "$DOWNLOAD_URL"

if [ ! -f "gamadv-xtd3.tar.xz" ]; then
    echo "❌ Download failed. Trying alternative method..."
    curl -L -o gamadv-xtd3.tar.xz "$DOWNLOAD_URL"
fi

echo "📁 Extracting GAMADV-XTD3..."
tar -xf gamadv-xtd3.tar.xz

# Find the extracted directory
GAMADV_DIR=$(find . -name "gamadv-xtd3*" -type d | head -1)

if [ -z "$GAMADV_DIR" ]; then
    echo "❌ Could not find extracted GAMADV directory"
    ls -la
    exit 1
fi

echo "📂 Found GAMADV directory: $GAMADV_DIR"

# Move to user's home directory instead of /usr/local
echo "🏠 Installing to home directory..."
mv "$GAMADV_DIR" ~/gamadv-xtd3

# Create local bin directory if it doesn't exist
mkdir -p ~/bin

# Create symlink in user's bin
ln -sf ~/gamadv-xtd3/gam ~/bin/gam

# Add to PATH if not already there
if ! grep -q 'export PATH="$HOME/bin:$PATH"' ~/.bashrc; then
    echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
fi

# Also add to current session
export PATH="$HOME/bin:$PATH"

# Clean up
cd /workspace
rm -rf /tmp/gamadv-setup

echo "✅ Setup complete!"
echo "📋 Next steps:"
echo "   1. Run 'source ~/.bashrc' or restart your terminal"
echo "   2. Run 'gam version' to configure Google Workspace credentials"
echo "   3. Run 'npm start' to launch the web interface"
echo ""
echo "🔧 Testing installation..."
if command -v gam &> /dev/null; then
    echo "✅ GAM command found!"
    gam version
else
    echo "⚠️  GAM not in PATH. Run: source ~/.bashrc"
    echo "   Or manually run: export PATH=\"\$HOME/bin:\$PATH\""
fi
