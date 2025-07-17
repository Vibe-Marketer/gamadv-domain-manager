// Global state
let isConfigured = false;
let currentResults = {};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkConfig();
});

// Check GAMADV configuration
async function checkConfig() {
    const statusDiv = document.getElementById('config-status');
    statusDiv.textContent = 'Checking configuration...';
    statusDiv.className = '';
    
    try {
        const response = await fetch('/api/check-config');
        const data = await response.json();
        
        if (data.configured) {
            statusDiv.textContent = `✅ GAMADV-XTD3 configured and ready!`;
            statusDiv.className = 'config-ok';
            isConfigured = true;
            enableInterface();
        } else {
            statusDiv.textContent = `❌ GAMADV-XTD3 not configured. See setup help below.`;
            statusDiv.className = 'config-error';
            isConfigured = false;
            disableInterface();
        }
    } catch (error) {
        statusDiv.textContent = `❌ Error checking configuration: ${error.message}`;
        statusDiv.className = 'config-error';
        isConfigured = false;
        disableInterface();
    }
}

// Enable/disable interface based on config
function enableInterface() {
    document.getElementById('check-btn').disabled = false;
}

function disableInterface() {
    document.getElementById('check-btn').disabled = true;
    document.getElementById('remove-users-btn').disabled = true;
    document.getElementById('delete-domains-btn').disabled = true;
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Set button loading state
function setButtonLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        if (isConfigured) {
            btn.disabled = false;
        }
    }
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
            
            // Check if force override is enabled
            const forceOverride = document.getElementById('force-override').checked;
            
            // Enable next step if we have expired domains OR force override is checked
            const hasExpired = data.results.some(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW');
            const canProceed = hasExpired || forceOverride;
            
            document.getElementById('remove-users-btn').disabled = !canProceed;
            
            if (forceOverride) {
                showNotification(`Force override enabled. Ready to process ALL ${data.results.length} domain(s).`, 'warning');
            } else if (hasExpired) {
                const problematicCount = data.results.filter(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW').length;
                showNotification(`Found ${problematicCount} expired/problematic domain(s). Ready for user removal.`, 'warning');
            } else {
                showNotification('No expired domains found. Enable force override to process active domains.', 'info');
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

// Remove users from expired domains
async function removeUsers() {
    if (!currentResults.domains) {
        alert('Run domain check first!');
        return;
    }
    
    const forceOverride = document.getElementById('force-override').checked;
    let domainsToProcess;
    
    if (forceOverride) {
        domainsToProcess = currentResults.domains;
    } else {
        domainsToProcess = currentResults.domains.filter(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW');
    }
    
    const confirmMessage = forceOverride 
        ? `FORCE OVERRIDE: This will delete ALL users from ALL ${domainsToProcess.length} domain(s), regardless of status. Are you absolutely sure?`
        : `This will delete ALL users from ${domainsToProcess.length} expired/problematic domain(s). Are you sure?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    setButtonLoading('remove-users-btn', true);
    
    try {
        const response = await fetch('/api/remove-users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceOverride })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentResults.users = data.results;
            displayUserResults(data.results);
            showTab('users');
            
            // ALWAYS enable domain deletion after user removal attempt
            // Even if there were some errors, we should allow trying domain deletion
            document.getElementById('delete-domains-btn').disabled = false;
            
            const successCount = data.results.filter(r => r.success).length;
            const errorCount = data.results.filter(r => !r.success).length;
            
            if (errorCount > 0) {
                showNotification(`User removal completed with errors: ${successCount} successful, ${errorCount} errors. You can still proceed with domain deletion.`, 'warning');
            } else {
                showNotification(`User removal complete: ${successCount} successful. Ready for domain deletion.`, 'success');
            }
        } else {
            showNotification(`Error: ${data.error}`, 'error');
            // Still enable delete domains button in case user wants to try anyway
            document.getElementById('delete-domains-btn').disabled = false;
        }
    } catch (error) {
        showNotification(`Network error: ${error.message}`, 'error');
        // Still enable delete domains button in case user wants to try anyway
        document.getElementById('delete-domains-btn').disabled = false;
    } finally {
        setButtonLoading('remove-users-btn', false);
    }
}

// Delete expired domains
async function deleteDomains() {
    if (!currentResults.domains) {
        alert('Run domain check first!');
        return;
    }
    
    const forceOverride = document.getElementById('force-override').checked;
    let domainsToProcess;
    
    if (forceOverride) {
        domainsToProcess = currentResults.domains;
    } else {
        domainsToProcess = currentResults.domains.filter(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW');
    }
    
    const confirmMessage = forceOverride 
        ? `FORCE OVERRIDE: This will PERMANENTLY DELETE ALL ${domainsToProcess.length} domain(s), regardless of status. This cannot be undone. Are you absolutely sure?`
        : `This will PERMANENTLY DELETE ${domainsToProcess.length} expired/problematic domain(s). This cannot be undone. Are you sure?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    setButtonLoading('delete-domains-btn', true);
    
    try {
        const response = await fetch('/api/delete-domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceOverride })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentResults.deletion = data.results;
            displayDeletionResults(data.results);
            showTab('deletion');
            
            const successCount = data.results.filter(r => r.success).length;
            const errorCount = data.results.filter(r => !r.success).length;
            
            showNotification(`Domain deletion complete: ${successCount} deleted, ${errorCount} errors. Cleanup finished!`, 'success');
            
            // Reset workflow
            document.getElementById('remove-users-btn').disabled = true;
            document.getElementById('delete-domains-btn').disabled = true;
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Network error: ${error.message}`, 'error');
    } finally {
        setButtonLoading('delete-domains-btn', false);
    }
}

// Display results functions
function displayDomainResults(results) {
    const container = document.getElementById('domain-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="result-item result-warning">No results to display</div>';
        return;
    }
    
    const html = results.map(result => {
        const className = result.status === 'EXPIRED' ? 'result-error' : 
                         result.status === 'NEEDS_REVIEW' ? 'result-warning' :
                         result.status === 'ACTIVE' ? 'result-success' : 'result-warning';
        
        const statusIcon = result.status === 'EXPIRED' ? '❌' : 
                          result.status === 'NEEDS_REVIEW' ? '⚠️' :
                          result.status === 'ACTIVE' ? '✅' : '❓';
        
        return `
            <div class="result-item ${className}">
                ${statusIcon} <strong>${result.domain}</strong> - ${result.status}
                ${result.error ? `<br><small>Error: ${result.error}</small>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function displayUserResults(results) {
    const container = document.getElementById('user-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="result-item result-warning">No user operations performed</div>';
        return;
    }
    
    const html = results.map(result => {
        const className = result.success ? 'result-success' : 'result-error';
        const icon = result.success ? '✅' : '❌';
        
        return `
            <div class="result-item ${className}">
                ${icon} ${result.action}: ${result.target}
                ${result.error ? `<br><small>Error: ${result.error}</small>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

function displayDeletionResults(results) {
    const container = document.getElementById('deletion-results');
    
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="result-item result-warning">No domain deletions performed</div>';
        return;
    }
    
    const html = results.map(result => {
        const className = result.success ? 'result-success' : 'result-error';
        const icon = result.success ? '✅' : '❌';
        
        return `
            <div class="result-item ${className}">
                ${icon} ${result.action}: ${result.target}
                ${result.error ? `<br><small>Error: ${result.error}</small>` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    // Set background based on type
    switch (type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'warning':
            notification.style.background = '#f59e0b';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        case 'info':
            notification.style.background = '#3b82f6';
            break;
        default:
            notification.style.background = '#6b7280';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Listen for force override checkbox changes
document.addEventListener('DOMContentLoaded', function() {
    const forceOverrideCheckbox = document.getElementById('force-override');
    if (forceOverrideCheckbox) {
        forceOverrideCheckbox.addEventListener('change', function() {
            if (currentResults.domains && currentResults.domains.length > 0) {
                // Re-enable buttons based on new force override state
                const hasExpired = currentResults.domains.some(d => d.status === 'EXPIRED' || d.status === 'NEEDS_REVIEW');
                const canProceed = hasExpired || this.checked;
                document.getElementById('remove-users-btn').disabled = !canProceed;
                
                if (this.checked) {
                    showNotification('Force override enabled. ALL domains will be processed regardless of status.', 'warning');
                }
            }
        });
    }
});

// Add manual button enabler for troubleshooting
window.enableDeleteButton = function() {
    document.getElementById('delete-domains-btn').disabled = false;
    showNotification('Delete domains button manually enabled', 'info');
}