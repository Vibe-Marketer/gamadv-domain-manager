#!/bin/bash

echo "🔧 Quick GAMADV Fix..."

# Check if already installed
if [ -f ~/gamadv-xtd3/gam ]; then
    echo "✅ GAMADV-XTD3 found at ~/gamadv-xtd3/"
    
    # Make sure it's executable
    chmod +x ~/gamadv-xtd3/gam
    
    # Make sure bin directory exists
    mkdir -p ~/bin
    
    # Create symlink
    ln -sf ~/gamadv-xtd3/gam ~/bin/gam
    
    # Add to PATH
    export PATH="$HOME/bin:$PATH"
    
    echo "🔗 Created symlink: ~/bin/gam"
    echo "📝 Added to PATH for this session"
    
    # Test
    if command -v gam &> /dev/null; then
        echo "✅ GAM is now working!"
        gam version
    else
        echo "⚠️  Still not working. Try: source ~/.bashrc"
    fi
    
else
    echo "❌ GAMADV-XTD3 not found. Running full setup..."
    ./setup.sh
fi
