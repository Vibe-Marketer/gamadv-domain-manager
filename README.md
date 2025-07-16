# 🎯 GAMADV Domain Manager

A dead-simple web interface for GAMADV-XTD3 that turns complex command-line domain management into three button clicks.

**What it does:** Check domain status → Remove users from expired domains → Delete expired domains

**Perfect for:** Google Workspace admins who need to clean up expired domains without wrestling with command-line syntax.

## 🚀 Quick Start (GitHub Codespaces)

1. **Launch Codespaces**
   - Click the green "Code" button on this repo
   - Select "Create codespace on main"
   - Wait for setup to complete (2-3 minutes)

2. **Configure GAMADV-XTD3**
   ```bash
   gam version
   ```
   Follow the OAuth prompts to authorize with your Google Workspace

3. **Start the Interface**
   ```bash
   npm start
   ```
   
4. **Open in Browser**
   - Codespaces will auto-forward port 3000
   - Click the popup or go to the Ports tab

## 🎮 How to Use

1. **Paste your domain list** in the text area (one per line)
2. **Click "Check Domain Status"** - finds active vs expired domains
3. **Click "Remove Users"** - deletes all users from expired domains
4. **Click "Delete Expired Domains"** - permanently removes expired domains

That's it. Three clicks instead of dozens of command-line operations.

## 🔧 What Gets Installed

- **GAMADV-XTD3**: Latest version, auto-downloaded and configured
- **Node.js Server**: Handles web interface and GAMADV operations  
- **Simple Web UI**: Clean interface that works on any device

## ⚠️ Security Notes

- **Credentials**: Your Google Workspace credentials stay in the Codespace
- **Access**: You need Google Workspace Super Admin rights
- **Cleanup**: Delete the Codespace when done to remove all traces

## 🛠️ Advanced Setup (Local/Other Platforms)

If you want to run this outside Codespaces:

1. **Install GAMADV-XTD3** manually from [taers232c/GAMADV-XTD3](https://github.com/taers232c/GAMADV-XTD3)
2. **Clone this repo** and run `npm install`
3. **Configure GAMADV** with `gam version`
4. **Start server** with `npm start`

## 🔍 What It Actually Does

**Domain Check:**
```bash
gam info domain example.com
# Checks if domain is ACTIVE, EXPIRED, or SUSPENDED
```

**User Removal:**
```bash
gam print users domain expired-domain.com
gam delete user user@expired-domain.com
# Removes all users from expired domains
```

**Domain Deletion:**
```bash
gam delete domain expired-domain.com
# Permanently deletes the domain
```

## 🎯 Why This Exists

GAMADV-XTD3 is powerful but brutal for repetitive tasks. Instead of:

```bash
gam info domain domain1.com
gam info domain domain2.com  
gam print users domain expired-domain.com
gam delete user user1@expired-domain.com
gam delete user user2@expired-domain.com
gam delete domain expired-domain.com
# ... repeat 50 times
```

You get:
1. Paste domain list
2. Click three buttons
3. Done

## 🚨 Important Warnings

- **This deletes users and domains permanently**
- **Always test with non-critical domains first**
- **You need Super Admin access to your Google Workspace**
- **Expired domains can't be recovered once deleted**

## 📝 Troubleshooting

**"GAMADV not configured"**
- Run `gam version` in the terminal
- Follow OAuth setup prompts
- Refresh the web interface

**"Permission denied" errors**
- Ensure you're a Google Workspace Super Admin
- Re-run `gam version` to refresh credentials

**Interface won't load**
- Check that `npm start` is running
- Port 3000 should be forwarded in Codespaces
- Try refreshing or opening in a new tab

## 🤝 Contributing

Found a bug? Want a feature? Open an issue or PR. This tool should stay simple but work perfectly.

## 📄 License

MIT License - use it, modify it, share it.

---

**Built for admins who value their time.** No more command-line gymnastics for routine domain cleanup.
