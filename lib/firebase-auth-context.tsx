import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User, 
} from "firebase/auth";
import { auth, db, retryFirebaseOperation } from "./firebase-config";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

export type UserRole = "admin" | "maintenance";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  fullName: string;
  employeeId?: string;
  shiftAssignment?: "Morning" | "Afternoon" | "Evening";
  createdAt: Date;
}

interface AuthContextType {
  user: UserData | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserData>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (firebaseUser) {
        const q = query(
          collection(db, "users"),
          where("email", "==", firebaseUser.email)
        );

        const snapshot = await retryFirebaseOperation(() => getDocs(q), 3, 500);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data() as UserData;

          setUser({
            ...userData,
            uid: firebaseUser.uid,
          });
        } else {
          console.warn("No Firestore doc for this user. Signing out.");
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  });

  return unsubscribe;
}, []);

const signUp = async (email: string, password: string, userData: Partial<UserData>) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);

    await retryFirebaseOperation(
      () =>
        setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email,
          role: userData.role || "maintenance",
          fullName: userData.fullName || "",
          employeeId: userData.employeeId || "",
          shiftAssignment: userData.shiftAssignment || "Morning",
          createdAt: new Date(),
        }),
      3,
      500
    );

    setUser({
      uid: firebaseUser.uid,
      email,
      role: (userData.role || "maintenance") as UserRole,
      fullName: userData.fullName || "",
      employeeId: userData.employeeId,
      shiftAssignment: userData.shiftAssignment as any,
      createdAt: new Date(),
    });

  } catch (error: any) {
    console.error("Sign up error:", error);
    throw new Error(error.message || "Sign up failed");
  }
};

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Query by email
      const q = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email)
      );

      const snapshot = await retryFirebaseOperation(() => getDocs(q), 3, 500);

      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data() as UserData;

        setUser({
          ...userData,
          uid: firebaseUser.uid,
        });
      } else {
        throw new Error("User record not found in Firestore");
      }

    } catch (error: any) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Sign in failed");
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(error.message || "Sign out failed");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoading,
        signUp,
        signIn,
        signOutUser,
        signOut: signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return context;
}
