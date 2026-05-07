import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '../../config/firebase.js';

/**
 * React context exposing the current Firebase Auth user and a few helpers.
 *
 * Shape:
 *   {
 *     user:     null | { uid, email, displayName, ... } | undefined (= still loading)
 *     loading:  boolean
 *     signIn:   (email, password) => Promise<UserCredential>
 *     signOut:  () => Promise<void>
 *   }
 */
const AuthContext = createContext({
  user: undefined,
  loading: true,
  signIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  signOut: async () => {
    throw new Error('AuthContext not initialized');
  },
});

export function AuthProvider({ children }) {
  // `undefined` while we're waiting for the first onAuthStateChanged callback,
  // `null` if the user is signed out, an object if signed in.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      setUser(current ?? null);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading: user === undefined,
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => fbSignOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
