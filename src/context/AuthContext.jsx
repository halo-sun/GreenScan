/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

async function saveUserToFirestore(user) {
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function signIn() {
  const result = await signInWithPopup(auth, googleProvider);
  await saveUserToFirestore(result.user);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
