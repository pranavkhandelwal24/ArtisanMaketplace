"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const AuthContext = createContext({ user: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            // Combine all data: Firebase Auth + custom Firestore fields
            setUser({
              ...firebaseUser,
              role: userData.role || null,
              isVerifiedArtisan: userData.isVerifiedArtisan || false,
              isAdmin: userData.isAdmin || false,
            });
          } else {
            // User exists in Auth but not Firestore
            setUser({
              ...firebaseUser,
              role: null,
              isVerifiedArtisan: false,
              isAdmin: false,
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error("AuthContext Firestore listener error:", error);
          setUser({ ...firebaseUser, role: null, isVerifiedArtisan: false, isAdmin: false });
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

