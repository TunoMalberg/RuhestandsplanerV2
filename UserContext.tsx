"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { 
  type UserData, 
  getCurrentUser, 
  loginUser as loginUserStorage, 
  logoutUser as logoutUserStorage,
  updateUserSettings,
  defaultSettings 
} from "@/lib/user-storage";

interface UserContextType {
  user: UserData | null;
  isLoading: boolean;
  login: (username: string) => void;
  logout: () => void;
  saveSettings: (settings: Partial<UserData["settings"]>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getCurrentUser();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const userData = loginUserStorage(username);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    logoutUserStorage();
    setUser(null);
  }, []);

  const saveSettings = useCallback((settings: Partial<UserData["settings"]>) => {
    const updated = updateUserSettings(settings);
    if (updated) {
      setUser(updated);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, saveSettings }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}