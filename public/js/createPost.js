document.addEventListener('DOMContentLoaded', function() {
    const createPostButton = document.getElementById('create-post-button');

    createPostButton.addEventListener('click', function() {
        const postTitle = prompt("Enter post title:");
        const postDescription = prompt("Enter post description:");

        if (postTitle && postDescription) {
            fetch('/api/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: postTitle, post_description: postDescription })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Post created successfully!");
                    addPostToPage(postTitle, postDescription);
                } else {
                    alert(`Failed to create post: ${data.error}`);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("Error creating post.");
            });
        } else {
            alert("Post title and description cannot be empty.");
        }
    });

    function addPostToPage(title, description) {
        const postsContainer = document.getElementById('posts-container');
        const postElement = document.createElement('div');
        postElement.className = 'post';

        const postTitleElement = document.createElement('h2');
        postTitleElement.textContent = title;

        const postDescriptionElement = document.createElement('p');
        postDescriptionElement.textContent = description;

        postElement.appendChild(postTitleElement);
        postElement.appendChild(postDescriptionElement);

        postsContainer.appendChild(postElement);
    }
});
