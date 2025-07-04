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
                    window.location.href = '/'; // success: go home
                } else {
                    alert(message); // show error like "Invalid credentials"
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
