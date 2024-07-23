document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const postId = form.getAttribute('data-post-id');
            const commentText = form.querySelector('textarea[name="comment"]').value;

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
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to add comment');
            }
        });
    });
});