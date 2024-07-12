function followUser() {
    const followButton = document.getElementById('follow-button');
    followButton.textContent = 'Followed';
    followButton.disabled = true;
    followButton.style.backgroundColor = '#6c757d';
    followButton.style.cursor = 'not-allowed';
}