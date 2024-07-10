document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');
    const communityList = document.getElementById('community-list');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownContent = document.getElementById('dropdown-content');
    const createCommunityButton = document.getElementById('create-community-button');

    // Function to fetch and load communities
    async function loadCommunities() {
        try {
            const response = await fetch('/api/communities');
            if (!response.ok) {
                throw new Error('Failed to load communities');
            }
            const communities = await response.json();

            // Clear existing list
            communityList.innerHTML = '';

            // Rebuild community list
            communities.forEach(community => {
                const li = document.createElement('li');
                li.dataset.community = community.name;
                li.innerHTML = `<a href="/community/${community.name.toLowerCase()}">${community.name}</a>`;
                communityList.appendChild(li);
            });

            // Add event listeners to new community links
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
        }
    }

    // Function to handle community creation
    async function createCommunity(name, description) {
        try {
            const response = await fetch('/api/community', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description })
            });

            if (response.ok) {
                await loadCommunities(); // Reload communities after successful creation
                console.log('New community created successfully');
            } else {
                console.error('Failed to create community:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating community:', error);
        }
    }

    // Event listener for the create community button
    createCommunityButton.addEventListener('click', async () => {
        const name = prompt('Enter community name:');
        const description = prompt('Enter community description:');
        
        if (name && description) {
            await createCommunity(name, description);
        }
    });

    // Initial load of communities
    loadCommunities();
});
