import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  subscribeToAuthChanges,
  loginWithEmail,
  registerWithEmail,
  logout as firebaseLogout,
  resetPassword,
  loginWithGoogle,
  isFirebaseConfigured,
} from "../../services/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await loginWithEmail(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email, password, displayName) => {
    const u = await registerWithEmail(email, password, displayName);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await firebaseLogout();
    setUser(null);
  }, []);

  const sendReset = useCallback(async (email) => {
    await resetPassword(email);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const u = await loginWithGoogle();
    setUser(u);
    return u;
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    initializing,
    firebaseConfigured: isFirebaseConfigured,
    login,
    register,
    signOut,
    sendReset,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
