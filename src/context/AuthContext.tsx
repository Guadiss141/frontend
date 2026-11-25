// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as auth from '../services/authService';
import type { User } from '../services/authService';

type AuthValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

// Valor por defecto: permite renderizar pantallas sueltas (por ejemplo en los tests) sin proveedor.
const AuthContext = createContext<AuthValue>({
  user: null,
  loading: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getSession().then(setUser).finally(() => setLoading(false));
  }, []);

  const value: AuthValue = {
    user,
    loading,
    signIn: async (email, password) => setUser(await auth.login(email, password)),
    signUp: async (name, email, password) => setUser(await auth.register(name, email, password)),
    signOut: async () => {
      await auth.logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);