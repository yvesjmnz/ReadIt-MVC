document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.like-button').forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.dataset.postId;
            try {
                const response = await fetch(`/post/${postId}/like`, { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    const likesCount = button.querySelector('.likes-count');
                    likesCount.textContent = result.likes;
                }
            } catch (error) {
                console.error('Error liking post:', error);
            }
        });
    });

    document.querySelectorAll('.dislike-button').forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.dataset.postId;
            try {
                const response = await fetch(`/post/${postId}/dislike`, { method: 'POST' });
                const result = await response.json();
                if (result.success) {
                    const dislikesCount = button.querySelector('.dislikes-count');
                    dislikesCount.textContent = result.dislikes;
                }
            } catch (error) {
                console.error('Error disliking post:', error);
            }
        });
    });
});
