import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "student" | "warden" | "hod";

interface User {
  username: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials
const demoCredentials = {
  "student": { password: "student123", name: "John Doe", role: "student" as UserRole },
  "warden": { password: "warden123", name: "Dr. Smith", role: "warden" as UserRole },
  "hod": { password: "hod123", name: "Prof. Johnson", role: "hod" as UserRole },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    const creds = demoCredentials[username as keyof typeof demoCredentials];
    if (creds && creds.password === password) {
      setUser({
        username,
        role: creds.role,
        name: creds.name,
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};