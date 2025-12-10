import api from './api';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const getProfile = async () => {
    const response = await api.get('/auth/profile');
    return response.data;
};

export const getGmailAuthUrl = async () => {
    const response = await api.get('/gmail/auth-url');
    return response.data;
};

export const handleGmailCallback = async (code) => {
    const response = await api.post('/gmail/auth-callback', { code });
    return response.data;
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('auth_token');
    }
};
