import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("rakshaxai_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (payload) => {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem("rakshaxai_token", response.data.token);
    localStorage.setItem("rakshaxai_user", JSON.stringify(response.data.user));
    setUser(response.data.user);
    toast.success("Welcome back");
  };

  const register = async (payload) => {
    const response = await api.post("/auth/register", payload);
    localStorage.setItem("rakshaxai_token", response.data.token);
    localStorage.setItem("rakshaxai_user", JSON.stringify(response.data.user));
    setUser(response.data.user);
    toast.success("Account created");
  };

  const logout = () => {
    localStorage.removeItem("rakshaxai_token");
    localStorage.removeItem("rakshaxai_user");
    setUser(null);
    toast.success("Logged out");
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
