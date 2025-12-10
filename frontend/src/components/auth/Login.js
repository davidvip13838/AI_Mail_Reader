import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Login = ({ switchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading } = useAuth(); // Loading from context might be global loading, maybe separate local loading? 
    // Actually, context 'loading' is usually for initial auth check. 
    // But login function is async. Let's use local loading for button state to be precise.
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await login(email, password);
            // Redirect or state change happens via context
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Welcome Back</h2>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
            >
                {submitting ? (
                    <>
                        <span className="loading-spinner"></span>
                        Signing in...
                    </>
                ) : (
                    'Sign In'
                )}
            </button>
        </form>
    );
};

export default Login;
