const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sampleProfiles = require('../models/sampleProfiles');

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
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{12,}$/.test(password);
    }

    static async create({ username, password, quote }) {
        const existingUser = await this.findByUsername(username);
        if (existingUser) throw new Error('User already exists');

        if (!this.isPasswordStrong(password)) {
            throw new Error('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            quote,
            passwordLastChanged: new Date(),
            passwordHistory: [{ hash: hashedPassword, changedAt: new Date() }],
            failedAttempts: 0
        });

        return await user.save();
    }

    static async authenticate(username, password) {
        const user = await this.findByUsername(username);
        if (!user) {
            throw new Error('Invalid credentials'); // Generic
        }

        // Account lock check
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const unlockTime = new Date(user.lockUntil).toLocaleString('en-PH', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                day: '2-digit',
                month: 'short'
            });
            throw new Error(`Account is temporarily locked until ${unlockTime}.`);
}


        const isValid = await bcrypt.compare(password, user.password);
        user.lastLoginAttempt = new Date();

        if (!isValid) {
            user.failedAttempts = (user.failedAttempts || 0) + 1;

            if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCK_TIME;
                user.failedAttempts = 0;
            }

            await user.save();
            throw new Error('Invalid credentials'); // Generic
        }

        // Successful login
        user.failedAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();

        await user.save();
        return user;
    }

    static async updatePassword(username, currentPassword, newPassword) {
        const user = await this.findByUsername(username);
        if (!user) throw new Error('User not found');

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) throw new Error('Current password is incorrect');

        const lastChanged = user.passwordLastChanged || new Date(0);
        if (Date.now() - new Date(lastChanged).getTime() < PASSWORD_MIN_AGE) {
            throw new Error('You can only change your password once every 24 hours.');
        }

        if (!this.isPasswordStrong(newPassword)) {
            throw new Error('New password is not strong enough.');
        }

        // Prevent password reuse
        for (const old of user.passwordHistory || []) {
            if (await bcrypt.compare(newPassword, old.hash)) {
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
