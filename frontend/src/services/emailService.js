import api from './api';

export const fetchUnreadEmails = async (maxResults = 10, dateFilter = 'all') => {
    const response = await api.post('/gmail/unread-emails', {
        maxResults,
        dateFilter
    });
    return response.data;
};

export const generateSummary = async (emails) => {
    const response = await api.post('/summarize/summarize', {
        emails
    });
    return response.data;
};

export const polishEmail = async (draft, tone) => {
    const response = await api.post('/email/polish', {
        draft,
        tone
    });
    return response.data;
};

export const sendEmail = async (to, subject, body) => {
    const response = await api.post('/email/send', {
        to,
        subject,
        body
    });
    return response.data;
};
