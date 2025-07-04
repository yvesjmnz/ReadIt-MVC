class AdminActions {
    constructor() {
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.setupEventListeners();
            this.setupNavigation();
        });
    }

    setupEventListeners() {
        // Grant admin privileges
        DOMUtils.delegate(document, '#grant-admin-btn', 'click', this.handleGrantAdmin.bind(this));
        
        // Revoke admin privileges
        DOMUtils.delegate(document, '.revoke-admin-btn', 'click', this.handleRevokeAdmin.bind(this));
        
        // Delete post
        DOMUtils.delegate(document, '.delete-post-btn', 'click', this.handleDeletePost.bind(this));
        
        // Delete community
        DOMUtils.delegate(document, '.delete-community-btn', 'click', this.handleDeleteCommunity.bind(this));
        
        // Ban user
        DOMUtils.delegate(document, '#ban-user-btn', 'click', this.handleBanUser.bind(this));
        
        // Unban user
        DOMUtils.delegate(document, '.unban-user-btn', 'click', this.handleUnbanUser.bind(this));
        
        // Logs functionality
        DOMUtils.delegate(document, '#refresh-logs-btn', 'click', this.handleRefreshLogs.bind(this));
        
        // Test functionality
        DOMUtils.delegate(document, '#test-empty-name', 'click', () => this.runValidationTest('empty-name'));
        DOMUtils.delegate(document, '#test-short-name', 'click', () => this.runValidationTest('short-name'));
        DOMUtils.delegate(document, '#test-long-name', 'click', () => this.runValidationTest('long-name'));
        DOMUtils.delegate(document, '#test-special-chars', 'click', () => this.runValidationTest('special-chars'));
        DOMUtils.delegate(document, '#test-short-description', 'click', () => this.runValidationTest('short-description'));
        DOMUtils.delegate(document, '#test-empty-post-title', 'click', () => this.runValidationTest('empty-post-title'));
    }

    setupNavigation() {
        // Handle section navigation
        DOMUtils.delegate(document, '.nav-link', 'click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            this.showSection(section);
            
            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            e.target.classList.add('active');
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load logs if logs section is selected
            if (sectionName === 'logs') {
                this.loadLogs();
            }
        }
    }

    async handleGrantAdmin(e) {
        const modal = new Modal({
            title: 'Grant Admin Privileges',
            content: this.createGrantAdminForm(),
            className: 'grant-admin-modal'
        });

        modal.open();
        this.setupGrantAdminForm(modal);
    }

    createGrantAdminForm() {
        return `
            <form id="grant-admin-form">
                <div class="form-group">
                    <label for="admin-username">Username:</label>
                    <input type="text" id="admin-username" name="username" 
                           placeholder="Enter username to grant admin privileges" 
                           required minlength="3" maxlength="20">
                    <small>User must already be registered</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Grant Admin</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    setupGrantAdminForm(modal) {
        const form = modal.element.querySelector('#grant-admin-form');
        
        const formHandler = new FormHandler(form, {
            validation: {
                username: [
                    ValidationRules.required,
                    ValidationRules.minLength(3),
                    ValidationRules.maxLength(20)
                ]
            },
            onSubmit: async (data) => {
                await this.submitGrantAdmin(data.username);
                modal.close();
            }
        });
    }

    async submitGrantAdmin(username) {
        try {
            const response = await fetch('/api/admin/grant-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            const result = await response.json();
            
            if (response.ok) {
                NotificationSystem.success(`Admin privileges granted to ${username}`);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                NotificationSystem.error(result.error || 'Failed to grant admin privileges');
            }
        } catch (error) {
            NotificationSystem.error('Failed to grant admin privileges');
        }
    }

    async handleRevokeAdmin(e) {
        const username = e.target.dataset.username;
        
        const confirmed = await Modal.confirm(
            'Revoke Admin Privileges',
            `Are you sure you want to revoke admin privileges from ${username}? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/admin/revoke-admin/${username}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (response.ok) {
                    NotificationSystem.success(`Admin privileges revoked from ${username}`);
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    NotificationSystem.error(result.error || 'Failed to revoke admin privileges');
                }
            } catch (error) {
                NotificationSystem.error('Failed to revoke admin privileges');
            }
        }
    }

    async handleDeletePost(e) {
        const postId = e.target.dataset.postId;
        const title = e.target.dataset.title;
        
        const confirmed = await Modal.confirm(
            'Delete Post',
            `Are you sure you want to delete the post "${title}"? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/admin/post/${postId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (response.ok) {
                    NotificationSystem.success('Post deleted successfully');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    NotificationSystem.error(result.error || 'Failed to delete post');
                }
            } catch (error) {
                NotificationSystem.error('Failed to delete post');
            }
        }
    }

    async handleDeleteCommunity(e) {
        const communityName = e.target.dataset.communityName;
        
        const confirmed = await Modal.confirm(
            'Delete Community',
            `Are you sure you want to delete the community "${communityName}" and ALL its posts? This action cannot be undone.`
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/admin/community/${communityName}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                
                if (response.ok) {
                    NotificationSystem.success(`Community ${communityName} deleted successfully`);
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    NotificationSystem.error(result.error || 'Failed to delete community');
                }
            } catch (error) {
                NotificationSystem.error('Failed to delete community');
            }
        }
    }

    async handleBanUser(e) {
        const modal = new Modal({
            title: 'Ban User Site-wide',
            content: this.createBanUserForm(),
            className: 'ban-user-modal'
        });

        modal.open();
        this.setupBanUserForm(modal);
    }

    createBanUserForm() {
        return `
            <form id="ban-user-form">
                <div class="form-group">
                    <label for="ban-username">Username:</label>
                    <input type="text" id="ban-username" name="username" 
                           placeholder="Enter username to ban" 
                           required minlength="3" maxlength="20">
                </div>
                <div class="form-group">
                    <label for="ban-reason">Reason:</label>
                    <textarea id="ban-reason" name="reason" 
                              placeholder="Enter reason for site-wide ban..." 
                              required minlength="10" maxlength="500" rows="3"></textarea>
                    <small>This will remove the user from all communities and prevent them from participating</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-danger">Ban User</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    setupBanUserForm(modal) {
        const form = modal.element.querySelector('#ban-user-form');
        
        const formHandler = new FormHandler(form, {
            validation: {
                username: [
                    ValidationRules.required,
                    ValidationRules.minLength(3),
                    ValidationRules.maxLength(20)
                ],
                reason: [
                    ValidationRules.required,
                    ValidationRules.minLength(10),
                    ValidationRules.maxLength(500)
                ]
            },
            onSubmit: async (data) => {
                await this.submitBanUser(data.username, data.reason);
                modal.close();
            }
        });
    }

    async submitBanUser(username, reason) {
        try {
            const response = await fetch('/api/admin/ban-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, reason })
            });

            const result = await response.json();
            
            if (response.ok) {
                NotificationSystem.success(`User ${username} banned site-wide`);
                setTimeout(() => window.location.reload(), 1000);
            } else {
                NotificationSystem.error(result.error || 'Failed to ban user');
            }
        } catch (error) {
            NotificationSystem.error('Failed to ban user');
        }
    }

    async handleUnbanUser(e) {
        const username = e.target.dataset.username;
        
        const confirmed = await Modal.confirm(
            'Unban User',
            `Are you sure you want to unban ${username}? They will be able to use ReadIT again.`
        );

        if (confirmed) {
            try {
                const response = await fetch('/api/admin/unban-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username })
                });

                const result = await response.json();
                
                if (response.ok) {
                    NotificationSystem.success(`User ${username} unbanned successfully`);
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    NotificationSystem.error(result.error || 'Failed to unban user');
                }
            } catch (error) {
                NotificationSystem.error('Failed to unban user');
            }
        }
    }

    async loadLogs() {
        try {
            const response = await fetch('/api/admin/logs?lines=100');
            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            NotificationSystem.error('Failed to load logs');
        }
    }

    async handleRefreshLogs() {
        await this.loadLogs();
    }

    displayLogs(logs) {
        const display = document.getElementById('logs-display');
        
        if (!logs || logs.length === 0) {
            display.innerHTML = '<p class="no-logs">No log entries found.</p>';
            return;
        }

        const logHtml = logs.map(log => {
            if (log.raw) {
                return `<div class="log-entry"><pre>${log.raw}</pre></div>`;
            }

            const typeClass = log.type ? log.type.toLowerCase() : '';
            
            return `
                <div class="log-entry ${typeClass}">
                    <div class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</div>
                    <div class="log-header">
                        <span class="log-type">[${log.type || 'UNKNOWN'}]</span>
                    </div>
                    <div class="log-message">${log.message}</div>
                    ${this.formatLogDetails(log)}
                </div>
            `;
        }).join('');

        display.innerHTML = logHtml;
        display.scrollTop = display.scrollHeight;
    }

    formatLogDetails(log) {
        const details = [];
        
        if (log.username) details.push(`User: ${log.username}`);
        if (log.ip) details.push(`IP: ${log.ip}`);
        if (log.resource) details.push(`Resource: ${log.resource}`);
        if (log.reason) details.push(`Reason: ${log.reason}`);
        if (log.field) details.push(`Field: ${log.field}`);
        if (log.rule) details.push(`Rule: ${log.rule}`);
        if (log.success !== undefined) details.push(`Success: ${log.success}`);
        
        return details.length > 0 ? `<div class="log-details">${details.join(' | ')}</div>` : '';
    }

    async runValidationTest(testType) {
        const tests = {
            'empty-name': {
                endpoint: '/test/validation/community',
                data: { name: '', description: 'Valid description here' },
                description: 'Empty community name'
            },
            'short-name': {
                endpoint: '/test/validation/community',
                data: { name: 'ab', description: 'Valid description here' },
                description: 'Short community name (2 chars)'
            },
            'long-name': {
                endpoint: '/test/validation/community',
                data: { name: 'a'.repeat(51), description: 'Valid description here' },
                description: 'Long community name (51 chars)'
            },
            'special-chars': {
                endpoint: '/test/validation/community',
                data: { name: 'test@community!', description: 'Valid description here' },
                description: 'Special characters in name'
            },
            'short-description': {
                endpoint: '/test/validation/community',
                data: { name: 'validname', description: 'short' },
                description: 'Short description (5 chars)'
            },
            'empty-post-title': {
                endpoint: '/test/validation/post',
                data: { title: '', post_description: 'Valid post description here' },
                description: 'Empty post title'
            }
        };

        const test = tests[testType];
        if (!test) return;

        try {
            const response = await fetch(test.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(test.data)
            });

            const result = await response.json();
            
            this.displayTestResult(test.description, response.status, result);
            
            if (!response.ok) {
                NotificationSystem.success(`Validation test "${test.description}" triggered successfully! Check security logs for the logged entry.`);
            } else {
                NotificationSystem.warning(`Test "${test.description}" passed validation (unexpected)`);
            }
        } catch (error) {
            this.displayTestResult(test.description, 'ERROR', { error: error.message });
            NotificationSystem.error(`Test "${test.description}" failed to execute`);
        }
    }

    displayTestResult(testName, status, result) {
        const output = document.getElementById('test-output');
        const timestamp = new Date().toLocaleTimeString();
        
        const resultClass = status >= 200 && status < 300 ? 'success' : 'error';
        const statusText = typeof status === 'number' ? `HTTP ${status}` : status;
        
        const resultHtml = `
            <div class="test-result ${resultClass}">
                <div class="test-timestamp">[${timestamp}]</div>
                <div><strong>${testName}</strong> - ${statusText}</div>
                <div><pre>${JSON.stringify(result, null, 2)}</pre></div>
            </div>
        `;
        
        if (output.innerHTML.includes('Click a test button')) {
            output.innerHTML = resultHtml;
        } else {
            output.innerHTML = resultHtml + output.innerHTML;
        }
    }
}

// Initialize
new AdminActions();