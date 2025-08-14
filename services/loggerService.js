const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.logFiles = {
            security: path.join(this.logDir, 'security.log'),
            auth: path.join(this.logDir, 'auth.log'),
            access: path.join(this.logDir, 'access.log'),
            validation: path.join(this.logDir, 'validation.log')
        };
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatLogEntry(type, message, details = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type,
            message,
            ...details
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeLog(entry, category = 'security') {
        // Write to category-specific log
        const categoryFile = this.logFiles[category];
        if (categoryFile) {
            fs.appendFileSync(categoryFile, entry);
        }
        
        // Also write to master security log for backward compatibility
        if (category !== 'security') {
            fs.appendFileSync(this.logFiles.security, entry);
        }
    }

    // Log authentication success
    logAuthSuccess(username, ip, userAgent, reason){
        const entry = this.formatLogEntry('AUTH_SUCCESS', 'Authentication successful', {
            username, 
            ip,
            userAgent,
            reason
        });
        this.writeLog(entry, 'auth');
    }
    
    // Log authentication failures only
    logAuthFailure(username, ip, userAgent, reason) {
        const entry = this.formatLogEntry('AUTH_FAILURE', 'Authentication failed', {
            username,
            ip,
            userAgent,
            reason
        });
        this.writeLog(entry, 'auth');
    }

    // Log access control failures
    logAccessDenied(username, resource, reason, ip) {
        const entry = this.formatLogEntry('ACCESS_DENIED', 'Access denied', {
            username,
            resource,
            reason,
            ip
        });
        this.writeLog(entry, 'access');
    }

    // Log validation failures
    logValidationFailure(field, value, rule, username, ip) {
        const entry = this.formatLogEntry('VALIDATION_FAILURE', 'Validation failed', {
            field,
            value: typeof value === 'string' ? value.substring(0, 100) : value,
            rule,
            username,
            ip
        });
        this.writeLog(entry, 'validation');
    }

    // Log account lock
    logAccountLock(username, ip){
        const entry = this.formatLogEntry('ACCOUNT_LOCKED', 'Account Locked', {
            username,
            ip
        });
        this.writeLog(entry, 'auth');
    }

    // Log Password change success
    logPasswordChange(username, ip){
        const entry = this.formatLogEntry('PASSWORD_CHANGED', 'Password changed', {
            username, 
            ip
        });
        this.writeLog(entry, 'auth');
    }

    // Log account creation
    logAccountCreated(username, ip){
        const entry = this.formatLogEntry('ACCOUNT_CREATED', 'Account created', {
            username, 
            ip
        });
        this.writeLog(entry, 'auth');
    }

    // Log password reset failure
    logPasswordResetFailure(username, reason, ip) {
        const entry = this.formatLogEntry('PASSWORD_RESET_FAILURE', 'Password reset failed', {
            username,
            reason,
            ip
        });
        this.writeLog(entry, 'auth');
    }

    // Log security questions setup failure
    logSecurityQuestionsSetupFailure(username, reason, ip) {
        const entry = this.formatLogEntry('SECURITY_QUESTIONS_SETUP_FAILURE', 'Security questions setup failed', {
            username,
            reason,
            ip
        });
        this.writeLog(entry, 'security');
    }

    // Log security questions validation failure
    logSecurityQuestionsValidationFailure(username, reason, ip) {
        const entry = this.formatLogEntry('SECURITY_QUESTIONS_VALIDATION_FAILURE', 'Security questions validation failed', {
            username,
            reason,
            ip
        });
        this.writeLog(entry, 'security');
    }

    // Read log content by category (admin only)
    readLogs(category = 'security', lines = 100) {
        try {
            const logFile = this.logFiles[category];
            if (!logFile || !fs.existsSync(logFile)) {
                return [];
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const logLines = content.trim().split('\n').filter(line => line);
            
            // Return last N lines
            const recentLines = logLines.slice(-lines);
            return recentLines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { raw: line };
                }
            });
        } catch (error) {
            return [];
        }
    }

    // Get available log categories
    getLogCategories() {
        return Object.keys(this.logFiles);
    }

    // Get log stats for each category
    getLogStats() {
        const stats = {};
        for (const [category, filePath] of Object.entries(this.logFiles)) {
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.trim().split('\n').filter(line => line);
                    stats[category] = {
                        count: lines.length,
                        lastEntry: lines.length > 0 ? lines[lines.length - 1] : null
                    };
                } else {
                    stats[category] = { count: 0, lastEntry: null };
                }
            } catch (error) {
                stats[category] = { count: 0, lastEntry: null, error: error.message };
            }
        }
        return stats;
    }
}

module.exports = new LoggerService();