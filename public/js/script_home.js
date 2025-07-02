document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');
    const communityList = document.getElementById('community-list');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownContent = document.getElementById('dropdown-content');
    const createCommunityButton = document.getElementById('create-community-button');

    // Notification system
    function showNotification(message, type = 'info') {
        // Create notification container if it doesn't exist
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Create Community Modal
    function createCommunityModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'create-community-modal';
        modal.style.cssText = `
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background-color: #2c2c2c;
                margin: 10% auto;
                padding: 20px;
                border-radius: 10px;
                width: 80%;
                max-width: 500px;
                position: relative;
                color: white;
            ">
                <span class="close" style="
                    color: #aaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    position: absolute;
                    right: 15px;
                    top: 10px;
                ">&times;</span>
                <h2>Create New Community</h2>
                <form id="create-community-form">
                    <div class="form-group" style="margin: 15px 0;">
                        <label for="community-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Community Name:</label>
                        <input type="text" id="community-name" name="name" required maxlength="50" minlength="3" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #555;
                            border-radius: 5px;
                            background-color: #3a3a3a;
                            color: #fff;
                            font-size: 16px;
                            box-sizing: border-box;
                        ">
                        <div class="char-counter" style="text-align: right; margin-top: 5px;">
                            <span id="name-char-count" style="font-size: 0.8em; color: #6c757d;">0/50</span>
                        </div>
                        <small style="color: #ccc;">No special characters allowed</small>
                    </div>
                    <div class="form-group" style="margin: 15px 0;">
                        <label for="community-description" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
                        <textarea id="community-description" name="description" required maxlength="500" minlength="10" rows="4" style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #555;
                            border-radius: 5px;
                            background-color: #3a3a3a;
                            color: #fff;
                            font-size: 16px;
                            font-family: inherit;
                            box-sizing: border-box;
                            resize: vertical;
                        "></textarea>
                        <div class="char-counter" style="text-align: right; margin-top: 5px;">
                            <span id="description-char-count" style="font-size: 0.8em; color: #6c757d;">0/500</span>
                        </div>
                    </div>
                    <div class="form-actions" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button type="submit" class="blue-button" id="submit-community-btn" style="
                            background-color: #007BFF;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">Create Community</button>
                        <button type="button" class="cancel-btn" style="
                            background-color: #6c757d;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        ">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    // Character counter setup
    function setupCharCounter(inputElement, counterElement, maxLength) {
        if (!inputElement || !counterElement) return;
        
        inputElement.addEventListener('input', function() {
            const length = this.value.length;
            counterElement.textContent = `${length}/${maxLength}`;
            
            if (length > maxLength * 0.9) {
                counterElement.style.color = '#dc3545';
            } else if (length > maxLength * 0.8) {
                counterElement.style.color = '#ffc107';
            } else {
                counterElement.style.color = '#6c757d';
            }
        });
    }

    async function loadCommunities() {
        try {
            const response = await fetch('/api/communities');
            if (!response.ok) {
                throw new Error('Failed to load communities');
            }
            const communities = await response.json();

            communityList.innerHTML = '';

            communities.forEach(community => {
                const li = document.createElement('li');
                li.dataset.community = community.name;
                li.innerHTML = `<a href="/community/${encodeURIComponent(community.name)}">${community.name}</a>`;
                communityList.appendChild(li);
            });

            communityList.querySelectorAll('li').forEach(communityItem => {
                communityItem.addEventListener('click', () => {
                    const communityName = communityItem.dataset.community;
                    filterByCommunity(communityName);
                    communityList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
                    communityItem.classList.add('active');
                });
            });

        } catch (error) {
            console.error('Error loading communities:', error);
            showNotification('Failed to load communities', 'error');
        }
    }

    async function createCommunity(name, description) {
        try {
            const response = await fetch('/api/community', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description }) 
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await loadCommunities();
                showNotification('Community created successfully!', 'success');
                return true;
            } else {
                showNotification(data.error || 'Failed to create community', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error creating community:', error);
            showNotification('An error occurred while creating the community', 'error');
            return false;
        }
    }

    // Create Community Button Event
    createCommunityButton.addEventListener('click', async () => {
        const modal = createCommunityModal();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Setup character counters
        setupCharCounter(
            document.getElementById('community-name'),
            document.getElementById('name-char-count'),
            50
        );
        
        setupCharCounter(
            document.getElementById('community-description'),
            document.getElementById('description-char-count'),
            500
        );

        // Special characters validation
        const nameInput = document.getElementById('community-name');
        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/g;
        
        nameInput.addEventListener('input', function() {
            if (specialCharRegex.test(this.value)) {
                this.value = this.value.replace(specialCharRegex, '');
                showNotification('Special characters are not allowed in community names', 'warning');
            }
        });

        // Form submission
        const form = document.getElementById('create-community-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-community-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const name = formData.get('name').trim();
            const description = formData.get('description').trim();

            if (!name || !description) {
                showNotification('Community name and description cannot be empty', 'error');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }

            const success = await createCommunity(name, description);
            
            if (success) {
                modal.remove();
                document.body.style.overflow = 'auto';
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });

        // Close modal events
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        function closeModal() {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });

    // Filter by community function (if needed)
    function filterByCommunity(communityName) {
        // Implementation for filtering posts by community
        // This would depend on your existing filtering logic
        console.log('Filtering by community:', communityName);
    }

    // Initial load of communities
    loadCommunities();
});