import React, { useState } from 'react';
import { polishEmail, sendEmail } from '../../services/emailService';

const ComposeEmail = ({ toggleCompose }) => {
    const [draft, setDraft] = useState('');
    const [polished, setPolished] = useState('');
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [tone, setTone] = useState('professional');

    const handlePolish = async () => {
        if (!draft) return setError('Please write a draft first');
        try {
            setLoading(true);
            setError('');
            const data = await polishEmail(draft, tone);
            setPolished(data.polished);
        } catch (err) {
            setError('Failed to polish email');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!to || !subject || !polished) return setError('Please fill in all fields');
        try {
            setLoading(true);
            setError('');
            await sendEmail(to, subject, polished);
            setSuccess('Email sent successfully!');
            setTimeout(() => {
                setSuccess('');
                toggleCompose();
            }, 2000);
        } catch (err) {
            setError('Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="compose-overlay">
            <div className="compose-modal card">
                <div className="card-header">
                    <h2>✨ AI Email Composer</h2>
                    <button className="btn btn-secondary" onClick={toggleCompose}>Close</button>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="info-message">{success}</div>}

                <div className="compose-grid">
                    <div className="input-section">
                        <h3>Rough Draft</h3>
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder="Jot down your messy thoughts here... e.g., 'hey boss sick today wont make it in'"
                            className="compose-textarea"
                        />
                        <div className="controls">
                            <select value={tone} onChange={(e) => setTone(e.target.value)} className="select-input">
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="enthusiastic">Enthusiastic</option>
                                <option value="apologetic">Apologetic</option>
                            </select>
                            <button className="btn btn-primary" onClick={handlePolish} disabled={loading || !draft}>
                                {loading ? 'Polishing...' : '✨ Polish with AI'}
                            </button>
                        </div>
                    </div>

                    <div className="output-section">
                        <h3>Polished Email</h3>

                        <div className="email-meta">
                            <input
                                type="email"
                                placeholder="To: recipient@example.com"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <textarea
                            value={polished}
                            onChange={(e) => setPolished(e.target.value)}
                            placeholder="Your polished email will appear here..."
                            className="compose-textarea polished"
                        />

                        <button className="btn btn-primary send-btn" onClick={handleSend} disabled={loading || !polished}>
                            {loading ? 'Sending...' : '📤 Send Email'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComposeEmail;
