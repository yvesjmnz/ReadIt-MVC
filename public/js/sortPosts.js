document.addEventListener('DOMContentLoaded', () => {
    const sortFilter = document.getElementById('sort-filter');
    const postsContainer = document.getElementById('posts-container');
    const posts = Array.from(postsContainer.querySelectorAll('.post'));

    // Get the logged-in username from the body or an element
    const loggedInUsername = document.body.getAttribute('data-username');

    function sortPosts(criteria) {
        let sortedPosts;

        switch (criteria) {
            case 'recent':
                sortedPosts = posts.sort((a, b) => {
                    const dateA = new Date(a.querySelector('p').textContent);
                    const dateB = new Date(b.querySelector('p').textContent);
                    return dateB - dateA;
                });
                break;
            case 'most-popular':
                sortedPosts = posts.sort((a, b) => {
                    const likesA = parseInt(a.querySelector('.likes-count').textContent);
                    const likesB = parseInt(b.querySelector('.likes-count').textContent);
                    return likesB - likesA;
                });
                break;
            case 'least-popular':
                sortedPosts = posts.sort((a, b) => {
                    const likesA = parseInt(a.querySelector('.likes-count').textContent);
                    const likesB = parseInt(b.querySelector('.likes-count').textContent);
                    return likesA - likesB;
                });
                break;
            case 'my-posts':
                sortedPosts = posts.filter(post => 
                    post.querySelector('.post-community').textContent.includes(loggedInUsername)
                );
                break;
            default:
                sortedPosts = posts;
        }

        postsContainer.innerHTML = '';
        sortedPosts.forEach(post => postsContainer.appendChild(post));
    }

    sortFilter.addEventListener('change', () => {
        const selectedCriteria = sortFilter.value;
        sortPosts(selectedCriteria);
    });

    sortPosts(sortFilter.value);
});
