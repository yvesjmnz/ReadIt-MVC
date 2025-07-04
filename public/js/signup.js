// Simple signup form handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('signup-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            // Validate password and confirm password
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Passwords do not match!');
                return false;
            }
            if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*]/.test(password)) {
                e.preventDefault();
                alert('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
                return false;
        }
        });
    }
});