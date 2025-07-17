// Display results functions
function displayDomainResults(results) {
    const container = document.getElementById('domain-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="result-item result-warning">No results to display</div>';
        return;
    }
    
    const html = results.map(result => {
        let className, icon;
        
        switch(result.status) {
            case 'EXPIRED':
                className = 'result-error';
                icon = '❌';
                break;
            case 'NEEDS_REVIEW':
                className = 'result-warning';
                icon = '⚠️';
                break;
            case 'ACTIVE':
                className = 'result-success';
                icon = '✅';
                break;
            default:
                className = 'result-warning';
                icon = '❓';
        }
        
        return `
            <div class="result-item ${className}">
                ${icon} <strong>${result.domain}</strong> - ${result.status}
                ${result.error ? `<br><small>Error: ${result.error}</small>` : ''}
                ${result.details ? `<br><small>Details: ${result.details.substring(0, 200)}${result.details.length > 200 ? '...' : ''}</small>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Check domains
async function checkDomains() {
    const domainList = document.getElementById('domain-list').value.trim();
    if (!domainList) {
        alert('Please enter some domains first!');
        return;
    }
    
    setButtonLoading('check-btn', true);
    
    try {
        const response = await fetch('/api/check-domains', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: domainList
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentResults.domains = data.results;
            displayDomainResults(data.results);
            
            // Enable next step if we have expired or problematic domains
            const hasProblematic = data.results.some(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW');
            document.getElementById('remove-users-btn').disabled = !hasProblematic;
            
            if (hasProblematic) {
                const expiredCount = data.results.filter(d => d.status === 'EXPIRED').length;
                const reviewCount = data.results.filter(d => d.status === 'NEEDS_REVIEW').length;
                
                let message = '';
                if (expiredCount > 0) message += `${expiredCount} expired domain(s)`;
                if (reviewCount > 0) {
                    if (message) message += ' and ';
                    message += `${reviewCount} domain(s) needing review`;
                }
                message += '. Ready for user removal.';
                
                showNotification(message, 'warning');
            } else {
                showNotification('All domains appear to be active and working. No cleanup needed!', 'success');
            }
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Network error: ${error.message}`, 'error');
    } finally {
        setButtonLoading('check-btn', false);
    }
}