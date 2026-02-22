import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('sentinel_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});


API.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !url.includes('/auth/me') && !url.includes('/auth/login')) {
            localStorage.removeItem('sentinel_token');
            localStorage.removeItem('sentinel_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authAPI = {
    login: (data) => API.post('/auth/login', data),
    logout: () => API.post('/auth/logout'),
    me: () => API.get('/auth/me'),
    changePassword: (data) => API.post('/auth/change-password', data),
};

// Files
export const fileAPI = {
    upload: (formData, onProgress) =>
        API.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
        }),
    getFile: (id, download = false) => API.get(`/files/${id}${download ? '?download=true' : ''}`),
    getFileInfo: (id) => API.get(`/files/${id}/info`),
    deleteFile: (id) => API.delete(`/files/${id}`),
    getVersions: (id) => API.get(`/files/${id}/versions`),
    search: (params) => API.get('/files/search', { params }),
};

// Folders
export const folderAPI = {
    create: (data) => API.post('/folders', data),
    list: (params) => API.get('/folders', { params }),
    get: (id) => API.get(`/folders/${id}`),
    getFiles: (id, params) => API.get(`/folders/${id}/files`, { params }),
    delete: (id) => API.delete(`/folders/${id}`),
};

// Projects
export const projectAPI = {
    create: (data) => API.post('/projects', data),
    list: () => API.get('/projects'),
    get: (id) => API.get(`/projects/${id}`),
    update: (id, data) => API.put(`/projects/${id}`, data),
    delete: (id) => API.delete(`/projects/${id}`),
};

// Admin
export const adminAPI = {
    getUsers: (params) => API.get('/admin/users', { params }),
    createUser: (data) => API.post('/admin/users', data),
    updateUserStatus: (id, data) => API.put(`/admin/users/${id}/status`, data),
    getStats: () => API.get('/admin/stats'),
    getLogs: (params) => API.get('/admin/logs', { params }),
    getAllFiles: (params) => API.get('/admin/files', { params }),
    deleteFile: (id) => API.delete(`/admin/files/${id}`),
    getSecurity: () => API.get('/admin/security'),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
};

export default API;
