document.addEventListener('DOMContentLoaded', () => {
    const postsContainer = document.getElementById('posts-container');
    const searchInput = document.getElementById('search-input');
    const sortFilter = document.getElementById('sort-filter');
    const createPostButton = document.getElementById('create-post-button');
    

   
    async function loadPosts() {
        try {
            const response = await fetch('/api/posts');
            if (!response.ok) {
                throw new Error('Failed to load posts');
            }
            const posts = await response.json();

            
            postsContainer.innerHTML = '';

          
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.classList.add('post');
                postElement.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <small>by ${post.author}</small>
                `;
                postsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    
    async function createPost(title, content, author) {
        try {
            const response = await fetch('/api/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, content, author })
            });

            if (response.ok) {
                await loadPosts(); 
                console.log('New post created successfully');
            } else {
                console.error('Failed to create post:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating post:', error);
        }
    }

    
    createPostButton.addEventListener('click', async () => {
        const title = prompt('Enter post title:');
        const content = prompt('Enter post content:');
        const author = prompt('Enter author name:');

        if (title && content && author) {
            await createPost(title, content, author);
        }
    });

    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        filterPosts(query);
    });

    
    sortFilter.addEventListener('change', () => {
        const sortOrder = sortFilter.value;
        sortPosts(sortOrder);
    });

    
    function filterPosts(query) {
        const posts = Array.from(postsContainer.getElementsByClassName('post'));
        posts.forEach(post => {
            const title = post.querySelector('h2').innerText.toLowerCase();
            if (title.includes(query)) {
                post.style.display = '';
            } else {
                post.style.display = 'none';
            }
        });
    }

    
    function sortPosts(order) {
        const posts = Array.from(postsContainer.getElementsByClassName('post'));
        posts.sort((a, b) => {
            const titleA = a.querySelector('h2').innerText;
            const titleB = b.querySelector('h2').innerText;
            if (order === 'asc') {
                return titleA.localeCompare(titleB);
            } else if (order === 'desc') {
                return titleB.localeCompare(titleA);
            }
        });
        postsContainer.innerHTML = '';
        posts.forEach(post => postsContainer.appendChild(post));
    }

    
    loadPosts();
});
