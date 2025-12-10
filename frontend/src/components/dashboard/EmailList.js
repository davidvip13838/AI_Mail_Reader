import React from 'react';

const EmailList = ({ emails }) => {
    if (!emails || emails.length === 0) return null;

    return (
        <div className="emails-list">
            <h3>📬 Found {emails.length} unread email{emails.length !== 1 ? 's' : ''}</h3>
            {emails.map((email) => (
                <div key={email.id} className="email-item">
                    <div className="email-header">
                        <strong>{email.subject || '(No Subject)'}</strong>
                        <span className="email-from">{email.from}</span>
                    </div>
                    <p className="email-snippet">{email.snippet}</p>
                    <small className="email-date">{new Date(email.date).toLocaleString()}</small>
                </div>
            ))}
        </div>
    );
};

export default EmailList;
