const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.text());

// Store results
let lastResults = {};

// Helper function to run GAM commands
function runGamCommand(command) {
    return new Promise((resolve, reject) => {
        // Try multiple possible GAM locations
        const gamPaths = [
            'gam',
            '/usr/local/bin/gam',
            '/home/node/bin/gamadv-xtd3/gam',
            '~/bin/gamadv-xtd3/gam'
        ];
        
        let gamPath = 'gam';
        
        // Find working GAM path
        for (const testPath of gamPaths) {
            try {
                exec(`which ${testPath}`, (error) => {
                    if (!error) {
                        gamPath = testPath;
                        return;
                    }
                });
            } catch (e) {
                // Continue to next path
            }
        }
        
        // If standard paths don't work, try the full path directly
        if (!fs.existsSync('/usr/local/bin/gam') && fs.existsSync('/home/node/bin/gamadv-xtd3/gam')) {
            gamPath = '/home/node/bin/gamadv-xtd3/gam';
        }
        
        const fullCommand = `${gamPath} ${command}`;
        console.log(`Running: ${fullCommand}`);
        
        exec(fullCommand, (error, stdout, stderr) => {
            if (error) {
                reject({ error: error.message, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

// Check if GAMADV is configured
app.get('/api/check-config', async (req, res) => {
    try {
        const result = await runGamCommand('version');
        res.json({ configured: true, version: result.stdout });
    } catch (error) {
        console.log('GAM check failed:', error);
        res.json({ configured: false, error: error.error });
    }
});

// Check domain status
app.post('/api/check-domains', async (req, res) => {
    try {
        const domains = req.body.split('\n').filter(d => d.trim());
        const results = [];
        
        // Get all domains first
        const allDomainsResult = await runGamCommand('print domains');
        const allDomains = allDomainsResult.stdout;
        
        for (const domain of domains) {
            const cleanDomain = domain.trim();
            if (!cleanDomain) continue;
            
            try {
                // Check if domain exists and get its status
                const domainResult = await runGamCommand(`info domain ${cleanDomain}`);
                const isExpired = domainResult.stdout.includes('EXPIRED') || 
                                domainResult.stdout.includes('SUSPENDED');
                
                results.push({
                    domain: cleanDomain,
                    status: isExpired ? 'EXPIRED' : 'ACTIVE',
                    details: domainResult.stdout
                });
            } catch (error) {
                results.push({
                    domain: cleanDomain,
                    status: 'NOT_FOUND',
                    error: error.error
                });
            }
        }
        
        lastResults.domains = results;
        res.json({ success: true, results });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Remove users from expired domains
app.post('/api/remove-users', async (req, res) => {
    try {
        if (!lastResults.domains) {
            return res.json({ success: false, error: 'No domain check results found. Run domain check first.' });
        }
        
        const expiredDomains = lastResults.domains.filter(d => d.status === 'EXPIRED');
        const results = [];
        
        for (const domainInfo of expiredDomains) {
            try {
                // Get users for this domain
                const usersResult = await runGamCommand(`print users domain ${domainInfo.domain}`);
                const userLines = usersResult.stdout.split('\n').filter(line => line.includes('@'));
                
                for (const userLine of userLines) {
                    const email = userLine.split(',')[0] || userLine.trim();
                    if (email.includes('@')) {
                        try {
                            const deleteResult = await runGamCommand(`delete user ${email}`);
                            results.push({
                                action: 'DELETE_USER',
                                target: email,
                                success: true,
                                result: deleteResult.stdout
                            });
                        } catch (error) {
                            results.push({
                                action: 'DELETE_USER',
                                target: email,
                                success: false,
                                error: error.error
                            });
                        }
                    }
                }
            } catch (error) {
                results.push({
                    action: 'GET_USERS',
                    target: domainInfo.domain,
                    success: false,
                    error: error.error
                });
            }
        }
        
        lastResults.userDeletion = results;
        res.json({ success: true, results });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Delete expired domains
app.post('/api/delete-domains', async (req, res) => {
    try {
        if (!lastResults.domains) {
            return res.json({ success: false, error: 'No domain check results found. Run domain check first.' });
        }
        
        const expiredDomains = lastResults.domains.filter(d => d.status === 'EXPIRED');
        const results = [];
        
        for (const domainInfo of expiredDomains) {
            try {
                const deleteResult = await runGamCommand(`delete domain ${domainInfo.domain}`);
                results.push({
                    action: 'DELETE_DOMAIN',
                    target: domainInfo.domain,
                    success: true,
                    result: deleteResult.stdout
                });
            } catch (error) {
                results.push({
                    action: 'DELETE_DOMAIN',
                    target: domainInfo.domain,
                    success: false,
                    error: error.error
                });
            }
        }
        
        lastResults.domainDeletion = results;
        res.json({ success: true, results });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Get last results
app.get('/api/results/:type', (req, res) => {
    const type = req.params.type;
    res.json(lastResults[type] || []);
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 GAMADV Domain Manager running at http://localhost:${PORT}`);
    console.log(`📋 Open your browser to get started`);
});
