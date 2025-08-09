const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sampleProfiles = require('../models/sampleProfiles');
const logger = require('./loggerService');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const PASSWORD_MIN_AGE = 24 * 60 * 60 * 1000; // 1 day

class UserService {
    static async findByUsername(username) {
        return await User.findOne({ username });
    }

    static async findAll() {
        const usersFromDB = await User.find().lean();
        return [...usersFromDB, ...sampleProfiles];
    }

    static isPasswordStrong(password) {
        // Minimum 12 chars, upper, lower, number, special
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&_.])[A-Za-z\d@$!%*?#&_.]{12,}$/.test(password);
    }

    static async create({ username, password, quote, securityQuestions = null, ip = null}) {
        const existingUser = await this.findByUsername(username);
        if (existingUser) {
            logger.logValidationFailure('username', username, 'user already exists', username, ip);
            throw new Error('User already exists');
        }

        if (!this.isPasswordStrong(password)) {
            logger.logValidationFailure('password', '[REDACTED]', 'weak password', username, ip);
            throw new Error('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this should be the first admin
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;
        const isFirstAdmin = process.env.FIRST_ADMIN_USERNAME && 
                            username === process.env.FIRST_ADMIN_USERNAME;

        const userData = {
            username,
            password: hashedPassword,
            quote,
            passwordLastChanged: new Date(),
            passwordHistory: [{ hash: hashedPassword, changedAt: new Date() }],
            failedAttempts: 0,
            isAdmin: isFirstUser || isFirstAdmin,
            adminGrantedBy: isFirstUser ? 'system' : (isFirstAdmin ? 'environment' : undefined),
            adminGrantedAt: (isFirstUser || isFirstAdmin) ? new Date() : undefined
        };

        // Add security questions if provided
        if (securityQuestions && Array.isArray(securityQuestions)) {
            const hashedQuestions = await Promise.all(
                securityQuestions.map(async (qa) => ({
                    question: qa.question,
                    answer: await bcrypt.hash(qa.answer.trim().toLowerCase(), 10),
                    createdAt: new Date()
                }))
            );
            userData.securityQuestions = hashedQuestions;
        }

        const user = new User(userData);
        logger.logAccountCreated(username, ip);
        return await user.save();
    }

    static async authenticate(username, password, ip = null, userAgent = null) {
    const user = await this.findByUsername(username);
    const now = new Date();

    if (!user) {
        logger.logAuthFailure(username, ip, userAgent, 'User not found');
        throw new Error('Invalid credentials');
    }

    // update lastLoginAttempt
    user.lastLoginAttempt = now;

    // Account lock check
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const unlockTime = new Date(user.lockUntil).toLocaleString('en-PH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            day: '2-digit',
            month: 'short'
        });
        logger.logAuthFailure(username, ip, userAgent, 'Account locked');

        await user.save();
        throw new Error(`Account is temporarily locked until ${unlockTime}.`);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        user.failedAttempts += 1;
        logger.logAuthFailure(username, ip, userAgent, 'Invalid password');

        // Account lock logic
        if (user.failedAttempts >= 5) {
            const lockMinutes = 5;
            user.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
            logger.logAccountLock(username, ip);
        }

        await user.save(); 
        throw new Error('Invalid credentials');
    }

    // Success
    user.failedAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = now; 
    await user.save();

    logger.logAuthSuccess(username, ip, userAgent, 'Authentication successful');

    return user;
}


    static async updatePassword(username, currentPassword, newPassword, ip = null) {
        const user = await this.findByUsername(username);
        if (!user) throw new Error('User not found');

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            logger.logValidationFailure('currentPassword', '[REDACTED]', 'incorrect current password', username, ip);
            throw new Error('Current password is incorrect');
        }

        const lastChanged = user.passwordLastChanged || new Date(0);
        if (Date.now() - new Date(lastChanged).getTime() < PASSWORD_MIN_AGE) {
            logger.logValidationFailure('passwordLastChanged', lastChanged, 'password change before min age', username, ip);
            throw new Error('You can only change your password once every 24 hours.');
        }

        if (!this.isPasswordStrong(newPassword)) {
            logger.logValidationFailure('newPassword', '[REDACTED]', 'weak password', username, ip);
            throw new Error('New password is not strong enough.');
        }

        // Prevent password reuse
        for (const old of user.passwordHistory || []) {
            if (await bcrypt.compare(newPassword, old.hash)) {
                logger.logValidationFailure('newPassword', '[REDACTED]', 'password reuse detected', username, ip);
                throw new Error('You cannot reuse a previously used password.');
            }
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        user.passwordLastChanged = new Date();

        // Save password history (keep last 5)
        user.passwordHistory = user.passwordHistory || [];
        user.passwordHistory.push({ hash: hashedNewPassword, changedAt: new Date() });
        if (user.passwordHistory.length > 5) {
            user.passwordHistory.shift();
        }

        await user.save();
        logger.logPasswordChange(username, ip);
        return true;
    }

    static async updateProfile(username, updateData) {
        return await User.findOneAndUpdate({ username }, updateData, { new: true });
    }

    static async getUserProfile(username) {
        const userFromDB = await User.findOne({ username }).lean();
        if (userFromDB) return userFromDB;

        return sampleProfiles.find(profile => profile.username === username);
    }
}

module.exports = UserService;
