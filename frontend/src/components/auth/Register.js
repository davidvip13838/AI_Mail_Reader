import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const { register } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await register(email, password, name);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Get Started</h2>
            <input
                type="text"
                placeholder="Full name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
            />
            <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
            >
                {submitting ? (
                    <>
                        <span className="loading-spinner"></span>
                        Creating account...
                    </>
                ) : (
                    'Create Account'
                )}
            </button>
        </form>
    );
};

export default Register;
