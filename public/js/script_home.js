document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');
    const communityList = document.getElementById('community-list');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownContent = document.getElementById('dropdown-content');
    const createCommunityButton = document.getElementById('create-community-button');

    
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/g;

    
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
                li.innerHTML = `<a href="/api/community/${community.name.toLowerCase()}">${community.name}</a>`;
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

            if (response.ok) {
                await loadCommunities();
                console.log('New community created successfully');
            } else {
                const errorData = await response.json();
                console.error('Failed to create community:', errorData.error);
            }
        } catch (error) {
            console.error('Error creating community:', error);
        }
    }

    
    createCommunityButton.addEventListener('click', async () => {
        const name = prompt('Enter community name:');
        const description = prompt('Enter community description:');

        if (!name || !description) {
            alert("Community name and description cannot be empty.");
            return;
        }

        if (specialCharRegex.test(name)) {
            alert("Community name cannot contain special characters.");
            return;
        }

        if (name && description) {
            await createCommunity(name, description);
        }
    });

    // Initial load of communities
    loadCommunities();
});
