// Check domain status
app.post('/api/check-domains', async (req, res) => {
    try {
        const domains = req.body.split('\n').filter(d => d.trim());
        const results = [];
        
        for (const domain of domains) {
            const cleanDomain = domain.trim();
            if (!cleanDomain) continue;
            
            try {
                // Check if domain exists and get its status
                const domainResult = await runGamCommand(`info domain ${cleanDomain}`);
                const output = domainResult.stdout.toLowerCase();
                
                // More comprehensive expired detection
                const isExpired = output.includes('expired') || 
                                output.includes('suspended') ||
                                output.includes('deleted') ||
                                output.includes('unverified') ||
                                output.includes('pending deletion') ||
                                output.includes('verification failed') ||
                                output.includes('domain not found') ||
                                output.includes('mx verification failed');
                
                // Check if domain is technically active but actually problematic
                const isProbablyExpired = output.includes('not verified') ||
                                        output.includes('verification pending') ||
                                        output.includes('ownership not verified');
                
                let status = 'ACTIVE';
                if (isExpired) {
                    status = 'EXPIRED';
                } else if (isProbablyExpired) {
                    status = 'NEEDS_REVIEW';  // Mark for manual review
                }
                
                results.push({
                    domain: cleanDomain,
                    status: status,
                    details: domainResult.stdout,
                    fullOutput: domainResult.stdout  // Include full output for debugging
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