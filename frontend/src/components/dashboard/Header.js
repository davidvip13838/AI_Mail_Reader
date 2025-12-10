import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="header">
            <h1>
                <span className="logo-icon">📧</span>
                Amail
            </h1>
            {user && (
                <p className="subtitle">Welcome back, {user.name || user.email}!</p>
            )}
            {!user && (
                <p className="subtitle">Transform your inbox with AI-powered summaries and audio playback</p>
            )}
        </header>
    );
};

export default Header;
