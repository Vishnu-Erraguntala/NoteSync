"use client";

import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";

type UserContextValue = {
  username: string | null;
  setUsername: (name: string | null) => void;
};

const STORAGE_KEY = "notesync-username";

const UserContext = createContext<UserContextValue>({
  username: null,
  setUsername: () => undefined,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  const setUsername = (name: string | null) => {
    if (typeof window === "undefined") return;
    if (name) {
      localStorage.setItem(STORAGE_KEY, name);
      toast.success(`Welcome back, ${name}!`);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setUsernameState(name);
  };

  const value = useMemo(() => ({ username, setUsername }), [username]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}

