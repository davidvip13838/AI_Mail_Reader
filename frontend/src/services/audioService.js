import api from './api';

export const generateAudio = async (text, emailCount, dateFilter) => {
    const response = await api.post('/audio/generate', {
        text,
        emailCount,
        dateFilter
    });
    // Return full URL by prepending base URL if needed, or let component handle it
    // Since the original code did string replacement on API_BASE_URL, we'll try to return a relative path or handle it
    // But wait, frontend served from same domain in prod?
    // Let's return the data and let the component/hook construct the full URL or use the relative path
    return response.data;
};

export const fetchAudioHistory = async () => {
    const response = await api.get('/audio/history');
    return response.data;
};

export const deleteAudio = async (audioId) => {
    const response = await api.delete(`/audio/${audioId}`);
    return response.data;
};
