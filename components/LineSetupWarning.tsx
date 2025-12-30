'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LineSetupWarning() {
  const { userData, user } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!userData?.organizationId || !user) {
      setChecking(false);
      return;
    }

    const checkLineSetup = async () => {
      try {
        // Fetch organization data to check LINE setup
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);

          let shouldShowWarning = !hasLineSetup;

          // Check secrets via API
          if (user) {
            try {
              const idToken = await user.getIdToken();
              const response = await fetch('/api/settings', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                },
              });

              if (response.ok) {
                const data = await response.json();
                const hasSecrets = data.secretsMetadata?.hasChannelSecret &&
                                   data.secretsMetadata?.hasChannelAccessToken;

                // Show warning if any LINE credential is missing
                shouldShowWarning = !hasLineSetup || !hasSecrets;
              }
            } catch (error) {
              console.error('Error checking LINE setup:', error);
            }
          }

          setShowWarning(shouldShowWarning);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setChecking(false);
      }
    };

    checkLineSetup();
  }, [userData, user]);

  if (checking || !showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 border-amber-300 bg-white shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              LINE連携の設定が必要です
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              L-Applyの機能を使用するには、設定画面でLINE Messaging APIの認証情報を設定する必要があります。
              <br /><br />
              設定が完了するまで、この機能はご利用いただけません。
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            >
              設定画面を開く
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
