document.addEventListener('DOMContentLoaded', () => {
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

    document.querySelectorAll('.comment-form').forEach(form => {
        const textarea = form.querySelector('textarea[name="comment"]');
        const submitButton = form.querySelector('button[type="submit"]');

        // Handle Enter key press in textarea
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitButton.click();
            }
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const postId = form.getAttribute('data-post-id');
            const commentText = textarea.value.trim();

            if (!commentText) {
                showNotification('Comment cannot be empty', 'warning');
                textarea.focus();
                return;
            }

            if (commentText.length > 1000) {
                showNotification('Comment must be less than 1000 characters', 'warning');
                return;
            }

            const originalText = submitButton.textContent;
            submitButton.textContent = 'Posting...';
            submitButton.disabled = true;

            try {
                const response = await fetch(`/api/post/${postId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: commentText })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    showNotification('Comment added successfully!', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showNotification(result.error || 'Failed to add comment', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while adding comment', 'error');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    });
});