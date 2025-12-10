import axios from 'axios';

// Use environment variable or default to localhost for development
// In production (when served from same domain), use relative URL
const API_BASE_URL = process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Configure axios to include auth token in requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
