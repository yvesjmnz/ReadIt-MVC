
document.addEventListener('DOMContentLoaded', () => {
    const postDivs = document.querySelectorAll('.post');

    postDivs.forEach(postDiv => {
        postDiv.addEventListener('click', () => {
            const postId = postDiv.getAttribute('data-post-id');
            if (postId) {
                window.location.href = `/api/post/${postId}`;
            }
        });
    });
});
