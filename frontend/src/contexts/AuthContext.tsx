"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type AuthUser = {
  user_id: string;
  email: string;
  role: "admin" | "staff" | "volunteer" | "medical_staff";
  name: string;
  person_id?: string;
  token?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isVolunteer: boolean;
  isMedical: boolean;
  isInternal: boolean; // admin | staff | volunteer | medical_staff
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isStaff: false,
  isVolunteer: false,
  isMedical: false,
  isInternal: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore from localStorage on mount
    try {
      const stored = localStorage.getItem("dms_user");
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
      }
    } catch {
      // ignore corrupted data
    } finally {
      setLoading(false);
    }
  }, []);

  function login(userData: AuthUser) {
    setUser(userData);
    localStorage.setItem("dms_user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("dms_token", userData.token);
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("dms_user");
    localStorage.removeItem("dms_token");
    fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin: user?.role === "admin",
      isStaff: user?.role === "staff",
      isVolunteer: user?.role === "volunteer",
      isMedical: user?.role === "medical_staff",
      isInternal: user?.role === "admin" || user?.role === "staff" || user?.role === "volunteer" || user?.role === "medical_staff",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Hook: redirect to login if not internal (admin/staff/volunteer/medical)
export function useRequireInternal(redirectTo = "/admin/login") {
  const { user, loading, isInternal } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!user || (!isInternal && user.role !== "pending"))) {
      router.replace(redirectTo);
    }
  }, [user, loading, isInternal]);
  return { user, loading };
}

// Hook: redirect to victim login if not victim
export function useRequireVictim(redirectTo = "/victim/login") {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!user || user.role !== "victim")) {
      router.replace(redirectTo);
    }
  }, [user, loading]);
  return { user, loading };
}
