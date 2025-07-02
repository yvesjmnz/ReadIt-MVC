document.addEventListener('DOMContentLoaded', function() {
    const addModeratorBtn = document.getElementById('add-moderator-btn');
    const viewModeratorsBtn = document.getElementById('view-moderators-btn');
    const addModeratorModal = document.getElementById('add-moderator-modal');
    const viewModeratorsModal = document.getElementById('view-moderators-modal');
    const createPostBtn = document.getElementById('create-post-button');
    const createPostModal = document.getElementById('create-post-modal');
    const createPostForm = document.getElementById('create-post-form');
    const joinCommunityBtn = document.getElementById('join-community-btn');
    const leaveCommunityBtn = document.getElementById('leave-community-btn');
    const confirmationModal = document.getElementById('confirmation-modal');

    // Notification system
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
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

    // Confirmation dialog
    function showConfirmation(title, message) {
        return new Promise((resolve) => {
            document.getElementById('confirmation-title').textContent = title;
            document.getElementById('confirmation-message').textContent = message;
            
            const confirmYes = document.getElementById('confirm-yes');
            const confirmNo = document.getElementById('confirm-no');
            
            function cleanup() {
                confirmYes.replaceWith(confirmYes.cloneNode(true));
                confirmNo.replaceWith(confirmNo.cloneNode(true));
                closeModal(confirmationModal);
            }
            
            document.getElementById('confirm-yes').addEventListener('click', () => {
                cleanup();
                resolve(true);
            });
            
            document.getElementById('confirm-no').addEventListener('click', () => {
                cleanup();
                resolve(false);
            });
            
            openModal(confirmationModal);
        });
    }

    // Modal functionality
    function openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // Close modals when clicking the X or outside
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    document.querySelectorAll('.cancel-btn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target);
        }
    });

    // Character counters
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

    // Setup character counters for post creation
    setupCharCounter(
        document.getElementById('post-title'),
        document.getElementById('title-char-count'),
        200
    );
    
    setupCharCounter(
        document.getElementById('post-description'),
        document.getElementById('description-char-count'),
        5000
    );

    // Create Post functionality
    if (createPostBtn) {
        createPostBtn.addEventListener('click', function() {
            openModal(createPostModal);
        });
    }

    if (createPostForm) {
        createPostForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submit-post-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating...';
            submitBtn.disabled = true;
            
            const formData = new FormData(this);
            const postData = {
                title: formData.get('title'),
                post_description: formData.get('post_description'),
                communityName: formData.get('communityName')
            };

            try {
                const response = await fetch('/api/post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Post created successfully!', 'success');
                    closeModal(createPostModal);
                    createPostForm.reset();
                    document.getElementById('title-char-count').textContent = '0/200';
                    document.getElementById('description-char-count').textContent = '0/5000';
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showNotification(data.error || 'Failed to create post', 'error');
                }
            } catch (error) {
                console.error('Error creating post:', error);
                showNotification('An error occurred while creating the post', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Add Moderator functionality
    if (addModeratorBtn) {
        addModeratorBtn.addEventListener('click', async function() {
            openModal(addModeratorModal);
            await loadAvailableMembers();
        });
    }

    async function loadAvailableMembers() {
        const loadingDiv = document.getElementById('moderator-selection-loading');
        const contentDiv = document.getElementById('moderator-selection-content');
        const membersContainer = document.getElementById('available-members');
        
        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';
        
        try {
            const response = await fetch(`/api/community/${window.communityData.name}/members`);
            const members = await response.json();

            if (response.ok) {
                membersContainer.innerHTML = '';
                
                if (members.length === 0) {
                    membersContainer.innerHTML = '<p class="no-members">No available members to promote. All members are already moderators.</p>';
                } else {
                    members.forEach(member => {
                        const memberDiv = document.createElement('div');
                        memberDiv.className = 'member-item';
                        memberDiv.innerHTML = `
                            <div class="member-info">
                                <img src="/img/${member.profilePic}" alt="Profile" class="member-avatar">
                                <span class="member-username">${member.username}</span>
                            </div>
                            <button class="promote-btn blue-button" data-username="${member.username}">
                                Promote to Moderator
                            </button>
                        `;
                        membersContainer.appendChild(memberDiv);
                    });

                    // Add event listeners for promote buttons
                    document.querySelectorAll('.promote-btn').forEach(btn => {
                        btn.addEventListener('click', async function() {
                            const username = this.dataset.username;
                            const confirmed = await showConfirmation(
                                'Promote Member',
                                `Are you sure you want to promote ${username} to moderator?`
                            );
                            
                            if (confirmed) {
                                await promoteMember(username);
                            }
                        });
                    });
                }
            } else {
                showNotification(members.error || 'Failed to load members', 'error');
            }
        } catch (error) {
            console.error('Error loading members:', error);
            showNotification('An error occurred while loading members', 'error');
        } finally {
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
        }
    }

    async function promoteMember(username) {
        try {
            const response = await fetch(`/api/community/${window.communityData.name}/moderator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification(`${username} has been promoted to moderator!`, 'success');
                closeModal(addModeratorModal);
                setTimeout(() => location.reload(), 1000);
            } else {
                showNotification(data.error || 'Failed to add moderator', 'error');
            }
        } catch (error) {
            console.error('Error adding moderator:', error);
            showNotification('An error occurred while adding moderator', 'error');
        }
    }

    // View Moderators functionality
    if (viewModeratorsBtn) {
        viewModeratorsBtn.addEventListener('click', async function() {
            openModal(viewModeratorsModal);
            await loadModerators();
        });
    }

    async function loadModerators() {
        const loadingDiv = document.getElementById('moderators-loading');
        const moderatorsList = document.getElementById('moderators-list');
        
        loadingDiv.style.display = 'block';
        moderatorsList.innerHTML = '';
        
        try {
            const response = await fetch(`/api/community/${window.communityData.name}/moderators`);
            const data = await response.json();

            if (response.ok) {
                displayModerators(data);
            } else {
                showNotification(data.error || 'Failed to fetch moderators', 'error');
            }
        } catch (error) {
            console.error('Error fetching moderators:', error);
            showNotification('An error occurred while fetching moderators', 'error');
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    function displayModerators(data) {
        const moderatorsList = document.getElementById('moderators-list');
        moderatorsList.innerHTML = '';

        if (data.moderatorDetails && data.moderatorDetails.length > 0) {
            data.moderatorDetails.forEach(moderator => {
                const moderatorDiv = document.createElement('div');
                moderatorDiv.className = 'moderator-item';
                
                moderatorDiv.innerHTML = `
                    <div class="moderator-info">
                        <img src="/img/${moderator.profilePic}" alt="Profile" class="moderator-avatar">
                        <div class="moderator-details">
                            <span class="moderator-username">${moderator.username}</span>
                            <span class="moderator-role ${moderator.role}">${moderator.role === 'creator' ? '👑 Creator' : '🛡️ Moderator'}</span>
                        </div>
                    </div>
                    ${moderator.role === 'moderator' && window.communityData.userRole === 'creator' ? 
                        `<button class="remove-moderator-btn red-button" data-username="${moderator.username}">Remove</button>` : 
                        ''
                    }
                `;
                
                moderatorsList.appendChild(moderatorDiv);
            });

            // Add event listeners for remove buttons
            document.querySelectorAll('.remove-moderator-btn').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const username = this.dataset.username;
                    const confirmed = await showConfirmation(
                        'Remove Moderator',
                        `Are you sure you want to remove ${username} as a moderator?`
                    );
                    
                    if (confirmed) {
                        await removeModerator(username);
                    }
                });
            });
        } else {
            moderatorsList.innerHTML = '<p>No moderators found.</p>';
        }
    }

    async function removeModerator(username) {
        try {
            const response = await fetch(`/api/community/${window.communityData.name}/moderator/${username}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification(`${username} has been removed as moderator`, 'success');
                await loadModerators(); // Refresh the list
            } else {
                showNotification(data.error || 'Failed to remove moderator', 'error');
            }
        } catch (error) {
            console.error('Error removing moderator:', error);
            showNotification('An error occurred while removing moderator', 'error');
        }
    }

    // Join Community functionality
    if (joinCommunityBtn) {
        joinCommunityBtn.addEventListener('click', async function() {
            const communityName = this.dataset.community;
            
            try {
                const response = await fetch(`/api/community/${communityName}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showNotification('Successfully joined the community!', 'success');
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showNotification(data.error || 'Failed to join community', 'error');
                }
            } catch (error) {
                console.error('Error joining community:', error);
                showNotification('An error occurred while joining community', 'error');
            }
        });
    }

    // Leave Community functionality
    if (leaveCommunityBtn) {
        leaveCommunityBtn.addEventListener('click', async function() {
            const communityName = this.dataset.community;
            
            const confirmed = await showConfirmation(
                'Leave Community',
                'Are you sure you want to leave this community?'
            );
            
            if (confirmed) {
                try {
                    const response = await fetch(`/api/community/${communityName}/leave`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        showNotification('Successfully left the community!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        showNotification(data.error || 'Failed to leave community', 'error');
                    }
                } catch (error) {
                    console.error('Error leaving community:', error);
                    showNotification('An error occurred while leaving community', 'error');
                }
            }
        });
    }

    // Post moderation actions
    document.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-post-btn')) {
            const postId = e.target.dataset.postId;
            
            const confirmed = await showConfirmation(
                'Delete Post',
                'Are you sure you want to delete this post? This action cannot be undone.'
            );
            
            if (confirmed) {
                try {
                    const response = await fetch(`/api/post/${postId}`, {
                        method: 'DELETE'
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        showNotification('Post deleted successfully!', 'success');
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        showNotification(data.error || 'Failed to delete post', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    showNotification('An error occurred while deleting post', 'error');
                }
            }
        }

        if (e.target.classList.contains('edit-post-btn')) {
            const postId = e.target.dataset.postId;
            // Redirect to edit post page or open edit modal
            window.location.href = `/post/${postId}/edit`;
        }
    });
});