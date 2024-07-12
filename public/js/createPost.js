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
                    window.location.reload();
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
});
