document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');
    const communityList = document.getElementById('community-list');
    const profileDropdown = document.getElementById('profile-dropdown');
    const dropdownContent = document.getElementById('dropdown-content');

    const posts = [
        { id: 1, title: "Free Tickets pls, haven't been to a concert in years", snippet: "I have been a fan for years and I really need a break. Anyone has free tickets?", likes: 3, dislikes: 22, comments: 15, community: "All Time Low", poster: "DesperateOtaku", userLiked: false, userDisliked: false, Date: "2024-5-27" },
        { id: 13, title: "Trying to reprogram my smart fridge from python to C, tips?", snippet: "My fridge is currently running on python but I want to convert it to C for better performance.", likes: 54, dislikes: 7, comments: 84, community: "C Programming Tutors", poster: "meowzzician1224", userLiked: false, userDisliked: false, Date: "2024-5-28" },
        { id: 7, title: "can I survive taking CCPROG3 and CCINFOM in the same term???", snippet: "hi im scared, im taking prog3 and infom under sir oli, any tips to at least pass both?", likes: 10, dislikes: 1, comments: 5, community: "DLSU", poster: "meowzzician1224", userLiked: false, userDisliked: false, Date: "2024-5-29" },
        { id: 10, title: "is it true that 5G causes cancer?", snippet: "Hi! I recently read that being exposed to the new 5G long term causes sickness.", likes: 0, dislikes: 2395, comments: 304, community: "AmIWrong?", poster: "hungrydegen293", userLiked: false, userDisliked: false, Date: "2024-5-30" },
        { id: 4, title: "Mouse grip tape recos", snippet: "i recently got a new attack shark x3 mouse from amazon, the included grip tape is great but do you have any recommendations for better ones?", likes: 15, dislikes: 2, comments: 10, community: "pyuterperipherals", poster: "WehSingSing1", userLiked: false, userDisliked: false, Date: "2024-5-31" },
    ];

    let currentCommunity = 'all';

    function updatePostStats(postElement, post) {
        postElement.querySelector('.likes-count').textContent = post.likes;
        postElement.querySelector('.dislikes-count').textContent = post.dislikes;
    }

    function handleLikeButtonClick(postElement, post) {
        if (post.userLiked) {
            post.likes--;
            post.userLiked = false;
        } else {
            post.likes++;
            post.userLiked = true;
            if (post.userDisliked) {
                post.dislikes--;
                post.userDisliked = false;
            }
        }
        updatePostStats(postElement, post);
    }

    function handleDislikeButtonClick(postElement, post) {
        if (post.userDisliked) {
            post.dislikes--;
            post.userDisliked = false;
        } else {
            post.dislikes++;
            post.userDisliked = true;
            if (post.userLiked) {
                post.likes--;
                post.userLiked = false;
            }
        }
        updatePostStats(postElement, post);
    }

    function loadPosts() {
        postsContainer.innerHTML = '';
        const searchQuery = searchInput.value.toLowerCase();
        const selectedSort = sortFilter.value;

        let filteredPosts = posts.filter(post => 
            (currentCommunity === 'all' || post.community.toLowerCase() === currentCommunity) &&
            (post.title.toLowerCase().includes(searchQuery) || 
            post.snippet.toLowerCase().includes(searchQuery) ||
            post.community.toLowerCase().includes(searchQuery))
        );

        if (selectedSort === 'recent') {
            filteredPosts.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        } else if (selectedSort === 'most-popular') {
            filteredPosts.sort((a, b) => b.likes - a.likes);
        } else if (selectedSort === 'least-popular') {
            filteredPosts.sort((a, b) => a.likes - b.likes);
        } else if (selectedSort === 'my-posts') {
            filteredPosts = posts.filter(post => post.poster.toLowerCase() === 'meowzzician1224');
        }

        filteredPosts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.dataset.id = post.id; // Assign data-id attribute
            postElement.innerHTML = `
                <p>${post.Date}</p>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-snippet">${post.snippet}</p>
                <p class="post-community">Posted in ${post.community} by <a href="${post.poster}.html" style="color:inherit">${post.poster}</a></p>
                <div class="post-stats">
                    <button class="like-button" aria-label="Like post"><span class="likes-count">${post.likes}</span> 👍</button>
                    <button class="dislike-button" aria-label="Dislike post"><span class="dislikes-count">${post.dislikes}</span> 👎</button>
                    <span class="comments-count">${post.comments} Comments</span>
                </div>
            `;

            postElement.querySelector('.like-button').addEventListener('click', (event) => {
                event.stopPropagation();
                handleLikeButtonClick(postElement, post);
            });
            postElement.querySelector('.dislike-button').addEventListener('click', (event) => {
                event.stopPropagation();
                handleDislikeButtonClick(postElement, post);
            });

            postElement.addEventListener('click', () => {
                window.location.href = `post${postElement.dataset.id}.html`; // Use data-id attribute
            });

            postsContainer.appendChild(postElement);
        });
    }

    function filterByCommunity(communityName) {
        currentCommunity = communityName.toLowerCase();
        loadPosts();
    }

    communityList.querySelectorAll('li').forEach(communityItem => {
        communityItem.addEventListener('click', () => {
            const communityName = communityItem.dataset.community;
            filterByCommunity(communityName);
            communityList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
            communityItem.classList.add('active');
        });
    });

    searchInput.addEventListener('input', loadPosts);
    sortFilter.addEventListener('change', loadPosts);

    profileDropdown.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
    });

    window.addEventListener('click', (event) => {
        if (!event.target.closest('#profile-dropdown')) {
            dropdownContent.classList.remove('show');
        }
    });

    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async (event) => {
            event.preventDefault(); // Prevent default behavior of <a> tag

            try {
                const response = await fetch('/logout', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    window.location.href = '/login'; // Redirect to login page
                } else {
                    console.error('Logout failed:', response.statusText);
                }
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    }

    loadPosts();
});
