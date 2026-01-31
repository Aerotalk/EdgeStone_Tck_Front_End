import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'super_admin' | 'agent';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isSuperAdmin: () => boolean;
    isAgent: () => boolean;
    getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('edgestone_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Failed to parse stored user:', error);
                localStorage.removeItem('edgestone_user');
            }
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('edgestone_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('edgestone_user');
    };

    const isSuperAdmin = (): boolean => {
        return user?.role === 'super_admin';
    };

    const isAgent = (): boolean => {
        return user?.role === 'agent';
    };

    const getCurrentUser = (): User | null => {
        return user;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isSuperAdmin, isAgent, getCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
