"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Add the isAdmin flag to our user type
export interface AuthUser extends FirebaseUser {
  role: 'buyer' | 'artisan' | null;
  isVerifiedArtisan: boolean;
  isAdmin?: boolean; // isAdmin is optional
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
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
              isAdmin: userData.isAdmin || false, // <-- THE FIX: Fetch the isAdmin status
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

