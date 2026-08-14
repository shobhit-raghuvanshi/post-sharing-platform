"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BACKEND } from "../posts/postUtils";

// Shared auth context — holds user, token, and auth actions
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // logged-in user profile
  const [token, setToken]     = useState(null);   // JWT access token
  const [loading, setLoading] = useState(true);   // true while hydrating from localStorage
  const router = useRouter();

  // On mount: restore token from localStorage and re-validate it with /auth/me
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      setToken(stored);
      fetchMe(stored);
    } else {
      setLoading(false);
    }
  }, []);

  // Calls /auth/me to load the user profile; clears storage if the token is invalid
  async function fetchMe(jwt) {
    try {
      const res = await fetch(`${BACKEND}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error("Token rejected");
      const data = await res.json();
      setUser(data);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Sends credentials as form-encoded (required by OAuth2PasswordRequestForm on the backend)
  async function login(email, password) {
    const form = new URLSearchParams();
    form.append("username", email); // FastAPI OAuth2 form expects "username"
    form.append("password", password);

    const res = await fetch(`${BACKEND}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Invalid credentials");
    }

    const { access_token } = await res.json();
    localStorage.setItem("token", access_token);
    setToken(access_token);
    await fetchMe(access_token); // populate user state immediately after login
    router.push("/posts");
  }

  // Registers, then logs in automatically so the user lands on /posts
  async function register(fullname, email, password) {
    const res = await fetch(`${BACKEND}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Registration failed");
    }

    await login(email, password);
  }

  // Clears token + user from memory and storage, then sends to /login
  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook — any component can call useAuth() to access auth state
export function useAuth() {
  return useContext(AuthContext);
}
