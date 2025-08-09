document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login-form');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            try {
                const res = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, rememberMe })
                });

                const message = await res.text();

                if (res.ok) {
                    NotificationSystem.success('Login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    NotificationSystem.error(message);
                }
            } catch (err) {
                console.error('Login error:', err);
                NotificationSystem.error('An error occurred. Please try again.');
            }
        });
    }
});
