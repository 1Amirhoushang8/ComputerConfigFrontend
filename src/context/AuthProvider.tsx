import { useState, useEffect, type ReactNode } from 'react';
import { fetchMe, logoutUser } from '../API/authApi';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<{ fullName: string; role: string } | null>(null);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const data = await fetchMe();
                setUser({ fullName: data.fullName, role: data.role });
            } catch {
                // Not logged in – ignore
            }
        };
        restoreSession();
    }, []);

    const login = (fullName: string, role: string) => {
        setUser({ fullName, role });
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch {
            // Even if the request fails, clear local state
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};