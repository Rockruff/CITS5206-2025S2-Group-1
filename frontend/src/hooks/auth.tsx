"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "admin" | "user";

type AuthContextType = {
  isAuthenticated: boolean;
  role: Role | null;
  login: (username: string, _password: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("safetrack_auth") : null;
    const r = typeof window !== "undefined" ? (window.localStorage.getItem("safetrack_role") as Role | null) : null;
    if (token) setAuthenticated(true);
    if (r) setRole(r);
  }, []);

  const login = (username: string, _password: string) => {
    const newRole: Role = username.trim().toLowerCase() === "admin" ? "admin" : "user";
    if (typeof window !== "undefined") {
      window.localStorage.setItem("safetrack_auth", "true");
      window.localStorage.setItem("safetrack_role", newRole);
    }
    setRole(newRole);
    setAuthenticated(true);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("safetrack_auth");
      window.localStorage.removeItem("safetrack_role");
    }
    setRole(null);
    setAuthenticated(false);
  };

  const value = useMemo(() => ({ isAuthenticated, role, login, logout }), [isAuthenticated, role]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
