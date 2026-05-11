import { createContext } from 'react';

export interface User {
    fullName: string;
    role: string;
}

export interface AuthContextType {
    user: User | null;
    login: (fullName: string, role: string) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);