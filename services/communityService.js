const Community = require('../models/Community');
const User = require('../models/User');

class CommunityService {
    static async findByName(name) {
        return await Community.findOne({ name });
    }

    static async findAll() {
        return await Community.find();
    }

    static async create(data) {
        const community = new Community(data);
        return await community.save();
    }

    static async addModerator(communityName, username) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        const user = await User.findOne({ username });
        if (!user) throw new Error('User not found');

        if (community.isModerator(username)) {
            throw new Error('User is already a moderator');
        }

        if (!community.members.includes(username)) {
            community.members.push(username);
        }

        community.addModerator(username);
        return await community.save();
    }

    static async removeModerator(communityName, username) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        if (!community.moderators.includes(username)) {
            throw new Error('User is not a moderator');
        }

        community.removeModerator(username);
        return await community.save();
    }

    static async joinCommunity(communityName, username) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        if (community.isBanned(username)) {
            throw new Error('You are banned from this community');
        }

        if (!community.members.includes(username)) {
            community.members.push(username);
            await community.save();
        }
        return community;
    }

    static async leaveCommunity(communityName, username) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        if (community.creator === username) {
            throw new Error('Creator cannot leave their own community');
        }

        community.members = community.members.filter(member => member !== username);
        community.removeModerator(username);
        return await community.save();
    }

    static async banUser(communityName, username, reason, bannedBy) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        const user = await User.findOne({ username });
        if (!user) throw new Error('User not found');

        if (community.creator === username) {
            throw new Error('Cannot ban community creator');
        }

        if (!community.members.includes(username)) {
            throw new Error('User is not a member of this community');
        }

        community.banUser(username, reason, bannedBy);
        return await community.save();
    }

    static async unbanUser(communityName, username) {
        const community = await this.findByName(communityName);
        if (!community) throw new Error('Community not found');

        if (!community.isBanned(username)) {
            throw new Error('User is not banned');
        }

        community.unbanUser(username);
        return await community.save();
    }

    static getUserRole(community, username) {
        if (!username) return null;
        if (community.isBanned(username)) return 'banned';
        if (community.creator === username) return 'creator';
        if (community.isModerator(username)) return 'moderator';
        if (community.members.includes(username)) return 'member';
        return null;
    }

    static getBanInfo(community, username) {
        return community.getBanInfo(username);
    }

    static async getUserCommunities(username) {
        if (!username) return [];
        
        const communities = await this.findAll();
        return communities.filter(community => 
            community.members.includes(username) || 
            community.creator === username
        );
    }
}

module.exports = CommunityService;