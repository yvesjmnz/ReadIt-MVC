class CommentActions {
    constructor() {
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        DOMUtils.delegate(document, '.edit-comment-btn', 'click', this.handleEdit.bind(this));
        DOMUtils.delegate(document, '.delete-comment-btn', 'click', this.handleDelete.bind(this));
    }

    async handleEdit(e) {
        const postId = e.target.dataset.postId;
        const commentId = e.target.dataset.commentId;
        const currentText = e.target.dataset.text;

        if (!postId || !commentId) {
            NotificationSystem.error('Missing post or comment ID');
            return;
        }

        const modal = new Modal({
            title: 'Edit Comment',
            content: this.createEditForm(currentText),
            className: 'edit-comment-modal'
        });

        modal.open();
        this.setupEditForm(modal, postId, commentId);
    }

    async handleDelete(e) {
        const postId = e.target.dataset.postId;
        const commentId = e.target.dataset.commentId;

        const confirmed = await Modal.confirm(
            'Delete Comment',
            'Are you sure you want to delete this comment? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                await PostApi.deleteComment(postId, commentId);
                NotificationSystem.success('Comment deleted successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                NotificationSystem.error('Failed to delete comment');
            }
        }
    }

    createEditForm(currentText) {
        return `
            <form id="edit-comment-form">
                <div class="form-group">
                    <label for="edit-comment-text">Comment:</label>
                    <textarea id="edit-comment-text" name="text" 
                              required maxlength="1000" minlength="1" rows="4"
                              data-max-length="1000" data-counter="edit-comment-count">${currentText}</textarea>
                    <div class="char-counter" id="edit-comment-count"></div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Comment</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    setupEditForm(modal, postId, commentId) {
        const form = modal.element.querySelector('#edit-comment-form');
        
        const formHandler = new FormHandler(form, {
            validation: {
                text: [
                    ValidationRules.required,
                    ValidationRules.maxLength(1000)
                ]
            },
            onSubmit: async (data) => {
                try {
                    await PostApi.updateComment(postId, commentId, data.text);
                    NotificationSystem.success('Comment updated successfully!');
                    modal.close();
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    console.error('Comment update error:', error);
                    NotificationSystem.error(`Failed to update comment: ${error.message}`);
                }
            }
        });
    }
}

// Initialize
new CommentActions();