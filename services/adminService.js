const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');

class AdminService {
    // Grant admin privileges to a user
    static async grantAdmin(targetUsername, grantedByUsername) {
        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            throw new Error('User not found');
        }

        if (targetUser.isAdmin) {
            throw new Error('User is already an administrator');
        }

        targetUser.isAdmin = true;
        targetUser.adminGrantedBy = grantedByUsername;
        targetUser.adminGrantedAt = new Date();
        
        await targetUser.save();
        return targetUser;
    }

    // Revoke admin privileges from a user
    static async revokeAdmin(targetUsername, revokedByUsername) {
        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            throw new Error('User not found');
        }

        if (!targetUser.isAdmin) {
            throw new Error('User is not an administrator');
        }

        // Prevent self-revocation
        if (targetUsername === revokedByUsername) {
            throw new Error('Cannot revoke your own admin privileges');
        }

        targetUser.isAdmin = false;
        targetUser.adminGrantedBy = undefined;
        targetUser.adminGrantedAt = undefined;
        
        await targetUser.save();
        return targetUser;
    }

    // Get all administrators
    static async getAllAdmins() {
        return await User.find({ isAdmin: true }, { 
            username: 1, 
            adminGrantedBy: 1, 
            adminGrantedAt: 1,
            _id: 0 
        });
    }

    // Ban a user site-wide (removes from all communities and prevents all actions)
    static async banUser(targetUsername, reason, bannedByUsername) {
        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            throw new Error('User not found');
        }

        if (targetUser.isAdmin) {
            throw new Error('Cannot ban an administrator');
        }

        if (targetUser.isBanned) {
            throw new Error('User is already banned');
        }

        // Update user with ban information
        targetUser.isBanned = true;
        targetUser.banReason = reason;
        targetUser.bannedBy = bannedByUsername;
        targetUser.bannedAt = new Date();
        await targetUser.save();

        // Remove user from all communities
        await Community.updateMany(
            { members: targetUsername },
            { 
                $pull: { 
                    members: targetUsername,
                    moderators: targetUsername 
                }
            }
        );

        // Add ban record to all communities
        await Community.updateMany(
            {},
            {
                $set: {
                    [`bannedUsers.${targetUsername}`]: {
                        reason: `Site-wide ban: ${reason}`,
                        bannedBy: `admin:${bannedByUsername}`,
                        bannedAt: new Date()
                    }
                }
            }
        );

        return { success: true, message: 'User banned site-wide' };
    }

    // Unban a user site-wide
    static async unbanUser(targetUsername, unbannedByUsername) {
        const targetUser = await User.findOne({ username: targetUsername });
        if (!targetUser) {
            throw new Error('User not found');
        }

        if (!targetUser.isBanned) {
            throw new Error('User is not banned');
        }

        // Remove ban from user
        targetUser.isBanned = false;
        targetUser.banReason = undefined;
        targetUser.bannedBy = undefined;
        targetUser.bannedAt = undefined;
        await targetUser.save();

        // Remove ban record from all communities
        await Community.updateMany(
            {},
            {
                $unset: {
                    [`bannedUsers.${targetUsername}`]: ""
                }
            }
        );

        return { success: true, message: 'User unbanned site-wide' };
    }

    // Delete a post (admin override)
    static async deletePost(postId, deletedByUsername) {
        const post = await Post.findById(postId);
        if (!post) {
            throw new Error('Post not found');
        }

        await Post.findByIdAndDelete(postId);
        return { success: true, message: 'Post deleted by administrator' };
    }

    // Delete a community (admin override)
    static async deleteCommunity(communityName, deletedByUsername) {
        const community = await Community.findOne({ name: communityName });
        if (!community) {
            throw new Error('Community not found');
        }

        // Delete all posts in the community
        await Post.deleteMany({ communityName: communityName });
        
        // Delete the community
        await Community.findOneAndDelete({ name: communityName });
        
        return { success: true, message: 'Community and all its posts deleted by administrator' };
    }

    // Get site statistics
    static async getSiteStats() {
        const [userCount, postCount, communityCount, adminCount] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Community.countDocuments(),
            User.countDocuments({ isAdmin: true })
        ]);

        return {
            users: userCount,
            posts: postCount,
            communities: communityCount,
            admins: adminCount
        };
    }

    // Get all banned users
    static async getBannedUsers() {
        return await User.find({ isBanned: true }, { 
            username: 1, 
            banReason: 1,
            bannedBy: 1, 
            bannedAt: 1,
            _id: 0 
        });
    }


    // Check if user is admin
    static async isAdmin(username) {
        const user = await User.findOne({ username, isAdmin: true });
        return !!user;
    }
}

module.exports = AdminService;