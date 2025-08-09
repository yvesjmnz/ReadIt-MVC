const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.logFile = path.join(this.logDir, 'security.log');
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

    writeLog(entry) {
        fs.appendFileSync(this.logFile, entry);
    }

    // Log authentication failures only
    logAuthFailure(username, ip, userAgent, reason) {
        const entry = this.formatLogEntry('AUTH_FAILURE', 'Authentication failed', {
            username,
            ip,
            userAgent,
            reason
        });
        this.writeLog(entry);
    }

    // Log access control failures
    logAccessDenied(username, resource, reason, ip) {
        const entry = this.formatLogEntry('ACCESS_DENIED', 'Access denied', {
            username,
            resource,
            reason,
            ip
        });
        this.writeLog(entry);
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
        this.writeLog(entry);
    }

    // Log account lock
    logAccountLock(username, ip){
        const entry = this.formatLogEntry('ACCOUNT_LOCKED', 'Account Locked', {
            username,
            ip
        });
        this.writeLog(entry);
    }

    // Read log content (admin only)
    readLogs(lines = 100) {
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }

            const content = fs.readFileSync(this.logFile, 'utf8');
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
}

module.exports = new LoggerService();