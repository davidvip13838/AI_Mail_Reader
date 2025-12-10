import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check auth on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const userData = await authService.getProfile();
                    setUser(userData.user);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error("Auth check failed", err);
                    localStorage.removeItem('auth_token');
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.login(email, password);
            localStorage.setItem('auth_token', data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, name) => {
        setLoading(true);
        setError(null);
        try {
            const data = await authService.register({ email, password, name });
            localStorage.setItem('auth_token', data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return data;
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('auth_token');
        }
    };

    // Helper to update user state locally (e.g. after profile update)
    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            error,
            isAuthenticated,
            login,
            register,
            logout,
            updateUser,
            setError
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
