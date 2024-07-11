document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/users');
        const users = await response.json();
        const userList = document.getElementById('user-list');
        users.forEach(user => {
            const userItem = document.createElement('li');
            userItem.textContent = user.username;
            userItem.classList.add('user-item');
            userItem.addEventListener('click', () => {
                window.location.href = `/profile/${user.username}`;
            });
            userList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
});