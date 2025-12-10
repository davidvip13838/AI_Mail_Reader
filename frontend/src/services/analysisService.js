import api from './api';

export const analyzeUser = async (emails) => {
    const response = await api.post('/analysis/analyze', {
        emails
    });
    return response.data;
};

export const getUserAnalysis = async () => {
    const response = await api.get('/analysis/profile');
    return response.data;
};

export const deleteUserAnalysis = async () => {
    const response = await api.delete('/analysis/profile');
    return response.data;
};
