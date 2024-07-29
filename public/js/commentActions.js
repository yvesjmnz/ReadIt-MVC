document.addEventListener('DOMContentLoaded', () => {
    const loggedInUsername = document.body.getAttribute('data-username');
    
    // Show edit and delete buttons for comments authored by the logged-in user
    document.querySelectorAll('.comment-user').forEach(comment => {
        const commentUser = comment.querySelector('a').textContent.trim();
        if (commentUser === loggedInUsername) {
            const buttons = comment.parentElement.querySelectorAll('.edit-button, .delete-button');
            buttons.forEach(button => button.style.display = 'inline');
        }
    });
});

function editComment(postId, commentId, currentText) {
    const newText = prompt('Edit your comment:', currentText);
    if (newText !== null && newText.trim() !== '') {
        fetch(`/api/post/${postId}/comment/${commentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newText: newText.trim() })
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                // Update the comment text in the DOM
                const commentElement = document.querySelector(`li[data-comment-id="${commentId}"] .comment-user`);
                window.location.reload();
                if (commentElement) {
                    commentElement.innerHTML = `
                        <strong><a href="/profile/${loggedInUsername}" style="color:inherit">${loggedInUsername}</a>:</strong> ${newText} <em>(edited)</em>
                    `;
                    console.log('Comment updated successfully in the DOM.');
                } else {
                    console.error('Comment element not found.');
                }
            } else {
                alert('Failed to edit comment: ' + (data.message || 'Unknown error.'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to edit comment: ' + error.message);
        });
    }
}

function deleteComment(postId, commentId) {
    if (confirm('Are you sure you want to delete this comment?')) {
        fetch(`/api/post/${postId}/comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                // Remove the comment from the DOM
                const commentElement = document.querySelector(`li[data-comment-id="${commentId}"]`);
                window.location.reload();
                if (commentElement) {
                    commentElement.remove();
                    console.log('Comment deleted successfully from the DOM.');
                } else {
                    console.error('Comment element not found for deletion.');
                }
            } else {
                alert('Failed to delete comment: ' + (data.message || 'Unknown error.'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete comment: ' + error.message);
        });
    }
}