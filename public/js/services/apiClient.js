class ApiClient {
    static async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(url) {
        return this.request(url);
    }

    static async post(url, data) {
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async put(url, data) {
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    static async delete(url) {
        return this.request(url, {
            method: 'DELETE'
        });
    }
}

// Community API
class CommunityApi {
    static async getAll() {
        return ApiClient.get('/api/communities');
    }

    static async getByName(name) {
        return ApiClient.get(`/api/communities/${name}`);
    }

    static async create(data) {
        return ApiClient.post('/api/communities', data);
    }

    static async join(name) {
        return ApiClient.post(`/api/communities/${name}/join`);
    }

    static async leave(name) {
        return ApiClient.post(`/api/communities/${name}/leave`);
    }

    static async addModerator(name, username) {
        return ApiClient.post(`/api/communities/${name}/moderator`, { username });
    }

    static async removeModerator(name, username) {
        return ApiClient.delete(`/api/communities/${name}/moderator/${username}`);
    }
}

// Post API
class PostApi {
    static async getAll() {
        return ApiClient.get('/api/posts');
    }

    static async getById(id) {
        return ApiClient.get(`/api/posts/${id}`);
    }

    static async create(data) {
        return ApiClient.post('/api/posts', data);
    }

    static async update(id, data) {
        return ApiClient.put(`/api/posts/${id}`, data);
    }

    static async delete(id) {
        return ApiClient.delete(`/api/posts/${id}`);
    }

    static async like(id) {
        return ApiClient.post(`/api/posts/${id}/like`);
    }

    static async dislike(id) {
        return ApiClient.post(`/api/posts/${id}/dislike`);
    }

    static async addComment(id, text) {
        return ApiClient.post(`/api/posts/${id}/comment`, { text });
    }

    static async updateComment(postId, commentId, text) {
        return ApiClient.put(`/api/posts/${postId}/comment/${commentId}`, { text });
    }

    static async deleteComment(postId, commentId) {
        return ApiClient.delete(`/api/posts/${postId}/comment/${commentId}`);
    }

    static async moderate(id, action, reason) {
        return ApiClient.post(`/api/posts/${id}/moderate`, { action, reason });
    }
}

// User API
class UserApi {
    static async getAll() {
        return ApiClient.get('/api/users');
    }
}

window.CommunityApi = CommunityApi;
window.PostApi = PostApi;
window.UserApi = UserApi;