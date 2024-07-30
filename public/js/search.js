// search.js

document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById('search-input');
    const communityFilter = document.getElementById('community-filter');
    const postsContainer = document.getElementById('posts-container');
    const noPostsMessage = document.getElementById('no-posts-message');

    // Populate the community filter options
    function populateCommunityFilter() {
        const communities = Array.from(new Set(
            Array.from(postsContainer.querySelectorAll('.post')).map(postElement => 
                postElement.querySelector('.post-community a').textContent
            )
        ));

        communities.forEach(community => {
            const option = document.createElement('option');
            option.value = community.toLowerCase();
            option.textContent = community;
            communityFilter.appendChild(option);
        });
    }

    // Load initial posts from the DOM
    function loadPosts() {
        return Array.from(postsContainer.querySelectorAll('.post')).map(postElement => ({
            element: postElement,
            title: postElement.querySelector('.post-title').textContent.toLowerCase(),
            description: postElement.querySelector('.post-snippet').textContent.toLowerCase(),
        }));
    }

    function searchPosts() {
        const query = searchInput ? searchInput.value.toLowerCase() : '';

        const posts = loadPosts();
        let anyPostVisible = false;

        posts.forEach(post => {
            const matchesQuery = post.title.includes(query) || post.description.includes(query);

            if (matchesQuery) {
                post.element.style.display = 'block';
                anyPostVisible = true;
            } else {
                post.element.style.display = 'none';
            }
        });

        noPostsMessage.style.display = anyPostVisible ? 'none' : 'block';
    }

    if (searchInput) searchInput.addEventListener('input', searchPosts);
});
