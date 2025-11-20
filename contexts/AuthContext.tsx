'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: 'admin' | 'owner' | 'member';
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, plan?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.uid);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          console.log('📄 Fetching user doc for UID:', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            console.log('✅ User data fetched:', data);
            setUserData(data);
          } else {
            console.warn('⚠️ User document does not exist in Firestore');
            setUserData(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
      console.log('✅ Auth loading complete');
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string, plan: string = 'test') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create organization for new user
      const orgId = `org_${user.uid}`;
      const orgDocRef = doc(db, 'organizations', orgId);

      // Define plan limits based on selected plan
      const getPlanLimits = (planType: string) => {
        switch (planType) {
          case 'test':
            return {
              maxEvents: 1,
              maxStepDeliveries: 0,
              maxReminders: 0,
              maxApplicationsPerMonth: 10,
            };
          case 'monitor':
            return {
              maxEvents: 10,
              maxStepDeliveries: 3,
              maxReminders: 5,
              maxApplicationsPerMonth: 100,
            };
          case 'regular':
            return {
              maxEvents: 10,
              maxStepDeliveries: 3,
              maxReminders: 10,
              maxApplicationsPerMonth: 300,
            };
          case 'pro':
            return {
              maxEvents: 50,
              maxStepDeliveries: 10,
              maxReminders: 50,
              maxApplicationsPerMonth: 1000,
            };
          default:
            return {
              maxEvents: 1,
              maxStepDeliveries: 0,
              maxReminders: 0,
              maxApplicationsPerMonth: 10,
            };
        }
      };

      const now = serverTimestamp();
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

      await setDoc(orgDocRef, {
        name: `${displayName}の組織`,
        createdAt: now,
        updatedAt: now,
        ownerId: user.uid,
        subscription: {
          plan: plan,
          status: plan === 'test' ? 'trial' : 'active',
          limits: getPlanLimits(plan),
          trialEndsAt: plan === 'test' ? trialEnd : null,
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
        },
        usage: {
          eventsCount: 0,
          stepDeliveriesCount: 0,
          remindersCount: 0,
          applicationsThisMonth: 0,
          lastResetAt: now,
        },
      });

      // Create user document
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName,
        organizationId: orgId,
        role: 'owner',
        createdAt: now,
      });

      // Wait a moment for Firestore to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
