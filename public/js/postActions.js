document.addEventListener('DOMContentLoaded', () => {
    const loggedInUsername = document.body.getAttribute('data-username');
    
    // Show edit and delete buttons for posts authored by the logged-in user
    const postUserElement = document.querySelector('.post-community a[href^="/profile/"]');
    if (postUserElement) {
        const postUser = postUserElement.textContent.trim();
        if (postUser === loggedInUsername) {
            const buttons = document.querySelectorAll('.edit-post-button, .delete-post-button');
            buttons.forEach(button => button.style.display = 'inline');
        }
    }
});

function editPost(postId, currentTitle, currentDescription) {
    const newTitle = prompt('Edit your post title:', currentTitle);
    const newDescription = prompt('Edit your post description:', currentDescription);

    if (newTitle !== null && newDescription !== null && newTitle.trim() !== '' && newDescription.trim() !== '') {
        fetch(`/api/post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newTitle.trim(), post_description: newDescription.trim() })
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.reload();
            } else {
                alert('Failed to edit post: ' + (data.message || 'Unknown error.'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to edit post: ' + error.message);
        });
    }
}

function deletePost(postId) {
    if (confirm('Are you sure you want to delete this post?')) {
        fetch(`/api/post/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.href = '/';
            } else {
                alert('Failed to delete post: ' + (data.message || 'Unknown error.'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete post: ' + error.message);
        });
    }
}
