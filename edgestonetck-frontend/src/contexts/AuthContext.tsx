import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Super admin' | 'Manager' | 'Support crew' | 'agent';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    profilePicture?: string;
    token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (user: User) => void;
    logout: () => void;
    isSuperAdmin: () => boolean;
    isManager: () => boolean;
    isSupportCrew: () => boolean;
    isAgent: () => boolean;
    getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

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
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('edgestone_user', JSON.stringify(userData));
        if (userData.profilePicture) {
            localStorage.setItem(`edgestone_avatar_${userData.id}`, userData.profilePicture);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('edgestone_user');
    };

    const isSuperAdmin = (): boolean => {
        if (!user || !user.role) return false;
        const role = user.role.toLowerCase();
        return role === 'super admin' || role === 'super_admin' || role === 'superadmin';
    };

    const isManager = (): boolean => {
        if (!user || !user.role) return false;
        return user.role.toLowerCase() === 'manager';
    };

    const isSupportCrew = (): boolean => {
        if (!user || !user.role) return false;
        const role = user.role.toLowerCase();
        return role === 'support crew' || role === 'support_crew' || role === 'agent';
    };

    const isAgent = (): boolean => {
        if (!user || !user.role) return false;
        return user.role.toLowerCase() === 'agent';
    };

    const getCurrentUser = (): User | null => {
        return user;
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isSuperAdmin, isManager, isSupportCrew, isAgent, getCurrentUser }}>
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
