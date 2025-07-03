class PostActions {
    constructor() {
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Like/Dislike buttons
        DOMUtils.delegate(document, '.like-button', 'click', this.handleLike.bind(this));
        DOMUtils.delegate(document, '.dislike-button', 'click', this.handleDislike.bind(this));
        
        // Edit/Delete buttons
        DOMUtils.delegate(document, '.edit-post-btn', 'click', this.handleEdit.bind(this));
        DOMUtils.delegate(document, '.delete-post-btn', 'click', this.handleDelete.bind(this));
        
        // Moderation buttons
        DOMUtils.delegate(document, '.moderate-post-btn', 'click', this.handleModeration.bind(this));
    }

    async handleLike(e) {
        e.stopPropagation();
        const postId = this.getPostId(e.target);
        if (!postId) return;

        try {
            const result = await PostApi.like(postId);
            this.updateLikeDislikeCounts(postId, result);
            NotificationSystem.success('Post liked!');
        } catch (error) {
            NotificationSystem.error('Failed to like post');
        }
    }

    async handleDislike(e) {
        e.stopPropagation();
        const postId = this.getPostId(e.target);
        if (!postId) return;

        try {
            const result = await PostApi.dislike(postId);
            this.updateLikeDislikeCounts(postId, result);
            NotificationSystem.success('Post disliked!');
        } catch (error) {
            NotificationSystem.error('Failed to dislike post');
        }
    }

    async handleEdit(e) {
        e.stopPropagation();
        const postId = e.target.dataset.postId;
        const title = e.target.dataset.title;
        const description = e.target.dataset.description;

        const modal = new Modal({
            title: 'Edit Post',
            content: this.createEditForm(postId, title, description),
            className: 'edit-post-modal'
        });

        modal.open();
        this.setupEditForm(modal, postId);
    }

    async handleDelete(e) {
        e.stopPropagation();
        const postId = e.target.dataset.postId;

        const confirmed = await Modal.confirm(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                await PostApi.delete(postId);
                NotificationSystem.success('Post deleted successfully!');
                setTimeout(() => window.location.href = '/', 1000);
            } catch (error) {
                NotificationSystem.error('Failed to delete post');
            }
        }
    }

    async handleModeration(e) {
        e.stopPropagation();
        const postId = e.target.dataset.postId;
        const isLocked = e.target.dataset.locked === 'true';

        if (isLocked) {
            // Unlock post
            const confirmed = await Modal.confirm(
                'Unlock Post',
                'Are you sure you want to unlock this post? Users will be able to comment again.'
            );

            if (confirmed) {
                await this.submitModerationAction(postId, 'unlock', 'Post unlocked by moderator');
            }
        } else {
            // Lock post - ask for reason
            const modal = new Modal({
                title: 'Lock Post',
                content: this.createLockForm(),
                className: 'lock-post-modal'
            });

            modal.open();
            this.setupLockForm(modal, postId);
        }
    }

    createLockForm() {
        return `
            <form id="lock-post-form">
                <div class="form-group">
                    <label for="lock-reason">Reason for locking this post:</label>
                    <textarea id="lock-reason" name="reason" 
                              placeholder="Enter the violation reason..." 
                              required minlength="5" maxlength="500" rows="3"
                              data-max-length="500" data-counter="lock-reason-count"></textarea>
                    <div class="char-counter" id="lock-reason-count">0/500</div>
                    <small>Minimum 5 characters required</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-danger">Lock Post</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    setupLockForm(modal, postId) {
        const form = modal.element.querySelector('#lock-post-form');
        
        const formHandler = new FormHandler(form, {
            validation: {
                reason: [
                    ValidationRules.required,
                    ValidationRules.minLength(5),
                    ValidationRules.maxLength(500)
                ]
            },
            onSubmit: async (data) => {
                await this.submitModerationAction(postId, 'lock', data.reason);
                modal.close();
            }
        });
    }

    async submitModerationAction(postId, action, reason) {
        try {
            await PostApi.moderate(postId, action, reason);
            NotificationSystem.success(`Post ${action}ed successfully!`);
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            NotificationSystem.error(`Failed to ${action} post: ${error.message}`);
        }
    }

    getPostId(element) {
        const postElement = element.closest('[data-post-id]');
        return postElement ? postElement.dataset.postId : null;
    }

    updateLikeDislikeCounts(postId, result) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const likesElement = postElement.querySelector('.likes-count');
            const dislikesElement = postElement.querySelector('.dislikes-count');
            
            if (likesElement) likesElement.textContent = result.likes;
            if (dislikesElement) dislikesElement.textContent = result.dislikes;
        }
    }

    createEditForm(postId, title, description) {
        return `
            <form id="edit-post-form">
                <div class="form-group">
                    <label for="edit-title">Title:</label>
                    <input type="text" id="edit-title" name="title" value="${title}" 
                           required maxlength="200" minlength="5"
                           data-max-length="200" data-counter="edit-title-count">
                    <div class="char-counter" id="edit-title-count"></div>
                </div>
                <div class="form-group">
                    <label for="edit-description">Description:</label>
                    <textarea id="edit-description" name="post_description" 
                              required maxlength="5000" minlength="10" rows="6"
                              data-max-length="5000" data-counter="edit-description-count">${description}</textarea>
                    <div class="char-counter" id="edit-description-count"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Post</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    setupEditForm(modal, postId) {
        const form = modal.element.querySelector('#edit-post-form');
        
        const formHandler = new FormHandler(form, {
            validation: {
                title: [
                    ValidationRules.required,
                    ValidationRules.minLength(5),
                    ValidationRules.maxLength(200)
                ],
                post_description: [
                    ValidationRules.required,
                    ValidationRules.minLength(10),
                    ValidationRules.maxLength(5000)
                ]
            },
            onSubmit: async (data) => {
                await PostApi.update(postId, data);
                NotificationSystem.success('Post updated successfully!');
                modal.close();
                setTimeout(() => window.location.reload(), 1000);
            }
        });
    }
}

// Initialize
new PostActions();