# 次回タスク: 個別相談リクエスト管理ページの実装

## 📋 タスク概要

個別相談リクエストを管理するダッシュボードページを実装します。

## 🎯 実装内容

### 1. ページ作成
**ファイル**: `app/dashboard/consultations/page.tsx`

**機能**:
- 個別相談リクエスト一覧表示
- ステータス管理（pending/contacted/completed/cancelled）
- 相談者情報表示（userId, 申込情報など）
- 対応履歴の記録
- 検索・フィルタリング
- CSVエクスポート

### 2. ナビゲーション追加
**ファイル**: `app/dashboard/layout.tsx`

**変更**:
```typescript
import { MessageCircle } from 'lucide-react';

const navigation = [
  { name: 'ホーム', href: '/dashboard', icon: LayoutDashboard },
  { name: 'イベント管理', href: '/dashboard/events', icon: Calendar },
  { name: '個別相談', href: '/dashboard/consultations', icon: MessageCircle }, // NEW!
  { name: 'ステップ配信監視', href: '/dashboard/step-delivery', icon: Send },
  // ...
];
```

### 3. 型定義の追加
**ファイル**: `types/index.ts`

**追加する型**:
```typescript
export interface ConsultationRequest {
  id: string;
  organizationId: string;
  userId: string;
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt?: any;
  notes?: string;
  contactedAt?: any;
  completedAt?: any;
}
```

### 4. Firestoreセキュリティルール更新
**ファイル**: `firestore.rules`

**追加するルール**:
```javascript
match /consultation_requests/{requestId} {
  // 管理者のみアクセス可能
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'owner'];
}
```

## 📝 実装サンプル

### consultations/page.tsx の基本構造

```typescript
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import type { ConsultationRequest } from '@/types';

export default function ConsultationsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchConsultations = async () => {
      try {
        const q = query(
          collection(db, 'consultation_requests'),
          where('organizationId', '==', userData.organizationId)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ConsultationRequest[];

        setConsultations(data);
      } catch (error) {
        console.error('Error fetching consultations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, [userData]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'consultation_requests', id), {
        status,
        updatedAt: new Date(),
        ...(status === 'contacted' && { contactedAt: new Date() }),
        ...(status === 'completed' && { completedAt: new Date() }),
      });

      // Refresh data
      setConsultations(
        consultations.map((c) =>
          c.id === id ? { ...c, status: status as any } : c
        )
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  // Filter consultations
  const filteredConsultations = consultations.filter((c) => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">個別相談リクエスト</h2>
          <p className="text-sm text-gray-600 mt-1">
            LINEから送信された個別相談リクエストを管理できます
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">総リクエスト数</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {consultations.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">未対応</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {consultations.filter((c) => c.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">対応中</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {consultations.filter((c) => c.status === 'contacted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">完了</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {consultations.filter((c) => c.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              全て
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
            >
              未対応
            </Button>
            <Button
              variant={filterStatus === 'contacted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('contacted')}
            >
              対応中
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('completed')}
            >
              完了
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Consultations List */}
      <Card>
        <CardHeader>
          <CardTitle>
            リクエスト一覧 ({filteredConsultations.length}件)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConsultations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {filterStatus !== 'all'
                ? '該当するリクエストがありません'
                : 'リクエストがありません'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredConsultations.map((consultation) => {
                const createdDate = consultation.createdAt?.toDate
                  ? consultation.createdAt.toDate().toLocaleString('ja-JP')
                  : '未設定';

                return (
                  <div
                    key={consultation.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-5 w-5 text-blue-600" />
                          <h4 className="text-base font-semibold text-gray-900">
                            {consultation.userId}
                          </h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          受付日時: {createdDate}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          consultation.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : consultation.status === 'contacted'
                            ? 'bg-blue-100 text-blue-800'
                            : consultation.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {consultation.status === 'pending'
                          ? '未対応'
                          : consultation.status === 'contacted'
                          ? '対応中'
                          : consultation.status === 'completed'
                          ? '完了'
                          : 'キャンセル'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {consultation.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(consultation.id, 'contacted')
                          }
                        >
                          対応開始
                        </Button>
                      )}
                      {consultation.status === 'contacted' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(consultation.id, 'completed')
                          }
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          完了
                        </Button>
                      )}
                      {(consultation.status === 'pending' ||
                        consultation.status === 'contacted') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdateStatus(consultation.id, 'cancelled')
                          }
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          キャンセル
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## ✅ 実装チェックリスト

- [ ] `types/index.ts`にConsultationRequest型を追加
- [ ] `app/dashboard/consultations/page.tsx`を作成
- [ ] `app/dashboard/layout.tsx`のナビゲーションに追加
- [ ] ビルドして動作確認
- [ ] Firestoreセキュリティルールを更新
- [ ] デプロイ（hosting + firestore rules）
- [ ] LINEで「個別相談希望」と送信してテスト
- [ ] ダッシュボードで表示されることを確認
- [ ] ステータス更新機能をテスト

## 🚀 実装手順

### ステップ1: 型定義の追加
```bash
# types/index.tsを編集
# ConsultationRequest型を追加
```

### ステップ2: ページの作成
```bash
# app/dashboard/consultations/page.tsxを作成
# 上記のサンプルコードを使用
```

### ステップ3: ナビゲーションの更新
```bash
# app/dashboard/layout.tsxを編集
# MessageCircleアイコンをインポート
# navigationに個別相談を追加
```

### ステップ4: ビルドとテスト
```bash
npm run build
npm run dev  # ローカルで確認
```

### ステップ5: デプロイ
```bash
# Firestoreルールを更新
firebase deploy --only firestore:rules

# Hostingをデプロイ
npm run build
firebase deploy --only hosting
```

### ステップ6: 動作確認
1. LINEで「個別相談希望」と送信
2. ダッシュボードの個別相談ページで確認
3. ステータスを「対応開始」に変更
4. ステータスを「完了」に変更

## 📚 参考情報

### Firestore Query
```typescript
// 組織でフィルタ
const q = query(
  collection(db, 'consultation_requests'),
  where('organizationId', '==', organizationId),
  orderBy('createdAt', 'desc')
);

// ステータスでフィルタ
const q = query(
  collection(db, 'consultation_requests'),
  where('organizationId', '==', organizationId),
  where('status', '==', 'pending'),
  orderBy('createdAt', 'desc')
);
```

### ステータス遷移
```
pending → contacted → completed
  ↓
cancelled
```

---

**作成日**: 2025-11-13
**優先度**: 高
