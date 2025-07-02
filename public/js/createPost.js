document.addEventListener('DOMContentLoaded', function() {
    // This file is now handled by moderatorActions.js for the community page
    // The create post functionality has been moved to a proper modal interface
    
    // If this is being used on other pages, we'll keep a basic fallback
    const createPostButton = document.getElementById('create-post-button');
    
    if (createPostButton && !document.getElementById('create-post-modal')) {
        // Fallback for pages that don't have the modal
        createPostButton.addEventListener('click', function() {
            // Redirect to a create post page or show a message
            window.location.href = '/create-post';
        });
    }

    // Load posts function for community pages
    async function loadPosts() {
        const communityHeader = document.querySelector('.community-header h2');
        if (!communityHeader) return;
        
        const communityName = communityHeader.textContent.trim();

        try {
            const response = await fetch(`/api/community/${encodeURIComponent(communityName)}`);
            if (!response.ok) {
                throw new Error('Failed to load community data');
            }
            const data = await response.json();

            // This would be handled by the server-side rendering now
            // Keeping this for potential dynamic updates
            
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    // Only load posts if we're on a community page
    if (document.querySelector('.community-header')) {
        loadPosts();
    }
});