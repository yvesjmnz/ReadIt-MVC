// Simple signup form handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const quote = document.getElementById('quote').value;
            
            // Validate password and confirm password
            if (password !== confirmPassword) {
                NotificationSystem.error('Passwords do not match!');
                return false;
            }
            
            if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[@$!%*?#&_.]/.test(password)) {
                NotificationSystem.error('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
                return false;
            }
            
            // If validation passes, submit the form
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, confirmPassword, quote })
                });
                
                const message = await response.text();
                
                if (response.ok) {
                    NotificationSystem.success('Registration successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                } else {
                    NotificationSystem.error(message);
                }
            } catch (error) {
                console.error('Registration error:', error);
                NotificationSystem.error('An error occurred during registration. Please try again.');
            }
        });
    }
});