document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');

    if (postsContainer) {
        postsContainer.addEventListener('click', async (event) => {
            const target = event.target;
            const postElement = target.closest('.post');

            if (postElement) {
                const postId = postElement.getAttribute('data-post-id');

                if (target.classList.contains('like-button')) {
                    await updateLikeDislike(postId, 'like');
                } else if (target.classList.contains('dislike-button')) {
                    await updateLikeDislike(postId, 'dislike');
                }
            }
        });
    }
});

async function updateLikeDislike(postId, action) {
    try {
        const response = await fetch(`/post/${postId}/${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const updatedPost = await response.json();
            const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
            if (postElement) {
                postElement.querySelector('.likes-count').textContent = updatedPost.likes;
                postElement.querySelector('.dislikes-count').textContent = updatedPost.dislikes;
            }
        } else {
            console.error('Failed to update like/dislike');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
