document.addEventListener('DOMContentLoaded', () => {
    const loggedInUsername = document.body.getAttribute('data-username');
    
    // Notification system
    function showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Confirmation dialog
    function showConfirmation(title, message) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = `
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
            `;

            modal.innerHTML = `
                <div class="modal-content" style="
                    background-color: #2c2c2c;
                    margin: 15% auto;
                    padding: 20px;
                    border-radius: 10px;
                    width: 80%;
                    max-width: 400px;
                    text-align: center;
                    color: white;
                ">
                    <h3 style="margin-top: 0; color: #dc3545;">${title}</h3>
                    <p>${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                        <button id="confirm-yes" style="
                            background-color: #dc3545;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Yes</button>
                        <button id="confirm-no" style="
                            background-color: #6c757d;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">No</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            document.body.style.overflow = 'hidden';

            const confirmYes = modal.querySelector('#confirm-yes');
            const confirmNo = modal.querySelector('#confirm-no');

            function cleanup() {
                modal.remove();
                document.body.style.overflow = 'auto';
            }

            confirmYes.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            confirmNo.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    // Edit Comment Modal
    function createEditCommentModal(postId, commentId, currentText) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: #2c2c2c;
                margin: 10% auto;
                padding: 20px;
                border-radius: 10px;
                width: 80%;
                max-width: 500px;
                color: white;
                position: relative;
            ">
                <span class="close" style="
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    position: absolute;
                    right: 15px;
                    top: 10px;
                ">&times;</span>
                <h2>Edit Comment</h2>
                <form id="edit-comment-form">
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Comment:</label>
                        <textarea id="edit-comment-text" required maxlength="1000" minlength="1" rows="4" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #555;
                            border-radius: 5px;
                            background-color: #3a3a3a;
                            color: #fff;
                            font-size: 16px;
                            font-family: inherit;
                            box-sizing: border-box;
                            resize: vertical;
                        ">${currentText}</textarea>
                        <div style="text-align: right; margin-top: 5px;">
                            <span id="edit-comment-count" style="font-size: 0.8em; color: #6c757d;">${currentText.length}/1000</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button type="submit" style="
                            background-color: #007BFF;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Update Comment</button>
                        <button type="button" class="cancel-btn" style="
                            background-color: #6c757d;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Character counter
        const textInput = modal.querySelector('#edit-comment-text');
        const textCount = modal.querySelector('#edit-comment-count');

        textInput.addEventListener('input', () => {
            const length = textInput.value.length;
            textCount.textContent = `${length}/1000`;
            
            if (length > 900) {
                textCount.style.color = '#dc3545';
            } else if (length > 800) {
                textCount.style.color = '#ffc107';
            } else {
                textCount.style.color = '#6c757d';
            }
        });

        return modal;
    }
    
    // Show edit and delete buttons for comments authored by the logged-in user
    document.querySelectorAll('.comment-user').forEach(comment => {
        const commentUser = comment.querySelector('a').textContent.trim();
        if (commentUser === loggedInUsername) {
            const buttons = comment.parentElement.querySelectorAll('.edit-button, .delete-button');
            buttons.forEach(button => button.style.display = 'inline');
        }
    });

    // Make functions global for onclick handlers
    window.editComment = function(postId, commentId, currentText) {
        const modal = createEditCommentModal(postId, commentId, currentText);
        
        const form = modal.querySelector('#edit-comment-form');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');

        function closeModal() {
            modal.remove();
            document.body.style.overflow = 'auto';
        }

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Updating...';
            submitBtn.disabled = true;

            const newText = modal.querySelector('#edit-comment-text').value.trim();

            try {
                const response = await fetch(`/api/post/${postId}/comment/${commentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ text: newText })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Comment updated successfully!', 'success');
                    closeModal();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showNotification(data.error || 'Failed to edit comment', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while editing the comment', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    };

    window.deleteComment = async function(postId, commentId) {
        const confirmed = await showConfirmation(
            'Delete Comment',
            'Are you sure you want to delete this comment? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/post/${postId}/comment/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Comment deleted successfully!', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showNotification(data.error || 'Failed to delete comment', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while deleting the comment', 'error');
            }
        }
    };
});