document.addEventListener('DOMContentLoaded', function() {
    const createPostButton = document.getElementById('create-post-button');

    createPostButton.addEventListener('click', async function() {
        const postTitle = prompt("Enter post title:");
        const postDescription = prompt("Enter post description:");
        const communityName = document.querySelector('.community-header h2').textContent.trim();

        if (postTitle && postDescription) {
            try {
                const response = await fetch('/api/post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ communityName, title: postTitle, post_description: postDescription })
                });

                const data = await response.json();

                if (response.ok) {
                    alert("Post created successfully!");
                    window.location.reload();
                } else {
                    alert(`Failed to create post: ${data.error}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert("Error creating post.");
            }
        } else {
            alert("Post title and description cannot be empty.");
        }
    });


    async function loadPosts() {
        const communityName = document.querySelector('.community-header h2').textContent.trim();

        try {
            const response = await fetch(`/api/community/${encodeURIComponent(communityName)}`);
            if (!response.ok) {
                throw new Error('Failed to load posts');
            }
            const data = await response.json();

            if (data.posts.length > 0) {
                const postsContainer = document.querySelector('.posts-section');
                postsContainer.innerHTML = '';

                data.posts.forEach(post => {
                    const postElement = document.createElement('div');
                    postElement.className = 'post';

                    const postTitleElement = document.createElement('h3');
                    postTitleElement.textContent = post.title;

                    const postDescriptionElement = document.createElement('p');
                    postDescriptionElement.textContent = post.post_description;

                    postElement.appendChild(postTitleElement);
                    postElement.appendChild(postDescriptionElement);

                    postsContainer.appendChild(postElement);
                });
            } else {
                const postsContainer = document.querySelector('.posts-section');
                postsContainer.innerHTML = '<p>No posts available in this community.</p>';
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    loadPosts();
});
