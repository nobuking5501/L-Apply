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
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
          // Fetch user data from Firestore with retry logic
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          console.log('📄 Fetching user doc for UID:', firebaseUser.uid);

          let userDoc = await getDoc(userDocRef);
          let retryCount = 0;
          const maxRetries = 3;

          // If document doesn't exist, retry a few times (for new signups)
          while (!userDoc.exists() && retryCount < maxRetries) {
            retryCount++;
            console.log(`⏳ User document not found, retrying (${retryCount}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            userDoc = await getDoc(userDocRef);
          }

          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            console.log('✅ User data fetched:', data);
            setUserData(data);
          } else {
            console.warn('⚠️ User document does not exist in Firestore after retries');
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
    let createdUser: User | null = null;

    try {
      console.log('📝 Starting signup process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = userCredential.user;
      console.log('✅ Firebase Auth user created:', createdUser.uid);

      // Create organization for new user
      const orgId = `org_${createdUser.uid}`;
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
      // Convert to Firestore Timestamp for consistency
      const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
      const trialEndTimestamp = Timestamp.fromDate(trialEndDate);

      console.log('📝 Creating organization document...');
      await setDoc(orgDocRef, {
        name: `${displayName}の組織`,
        plan: plan, // Add plan field at root level for consistency
        createdAt: now,
        updatedAt: now,
        ownerId: createdUser.uid,
        // LINE integration fields (empty by default, to be configured in settings)
        // NOTE: lineChannelSecret and lineChannelAccessToken are stored in organization_secrets collection
        lineChannelId: '',
        liffId: '',
        // Branding fields
        companyName: '',
        primaryColor: '#3B82F6',
        // Addons field (for support service and other add-ons)
        addons: {},
        subscription: {
          plan: plan,
          status: plan === 'test' ? 'trial' : 'active',
          limits: getPlanLimits(plan),
          trialEndsAt: plan === 'test' ? trialEndTimestamp : null,
          currentPeriodStart: now,
          currentPeriodEnd: trialEndTimestamp,
        },
        usage: {
          eventsCount: 0,
          stepDeliveriesCount: 0,
          remindersCount: 0,
          applicationsThisMonth: 0,
          lastResetAt: now,
        },
      });
      console.log('✅ Organization document created:', orgId);

      // NOTE: organization_secrets is created via API when LINE credentials are configured in settings
      // It cannot be created here due to Firestore security rules (server-side only access)

      // Create subscriptions document
      console.log('📝 Creating subscriptions document...');
      const subscriptionDocRef = doc(db, 'subscriptions', orgId);
      await setDoc(subscriptionDocRef, {
        organizationId: orgId,
        tier: 'free',
        status: 'active',
        applicationLimit: getPlanLimits(plan).maxApplicationsPerMonth,
        reminderLimit: getPlanLimits(plan).maxReminders,
        stepDeliveryLimit: getPlanLimits(plan).maxStepDeliveries,
        currentApplicationCount: 0,
        currentReminderCount: 0,
        currentStepDeliveryCount: 0,
        addons: {},
        createdAt: now,
        updatedAt: now,
      });
      console.log('✅ Subscriptions document created:', orgId);

      // Create user document
      console.log('📝 Creating user document...');
      const userDocRef = doc(db, 'users', createdUser.uid);
      await setDoc(userDocRef, {
        uid: createdUser.uid,
        email: createdUser.email,
        displayName,
        organizationId: orgId,
        role: 'owner',
        createdAt: now,
      });
      console.log('✅ User document created:', createdUser.uid);

      // Wait for Firestore to propagate (increased to 2 seconds for reliability)
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Signup process completed successfully');
    } catch (error) {
      console.error('❌ SignUp error:', error);

      // If user was created in Firebase Auth but Firestore failed, clean up
      if (createdUser) {
        console.warn('⚠️ Cleaning up incomplete account...');
        try {
          await createdUser.delete();
          console.log('✅ Incomplete Firebase Auth account deleted');
        } catch (deleteError) {
          console.error('❌ Failed to delete incomplete account:', deleteError);
          console.error('⚠️ Manual cleanup required for UID:', createdUser.uid);
        }
      }

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
