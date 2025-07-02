document.addEventListener('DOMContentLoaded', () => {
    const loggedInUsername = document.body.getAttribute('data-username');
    
    // Notification system
    function showNotification(message, type = 'info') {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
            ${type === 'success' ? 'background-color: #28a745; color: white;' : ''}
            ${type === 'error' ? 'background-color: #dc3545; color: white;' : ''}
            ${type === 'info' ? 'background-color: #007bff; color: white;' : ''}
            ${type === 'warning' ? 'background-color: #ffc107; color: #212529;' : ''}
        `;
        
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
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

    // Edit Post Modal
    function createEditModal(postId, currentTitle, currentDescription) {
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
                margin: 5% auto;
                padding: 20px;
                border-radius: 10px;
                width: 80%;
                max-width: 600px;
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
                <h2>Edit Post</h2>
                <form id="edit-post-form">
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Title:</label>
                        <input type="text" id="edit-title" value="${currentTitle}" required maxlength="200" minlength="5" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #555;
                            border-radius: 5px;
                            background-color: #3a3a3a;
                            color: #fff;
                            font-size: 16px;
                            box-sizing: border-box;
                        ">
                        <div style="text-align: right; margin-top: 5px;">
                            <span id="edit-title-count" style="font-size: 0.8em; color: #6c757d;">${currentTitle.length}/200</span>
                        </div>
                    </div>
                    <div style="margin: 15px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
                        <textarea id="edit-description" required maxlength="5000" minlength="10" rows="6" style="
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
                        ">${currentDescription}</textarea>
                        <div style="text-align: right; margin-top: 5px;">
                            <span id="edit-description-count" style="font-size: 0.8em; color: #6c757d;">${currentDescription.length}/5000</span>
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
                        ">Update Post</button>
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

        // Character counters
        const titleInput = modal.querySelector('#edit-title');
        const descInput = modal.querySelector('#edit-description');
        const titleCount = modal.querySelector('#edit-title-count');
        const descCount = modal.querySelector('#edit-description-count');

        titleInput.addEventListener('input', () => {
            titleCount.textContent = `${titleInput.value.length}/200`;
        });

        descInput.addEventListener('input', () => {
            descCount.textContent = `${descInput.value.length}/5000`;
        });

        return modal;
    }
    
    // Show edit and delete buttons for posts authored by the logged-in user
    const postUserElement = document.querySelector('.post-community a[href^="/profile/"]');
    if (postUserElement) {
        const postUser = postUserElement.textContent.trim();
        if (postUser === loggedInUsername) {
            const buttons = document.querySelectorAll('.edit-post-button, .delete-post-button');
            buttons.forEach(button => button.style.display = 'inline');
        }
    }

    // Make functions global for onclick handlers
    window.editPost = function(postId, currentTitle, currentDescription) {
        const modal = createEditModal(postId, currentTitle, currentDescription);
        
        const form = modal.querySelector('#edit-post-form');
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

            const newTitle = modal.querySelector('#edit-title').value.trim();
            const newDescription = modal.querySelector('#edit-description').value.trim();

            try {
                const response = await fetch(`/api/post/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ title: newTitle, post_description: newDescription })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Post updated successfully!', 'success');
                    closeModal();
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showNotification(data.error || 'Failed to edit post', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while editing the post', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    };

    window.deletePost = async function(postId) {
        const confirmed = await showConfirmation(
            'Delete Post',
            'Are you sure you want to delete this post? This action cannot be undone.'
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/post/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Post deleted successfully!', 'success');
                    setTimeout(() => window.location.href = '/', 1000);
                } else {
                    showNotification(data.error || 'Failed to delete post', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while deleting the post', 'error');
            }
        }
    };
});