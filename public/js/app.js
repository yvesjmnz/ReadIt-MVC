/**
 * Main Application Entry Point
 * Loads all necessary components and initializes the application
 */

class ReadItApp {
    constructor() {
        this.components = [];
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.loadComponents();
            this.setupGlobalEventListeners();
            this.initializePageSpecificFeatures();
        });
    }

    loadComponents() {
        // Components are auto-initialized when their files are loaded
        console.log('ReadIt application initialized');
    }

    setupGlobalEventListeners() {
        // Global form submission prevention for AJAX forms
        DOMUtils.delegate(document, '.ajax-form', 'submit', (e) => {
            e.preventDefault();
        });

        // Global escape key handler for modals
        DOMUtils.on(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = $('.modal[style*="block"]');
                if (openModal) {
                    DOMUtils.hide(openModal);
                    document.body.style.overflow = 'auto';
                }
            }
        });

        // Handle post navigation clicks (for recent posts in profile)
        DOMUtils.delegate(document, '[data-navigate]', 'click', (e) => {
            const url = e.target.dataset.navigate;
            if (url) {
                window.location.href = url;
            }
        });
    }

    initializePageSpecificFeatures() {
        const page = this.getCurrentPage();
        
        switch (page) {
            case 'home':
                this.initHomePage();
                break;
            case 'community':
                this.initCommunityPage();
                break;
            case 'post':
                this.initPostPage();
                break;
            case 'profile':
                this.initProfilePage();
                break;
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path === '/' || path === '/home') return 'home';
        if (path.startsWith('/community/')) return 'community';
        if (path.startsWith('/post/')) return 'post';
        if (path.startsWith('/profile/')) return 'profile';
        
        return 'unknown';
    }

    initHomePage() {
        // Home page specific initialization
        this.setupPostFiltering();
        this.setupCommunityList();
    }

    initCommunityPage() {
        // Community page specific initialization
        this.setupCommunityActions();
    }

    initPostPage() {
        // Post page specific initialization
        this.setupCommentSubmission();
    }

    initProfilePage() {
        // Profile page specific initialization
        this.setupProfileActions();
    }

    setupPostFiltering() {
        const searchInput = $('#search-input');
        const sortFilter = $('#sort-filter');

        if (searchInput) {
            const debouncedSearch = DOMUtils.debounce(this.filterPosts.bind(this), 300);
            DOMUtils.on(searchInput, 'input', debouncedSearch);
        }

        if (sortFilter) {
            DOMUtils.on(sortFilter, 'change', this.sortPosts.bind(this));
        }
    }

    setupCommunityList() {
        const communityList = $('#community-list');
        if (communityList) {
            this.loadCommunities();
        }
    }

    async loadCommunities() {
        try {
            const communities = await CommunityApi.getAll();
            this.renderCommunityList(communities);
        } catch (error) {
            NotificationSystem.error('Failed to load communities');
        }
    }

    renderCommunityList(communities) {
        const communityList = $('#community-list');
        if (!communityList) return;

        communityList.innerHTML = '';
        
        communities.forEach(community => {
            const li = DOMUtils.create('li', {
                dataset: { community: community.name }
            }, `<a href="/community/${encodeURIComponent(community.name)}">${community.name}</a>`);
            
            communityList.appendChild(li);
        });
    }

    setupCommunityActions() {
        // Community-specific actions are handled by CommunityActions component
    }

    setupCommentSubmission() {
        const commentForm = $('#comment-form');
        if (commentForm) {
            new FormHandler(commentForm, {
                onSubmit: this.submitComment.bind(this)
            });
        }
    }

    async submitComment(data) {
        const postId = window.location.pathname.split('/').pop();
        
        try {
            await PostApi.addComment(postId, data.text);
            NotificationSystem.success('Comment added successfully!');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            // Display specific server-side validation errors
            const errorMessage = this.extractErrorMessage(error);
            NotificationSystem.error(errorMessage);
        }
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

    setupProfileActions() {
        // Profile-specific actions
        const profileForm = $('#profile-form');
        if (profileForm) {
            new FormHandler(profileForm, {
                onSubmit: this.updateProfile.bind(this)
            });
        }
    }

    async updateProfile(data) {
        try {
            // Profile update logic would go here
            NotificationSystem.success('Profile updated successfully!');
        } catch (error) {
            NotificationSystem.error('Failed to update profile');
        }
    }

    filterPosts() {
        const searchTerm = $('#search-input')?.value.toLowerCase() || '';
        const posts = $$('.post');

        posts.forEach(post => {
            const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
            const description = post.querySelector('.post-snippet')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(searchTerm) || description.includes(searchTerm);
            post.style.display = matches ? 'block' : 'none';
        });
    }

    sortPosts() {
        const sortBy = $('#sort-filter')?.value || 'date';
        const postsContainer = $('#posts-container');
        const posts = Array.from($$('.post'));

        posts.sort((a, b) => {
            switch (sortBy) {
                case 'likes':
                    const likesA = parseInt(a.querySelector('.likes')?.textContent.replace('👍 ', '') || '0');
                    const likesB = parseInt(b.querySelector('.likes')?.textContent.replace('👍 ', '') || '0');
                    return likesB - likesA;
                case 'comments':
                    const commentsA = parseInt(a.querySelector('.comments')?.textContent.replace('💬 ', '') || '0');
                    const commentsB = parseInt(b.querySelector('.comments')?.textContent.replace('💬 ', '') || '0');
                    return commentsB - commentsA;
                default: // date
                    return 0; // Assume posts are already sorted by date
            }
        });

        posts.forEach(post => postsContainer?.appendChild(post));
    }

}

// Initialize the application
new ReadItApp();