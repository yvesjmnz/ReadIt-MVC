document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.comment-form').forEach(form => {
        const textarea = form.querySelector('textarea[name="comment"]');
        const submitButton = form.querySelector('button[type="submit"]');

        // Handle Enter key press in textarea
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline from being inserted
                submitButton.click(); // Trigger form submission
            }
        });

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const postId = form.getAttribute('data-post-id');
            const commentText = textarea.value.trim();

            if (!commentText) {
                alert('Comment cannot be empty.');
                return;
            }

            try {
                const response = await fetch(`/api/post/${postId}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ comment: commentText })
                });

                const result = await response.json();

                if (result.success) {
                    // Reload the page or update the comments section dynamically
                    location.reload();
                } else {
                    alert(result.error || 'Failed to add comment.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to add comment.');
            }
        });
    });
});
