document.addEventListener('DOMContentLoaded', () => {
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownContent = document.getElementById('dropdown-content');

    profileDropdown.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownContent.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        dropdownContent.classList.remove('show');
    });

    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default behavior of <a> tag

            try {
                const response = await fetch('/logout', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    window.location.href = '/login'; // Redirect to login page
                } else {
                    console.error('Logout failed:', response.statusText);
                }
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    }

    const createPostButton = document.getElementById('create-post-button');
    if (createPostButton) {
        createPostButton.addEventListener('click', () => {
            window.location.href = '/post'; // Change to the URL where the user can create a new post
        });
    }
});
