const Post = require('../models/Post');
const CommunityService = require('./communityService');

class PostService {
    static async findById(id) {
        if (!id || id === 'undefined' || typeof id !== 'string') {
            throw new Error('Invalid post ID provided');
        }
        
        // Validate ObjectId format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            throw new Error('Invalid post ID format');
        }
        
        return await Post.findById(id);
    }

    static async findAll() {
        return await Post.find().sort({ date: -1 });
    }

    static async findByCommunity(communityName) {
        return await Post.find({ communityName }).sort({ date: -1 });
    }

    static async create(data) {
        if (data.communityName) {
            const community = await CommunityService.findByName(data.communityName);
            if (!community) throw new Error('Community not found');
        }

        const post = new Post({
            ...data,
            likes: 0,
            dislikes: 0,
            likedBy: [],
            dislikedBy: [],
            comments: [],
            locked: false,
            violations: []
        });

        return await post.save();
    }

    static async update(id, data, username) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');

        if (post.locked) throw new Error('Cannot edit locked post');

        const canEdit = await this.canUserModify(post, username);
        if (!canEdit) throw new Error('Permission denied');

        Object.assign(post, data);
        return await post.save();
    }

    static async delete(id, username) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');

        if (post.locked) throw new Error('Cannot delete locked post');

        const canDelete = await this.canUserModify(post, username);
        if (!canDelete) throw new Error('Permission denied');

        return await Post.findByIdAndDelete(id);
    }

    static async toggleLike(id, username) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');
        if (post.locked) throw new Error('Cannot like locked post');

        // Remove from disliked if previously disliked
        if (post.dislikedBy.includes(username)) {
            post.dislikedBy = post.dislikedBy.filter(user => user !== username);
            post.dislikes = Math.max(0, post.dislikes - 1);
        }

        // Toggle like
        if (post.likedBy.includes(username)) {
            post.likedBy = post.likedBy.filter(user => user !== username);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            post.likedBy.push(username);
            post.likes += 1;
        }

        await post.save();
        return { likes: post.likes, dislikes: post.dislikes };
    }

    static async toggleDislike(id, username) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');
        if (post.locked) throw new Error('Cannot dislike locked post');

        // Remove from liked if previously liked
        if (post.likedBy.includes(username)) {
            post.likedBy = post.likedBy.filter(user => user !== username);
            post.likes = Math.max(0, post.likes - 1);
        }

        // Toggle dislike
        if (post.dislikedBy.includes(username)) {
            post.dislikedBy = post.dislikedBy.filter(user => user !== username);
            post.dislikes = Math.max(0, post.dislikes - 1);
        } else {
            post.dislikedBy.push(username);
            post.dislikes += 1;
        }

        await post.save();
        return { likes: post.likes, dislikes: post.dislikes };
    }

    static async addComment(id, text, username) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');
        if (post.locked) throw new Error('Cannot comment on locked post');

        const comment = {
            user: username,
            text: text.trim(),
            date: new Date(),
            edited: false
        };

        post.comments.push(comment);
        await post.save();
        return comment;
    }

    static async updateComment(postId, commentId, text, username) {
        const post = await this.findById(postId);
        if (!post) throw new Error('Post not found');
        if (post.locked) throw new Error('Cannot edit comments on locked post');

        const comment = post.comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        const canEdit = await this.canUserModifyComment(post, comment, username);
        if (!canEdit) throw new Error('Permission denied');

        comment.text = text.trim();
        comment.edited = true;
        await post.save();
        return comment;
    }

    static async deleteComment(postId, commentId, username) {
        const post = await this.findById(postId);
        if (!post) throw new Error('Post not found');
        if (post.locked) throw new Error('Cannot delete comments on locked post');

        const comment = post.comments.id(commentId);
        if (!comment) throw new Error('Comment not found');

        const canDelete = await this.canUserModifyComment(post, comment, username);
        if (!canDelete) throw new Error('Permission denied');

        post.comments.pull(commentId);
        await post.save();
        return true;
    }

    static async moderate(id, action, reason, moderatorUsername) {
        const post = await this.findById(id);
        if (!post) throw new Error('Post not found');

        const canModerate = await this.canUserModerate(post, moderatorUsername);
        if (!canModerate) throw new Error('Permission denied');

        if (action === 'lock') {
            if (post.locked) throw new Error('Post already locked');
            
            post.locked = true;
            post.lockedBy = moderatorUsername;
            post.lockedAt = new Date();
            post.lockReason = reason;

            post.violations.push({
                moderator: moderatorUsername,
                reason,
                action: 'locked',
                date: new Date()
            });
        } else if (action === 'unlock') {
            if (!post.locked) throw new Error('Post not locked');
            
            post.locked = false;
            post.lockedBy = undefined;
            post.lockedAt = undefined;
            post.lockReason = undefined;

            post.violations.push({
                moderator: moderatorUsername,
                reason: reason || 'Post unlocked by moderator',
                action: 'unlocked',
                date: new Date()
            });
        }

        return await post.save();
    }

    static async canUserModify(post, username) {
        if (post.user === username) return true;
        return await this.canUserModerate(post, username);
    }

    static async canUserModifyComment(post, comment, username) {
        if (comment.user === username) return true;
        return await this.canUserModerate(post, username);
    }

    static async canUserModerate(post, username) {
        if (!post.communityName) return false;
        const community = await CommunityService.findByName(post.communityName);
        return community && community.isModerator(username);
    }
}

module.exports = PostService;