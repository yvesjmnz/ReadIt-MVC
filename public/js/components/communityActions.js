class CommunityActions {
    constructor() {
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Use delegate for dynamic elements
        DOMUtils.delegate(document, '#create-community-btn', 'click', this.handleCreateCommunity.bind(this));
        DOMUtils.delegate(document, '#join-community-btn', 'click', this.handleJoinCommunity.bind(this));
        DOMUtils.delegate(document, '#leave-community-btn', 'click', this.handleLeaveCommunity.bind(this));
        DOMUtils.delegate(document, '#create-post-btn', 'click', this.handleCreatePost.bind(this));
        DOMUtils.delegate(document, '#add-moderator-btn', 'click', this.handleAddModerator.bind(this));
        DOMUtils.delegate(document, '#view-moderators-btn', 'click', this.handleViewModerators.bind(this));
        DOMUtils.delegate(document, '.remove-moderator-btn', 'click', this.handleRemoveModerator.bind(this));
        DOMUtils.delegate(document, '#ban-user-btn', 'click', this.handleBanUser.bind(this));
        DOMUtils.delegate(document, '#view-banned-btn', 'click', this.handleViewBanned.bind(this));
        DOMUtils.delegate(document, '.unban-user-btn', 'click', this.handleUnbanUser.bind(this));
    }

    async handleCreateCommunity() {
        const modal = new Modal({
            title: 'Create New Community',
            content: this.createCommunityForm(),
            className: 'create-community-modal'
        });

        modal.open();
        this.setupCreateForm(modal);
    }

    async handleCreatePost() {
        const communityName = window.communityData?.name || '';
        
        const modal = new Modal({
            title: 'Create New Post',
            content: this.createPostForm(communityName),
            className: 'create-post-modal'
        });

        modal.open();
        this.setupCreatePostForm(modal, communityName);
    }

    async handleAddModerator() {
        try {
            const communityName = window.communityData?.name;
            if (!communityName) {
                NotificationSystem.error('Community name not found');
                return;
            }

            // Get community data to show available members
            const community = await CommunityApi.getByName(communityName);
            const availableMembers = this.getAvailableMembers(community);

            if (availableMembers.length === 0) {
                NotificationSystem.warning('No members available to promote to moderator');
                return;
            }

            const modal = new Modal({
                title: 'Add Moderator',
                content: this.createAddModeratorForm(availableMembers),
                className: 'add-moderator-modal'
            });

            modal.open();
            this.setupAddModeratorForm(modal);
        } catch (error) {
            NotificationSystem.error('Failed to load community members');
        }
    }

    async handleBanUser() {
        try {
            const communityName = window.communityData?.name;
            if (!communityName) {
                NotificationSystem.error('Community name not found');
                return;
            }

            // Get community data to show available members to ban
            const community = await CommunityApi.getByName(communityName);
            const bannableMembers = this.getBannableMembers(community);

            if (bannableMembers.length === 0) {
                NotificationSystem.warning('No members available to ban');
                return;
            }

            const modal = new Modal({
                title: 'Ban User',
                content: this.createBanUserForm(bannableMembers),
                className: 'ban-user-modal'
            });

            modal.open();
            this.setupBanUserForm(modal);
        } catch (error) {
            NotificationSystem.error('Failed to load community members');
        }
    }

    handleViewBanned() {
        const bannedSection = document.getElementById('banned-users-section');
        const viewButton = document.getElementById('view-banned-btn');
        
        if (bannedSection.style.display === 'none') {
            bannedSection.style.display = 'block';
            viewButton.textContent = 'Hide Banned Users';
        } else {
            bannedSection.style.display = 'none';
            viewButton.textContent = 'View Banned Users';
        }
    }

    async handleUnbanUser(e) {
        const username = e.target.dataset.username;
        const communityName = window.communityData?.name;

        const confirmed = await Modal.confirm(
            'Unban User',
            `Are you sure you want to unban ${username}?`
        );

        if (confirmed) {
            try {
                await CommunityApi.unbanUser(communityName, username);
                NotificationSystem.success('User unbanned successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                NotificationSystem.error('Failed to unban user');
            }
        }
    }

    async handleViewModerators() {
        try {
            const communityName = window.communityData?.name;
            if (!communityName) {
                NotificationSystem.error('Community name not found');
                return;
            }

            const community = await CommunityApi.getByName(communityName);
            const modal = new Modal({
                title: 'Community Moderators',
                content: this.createModeratorsView(community.moderators, community.creator),
                className: 'view-moderators-modal'
            });

            modal.open();
            this.setupModeratorsView(modal);
        } catch (error) {
            NotificationSystem.error('Failed to load moderators');
        }
    }

    async handleRemoveModerator(e) {
        const username = e.target.dataset.username;
        const communityName = window.communityData?.name;

        const confirmed = await Modal.confirm(
            'Remove Moderator',
            `Are you sure you want to remove ${username} as a moderator?`
        );

        if (confirmed) {
            try {
                await CommunityApi.removeModerator(communityName, username);
                NotificationSystem.success('Moderator removed successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                NotificationSystem.error('Failed to remove moderator');
            }
        }
    }

    async handleJoinCommunity(e) {
        const communityName = e.target.dataset.community;
        
        try {
            await CommunityApi.join(communityName);
            NotificationSystem.success('Successfully joined community!');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            NotificationSystem.error('Failed to join community');
        }
    }

    async handleLeaveCommunity(e) {
        const communityName = e.target.dataset.community;
        
        const confirmed = await Modal.confirm(
            'Leave Community',
            'Are you sure you want to leave this community?'
        );

        if (confirmed) {
            try {
                await CommunityApi.leave(communityName);
                NotificationSystem.success('Successfully left community!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                NotificationSystem.error('Failed to leave community');
            }
        }
    }

    getAvailableMembers(community) {
        // Filter out creator and existing moderators
        return community.members.filter(member => 
            member !== community.creator && 
            !community.moderators.includes(member)
        );
    }

    getBannableMembers(community) {
        // Filter out creator (can't ban creator)
        return community.members.filter(member => 
            member !== community.creator
        );
    }

    createCommunityForm() {
        return `
            <form id="create-community-form">
                <div class="form-group">
                    <label for="community-name">Community Name:</label>
                    <input type="text" id="community-name" name="name" 
                           data-max-length="50" data-counter="name-count">
                    <div class="char-counter" id="name-count">0/50</div>
                </div>
                <div class="form-group">
                    <label for="community-description">Description:</label>
                    <textarea id="community-description" name="description" 
                              rows="4" data-max-length="500" data-counter="description-count"></textarea>
                    <div class="char-counter" id="description-count">0/500</div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Community</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    createPostForm(communityName) {
        return `
            <form id="create-post-form">
                <input type="hidden" name="communityName" value="${communityName}">
                <div class="form-group">
                    <label for="post-title">Title:</label>
                    <input type="text" id="post-title" name="title" 
                           data-max-length="200" data-counter="title-count">
                    <div class="char-counter" id="title-count">0/200</div>
                </div>
                <div class="form-group">
                    <label for="post-description">Description:</label>
                    <textarea id="post-description" name="post_description" 
                              rows="6" data-max-length="5000" data-counter="description-count"></textarea>
                    <div class="char-counter" id="description-count">0/5000</div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Create Post</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    createAddModeratorForm(availableMembers) {
        const memberOptions = availableMembers.map(member => 
            `<option value="${member}">${member}</option>`
        ).join('');

        return `
            <form id="add-moderator-form">
                <div class="form-group">
                    <label for="moderator-select">Select Member to Promote:</label>
                    <select id="moderator-select" name="username">
                        <option value="">Choose a member...</option>
                        ${memberOptions}
                    </select>
                    <small>Only community members who aren't already moderators are shown</small>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Add Moderator</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    createBanUserForm(bannableMembers) {
        const memberOptions = bannableMembers.map(member => 
            `<option value="${member}">${member}</option>`
        ).join('');

        return `
            <form id="ban-user-form">
                <div class="form-group">
                    <label for="ban-user-select">Select Member to Ban:</label>
                    <select id="ban-user-select" name="username">
                        <option value="">Choose a member...</option>
                        ${memberOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="ban-reason">Ban Reason:</label>
                    <textarea id="ban-reason" name="reason" 
                              rows="3" data-max-length="500" data-counter="reason-count"
                              placeholder="Explain why this user is being banned..."></textarea>
                    <div class="char-counter" id="reason-count">0/500</div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-warning">Ban User</button>
                    <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
    }

    createModeratorsView(moderators, creator) {
        if (!moderators || moderators.length === 0) {
            return '<p>No moderators assigned to this community.</p>';
        }

        const moderatorsList = moderators.map(mod => `
            <div class="moderator-item">
                <span class="moderator-name">${mod}</span>
                <button class="btn btn-danger btn-sm remove-moderator-btn" data-username="${mod}">
                    Remove
                </button>
            </div>
        `).join('');

        return `
            <div class="moderators-list">
                <div class="creator-info">
                    <strong>Creator:</strong> ${creator} 👑
                </div>
                <hr>
                <h4>Moderators:</h4>
                ${moderatorsList}
            </div>
        `;
    }

    createBannedUsersView(bannedUsers) {
        if (!bannedUsers || Object.keys(bannedUsers).length === 0) {
            return '<p>No banned users in this community.</p>';
        }

        const bannedList = Object.entries(bannedUsers).map(([username, banInfo]) => `
            <div class="banned-user-item">
                <div class="banned-user-info">
                    <strong>${username}</strong>
                    <div class="ban-details">
                        <p><strong>Reason:</strong> ${banInfo.reason}</p>
                        <p><strong>Banned by:</strong> ${banInfo.bannedBy}</p>
                        <p><strong>Date:</strong> ${new Date(banInfo.bannedAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <button class="btn btn-success btn-sm unban-user-btn" data-username="${username}">
                    Unban
                </button>
            </div>
        `).join('');

        return `
            <div class="banned-users-list">
                <h4>Banned Users:</h4>
                ${bannedList}
            </div>
        `;
    }

    setupCreateForm(modal) {
        const form = modal.element.querySelector('#create-community-form');
        
        const formHandler = new FormHandler(form, {
            onSubmit: async (data) => {
                try {
                    await CommunityApi.create(data);
                    NotificationSystem.success('Community created successfully!');
                    modal.close();
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    // Display specific server-side validation errors
                    const errorMessage = this.extractErrorMessage(error);
                    NotificationSystem.error(errorMessage);
                }
            }
        });
    }

    setupCreatePostForm(modal, communityName) {
        const form = modal.element.querySelector('#create-post-form');
        
        const formHandler = new FormHandler(form, {
            onSubmit: async (data) => {
                try {
                    await PostApi.create(data);
                    NotificationSystem.success('Post created successfully!');
                    modal.close();
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    // Display specific server-side validation errors
                    const errorMessage = this.extractErrorMessage(error);
                    NotificationSystem.error(errorMessage);
                }
            }
        });
    }

    setupAddModeratorForm(modal) {
        const form = modal.element.querySelector('#add-moderator-form');
        
        const formHandler = new FormHandler(form, {
            onSubmit: async (data) => {
                try {
                    const communityName = window.communityData?.name;
                    await CommunityApi.addModerator(communityName, data.username);
                    NotificationSystem.success('Moderator added successfully!');
                    modal.close();
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    NotificationSystem.error('Failed to add moderator');
                }
            }
        });
    }

    setupBanUserForm(modal) {
        const form = modal.element.querySelector('#ban-user-form');
        
        const formHandler = new FormHandler(form, {
            onSubmit: async (data) => {
                try {
                    const communityName = window.communityData?.name;
                    await CommunityApi.banUser(communityName, data.username, data.reason);
                    NotificationSystem.success('User banned successfully!');
                    modal.close();
                    setTimeout(() => window.location.reload(), 1000);
                } catch (error) {
                    NotificationSystem.error('Failed to ban user');
                }
            }
        });
    }

    setupModeratorsView(modal) {
        // Event delegation for remove buttons is already handled in setupEventListeners
    }

    setupBannedUsersView(modal) {
        // Event delegation for unban buttons is already handled in setupEventListeners
    }

    extractErrorMessage(error) {
        // Extract specific error message from server response
        if (error.response && error.response.data && error.response.data.error) {
            return error.response.data.error;
        }
        if (error.message) {
            return error.message;
        }
        return 'An error occurred. Please try again.';
    }
}

// Initialize
new CommunityActions();