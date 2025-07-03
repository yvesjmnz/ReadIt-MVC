const User = require('../models/User');
const bcrypt = require('bcryptjs');
const sampleProfiles = require('../models/sampleProfiles');

class UserService {
    static async findByUsername(username) {
        return await User.findOne({ username });
    }

    static async findAll() {
        const usersFromDB = await User.find().lean();
        return [...usersFromDB, ...sampleProfiles];
    }

    static async create(userData) {
        const { username, password, quote } = userData;
        
        const existingUser = await this.findByUsername(username);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            username,
            password: hashedPassword,
            quote
        });

        return await user.save();
    }

    static async authenticate(username, password) {
        const user = await this.findByUsername(username);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        return user;
    }

    static async updateProfile(username, updateData) {
        return await User.findOneAndUpdate({ username }, updateData, { new: true });
    }

    static async getUserProfile(username) {
        // Check database first
        const userFromDB = await User.findOne({ username }).lean();
        if (userFromDB) return userFromDB;

        // Check sample profiles
        return sampleProfiles.find(profile => profile.username === username);
    }
}

module.exports = UserService;