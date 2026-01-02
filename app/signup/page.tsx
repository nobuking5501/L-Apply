'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { STRIPE_PLANS, formatPrice } from '@/lib/stripe-config';

type PlanType = 'test' | 'monitor' | 'regular' | 'pro';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('test');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    if (!displayName.trim()) {
      setError('お名前を入力してください');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName, selectedPlan);
      // Use window.location to force a full page reload and ensure userData is loaded
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています');
      } else if (err.code === 'auth/invalid-email') {
        setError('メールアドレスの形式が正しくありません');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードが弱すぎます。より強力なパスワードを設定してください');
      } else {
        setError('アカウント作成に失敗しました。もう一度お試しください');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">L-Apply</CardTitle>
          <CardDescription className="text-center">
            新規アカウント作成
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="displayName">お名前</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="山田 太郎"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500">6文字以上で入力してください</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Plan Selection */}
            <div className="space-y-3 pt-4 border-t">
              <Label>プランを選択</Label>
              <div className="space-y-3">
                {/* Free Plan */}
                <div
                  onClick={() => setSelectedPlan('test')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPlan === 'test'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={selectedPlan === 'test'}
                        onChange={() => setSelectedPlan('test')}
                        className="w-4 h-4"
                      />
                      <span className="font-bold text-lg">無料プラン</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">¥0</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1 ml-6">
                    <p>✓ イベント管理: 1件</p>
                    <p>✓ ステップ配信: なし</p>
                    <p>✓ リマインド: なし</p>
                    <p>✓ 月間申込受付: 10件</p>
                  </div>
                </div>

                {/* Paid Plans */}
                {Object.values(STRIPE_PLANS).map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id as PlanType)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={selectedPlan === plan.id}
                          onChange={() => setSelectedPlan(plan.id as PlanType)}
                          className="w-4 h-4"
                        />
                        <span className="font-bold text-lg">{plan.name}</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(plan.price)}/月
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 ml-6">
                      {plan.features.map((feature, index) => (
                        <p key={index}>✓ {feature}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ※ 有料プランは登録後、サブスクリプションページからいつでもアップグレードできます
              </p>
            </div>

            <div className="text-xs text-gray-600">
              アカウントを作成すると、自動的に組織が作成されます
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'アカウント作成中...' : 'アカウントを作成'}
            </Button>
            <p className="text-sm text-center text-gray-600">
              既にアカウントをお持ちの場合{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                ログイン
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
