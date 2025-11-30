# 管理者ダッシュボード 設計書

## 🎯 目的

**あなた（アプリ提供者）が全ての顧客組織を管理できる画面を作る**

---

## 📊 必要な機能

### 1. 組織一覧
- 全組織のリスト表示
- プラン・ステータス確認
- 検索・フィルター

### 2. 組織詳細
- 基本情報
- 使用状況
- 申込履歴

### 3. プラン管理
- プラン変更
- トライアル延長
- 解約処理

### 4. 統計情報
- 総売上
- プラン別顧客数
- 継続率

---

## 🏗️ データ構造（拡張）

### organizations コレクション

```typescript
{
  // 基本情報
  organizationId: "org-001",
  name: "株式会社サンプル",
  email: "admin@example.com",
  phoneNumber: "090-1234-5678",

  // LINE設定
  lineChannelAccessToken: "xxx",
  lineChannelSecret: "xxx",
  liffId: "xxx",

  // サブスクリプション情報（新規）
  subscription: {
    plan: "test" | "monitor" | "regular" | "pro",
    status: "active" | "trial" | "canceled" | "past_due",

    // 制限
    limits: {
      maxEvents: 10,              // イベント上限
      maxStepDeliveries: 3,       // ステップ配信上限
      maxReminders: 3,            // リマインド上限
      maxApplicationsPerMonth: 100, // 月間申込上限
    },

    // トライアル
    trialStartedAt: Timestamp,
    trialEndsAt: Timestamp,

    // 課金
    billingCycle: "monthly",
    price: 980,
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,

    // Stripe（後で追加）
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  },

  // 使用状況（新規）
  usage: {
    currentMonth: "2025-01",
    eventsCount: 8,              // 今月のイベント数
    stepDeliveriesCount: 3,      // ステップ配信数
    remindersCount: 2,           // リマインド設定数
    applicationsCount: 45,       // 今月の申込数
    lastResetAt: Timestamp,
  },

  // 統計（新規）
  stats: {
    totalApplications: 156,      // 累計申込数
    totalRevenue: 2940,          // 累計売上（モニター¥980×3ヶ月）
    joinedAt: Timestamp,         // 登録日
    lastActivityAt: Timestamp,   // 最終利用日
  },

  // メタ情報
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## 🎨 画面設計

### 1. ダッシュボード（トップ）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  L-Apply 管理画面
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 サマリー
┌─────────────────────────────────┐
│ 総顧客数: 127社                  │
│ 月間売上: ¥157,940               │
│ 今月の申込: 1,234件              │
└─────────────────────────────────┘

📈 プラン別内訳
┌─────────────────────────────────┐
│ テスト: 27社（無料）             │
│ モニター: 80社（¥980）           │
│ 正規: 20社（¥1,980）             │
└─────────────────────────────────┘

🔔 アラート
┌─────────────────────────────────┐
│ ⚠️ トライアル終了間近: 5社       │
│ ⚠️ 上限到達: 3社                │
└─────────────────────────────────┘

[組織一覧へ]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. 組織一覧

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  組織一覧
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[検索] [プラン: 全て▼] [ステータス: 全て▼]

┌─────────────────────────────────────────┐
│ 組織名              プラン   ステータス   │
├─────────────────────────────────────────┤
│ 株式会社サンプル    モニター   active    │
│ スクールABC        正規      active    │
│ セミナー太郎        テスト     trial     │
│ ...                                     │
└─────────────────────────────────────────┘

ページ: 1 2 3 ... 10
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. 組織詳細

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  株式会社サンプル
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 基本情報
┌─────────────────────────────────┐
│ 組織ID: org-001                  │
│ メール: admin@example.com       │
│ 電話: 090-1234-5678              │
│ 登録日: 2025/01/15               │
└─────────────────────────────────┘

💳 プラン情報
┌─────────────────────────────────┐
│ プラン: モニター（¥980/月）      │
│ ステータス: active               │
│ 次回更新: 2025/02/15             │
│ [プラン変更] [解約]              │
└─────────────────────────────────┘

📊 使用状況（今月）
┌─────────────────────────────────┐
│ イベント: 8/10件 ████████░░     │
│ ステップ: 3/3個 ██████████ ⚠️   │
│ リマインド: 2/3回 ███████░░░    │
│ 申込: 45/100件 █████░░░░░       │
└─────────────────────────────────┘

📈 統計
┌─────────────────────────────────┐
│ 累計申込: 156件                  │
│ 累計売上: ¥2,940                 │
│ 最終利用: 2025/01/16 15:30      │
└─────────────────────────────────┘

📝 申込履歴（直近10件）
┌─────────────────────────────────┐
│ 2025/01/16 15:30 山田太郎        │
│ 2025/01/16 14:20 佐藤花子        │
│ ...                              │
└─────────────────────────────────┘

[< 戻る]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🛠️ 実装の流れ

### Step 1: Firestoreスキーマ拡張

**ファイル**: `functions/src/utils/admin-firestore.ts` (新規作成)

```typescript
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { ensureFirebaseInitialized } from './firebase-init';

// 管理者用のFirestore操作

/**
 * 全組織を取得
 */
export async function getAllOrganizations() {
  ensureFirebaseInitialized();
  const db = getFirestore();

  const snapshot = await db.collection('organizations')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * 組織情報を更新
 */
export async function updateOrganization(
  orgId: string,
  data: any
) {
  ensureFirebaseInitialized();
  const db = getFirestore();

  await db.collection('organizations').doc(orgId).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * プラン変更
 */
export async function changePlan(
  orgId: string,
  newPlan: 'test' | 'monitor' | 'regular' | 'pro'
) {
  const limits = getPlanLimits(newPlan);
  const price = getPlanPrice(newPlan);

  await updateOrganization(orgId, {
    'subscription.plan': newPlan,
    'subscription.limits': limits,
    'subscription.price': price,
    'subscription.currentPeriodStart': Timestamp.now(),
    'subscription.currentPeriodEnd': getNextBillingDate(),
  });
}

/**
 * プラン別の制限を取得
 */
function getPlanLimits(plan: string) {
  const limits = {
    test: {
      maxEvents: 3,
      maxStepDeliveries: 3,
      maxReminders: 3,
      maxApplicationsPerMonth: 10,
    },
    monitor: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 3,
      maxApplicationsPerMonth: 100,
    },
    regular: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 3,
      maxApplicationsPerMonth: 300,
    },
    pro: {
      maxEvents: 999,
      maxStepDeliveries: 10,
      maxReminders: 10,
      maxApplicationsPerMonth: 999999,
    },
  };

  return limits[plan];
}

/**
 * プラン別の価格を取得
 */
function getPlanPrice(plan: string) {
  const prices = {
    test: 0,
    monitor: 980,
    regular: 1980,
    pro: 4980,
  };

  return prices[plan];
}

/**
 * 次回請求日を取得（1ヶ月後）
 */
function getNextBillingDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return Timestamp.fromDate(date);
}

/**
 * 使用状況をリセット（月次）
 */
export async function resetMonthlyUsage(orgId: string) {
  await updateOrganization(orgId, {
    'usage.currentMonth': new Date().toISOString().slice(0, 7), // "2025-01"
    'usage.eventsCount': 0,
    'usage.applicationsCount': 0,
    'usage.lastResetAt': Timestamp.now(),
  });
}

/**
 * 統計情報を取得
 */
export async function getAdminStats() {
  ensureFirebaseInitialized();
  const db = getFirestore();

  const orgs = await db.collection('organizations').get();

  let stats = {
    totalOrganizations: 0,
    planCounts: {
      test: 0,
      monitor: 0,
      regular: 0,
      pro: 0,
    },
    totalRevenue: 0,
    totalApplications: 0,
  };

  orgs.docs.forEach(doc => {
    const data = doc.data();
    stats.totalOrganizations++;

    const plan = data.subscription?.plan || 'test';
    stats.planCounts[plan]++;

    stats.totalRevenue += data.stats?.totalRevenue || 0;
    stats.totalApplications += data.stats?.totalApplications || 0;
  });

  return stats;
}
```

---

### Step 2: 管理API作成

**ファイル**: `app/api/admin/organizations/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAllOrganizations } from '@/lib/admin-firestore';

// 管理者認証（簡易版）
function isAdmin(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_SECRET_KEY;
}

// GET /api/admin/organizations
export async function GET(req: NextRequest) {
  // 管理者認証
  if (!isAdmin(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const organizations = await getAllOrganizations();
    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**ファイル**: `app/api/admin/organizations/[id]/route.ts` (新規作成)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOrganization, updateOrganization } from '@/lib/admin-firestore';

// 管理者認証
function isAdmin(req: NextRequest) {
  const adminKey = req.headers.get('x-admin-key');
  return adminKey === process.env.ADMIN_SECRET_KEY;
}

// GET /api/admin/organizations/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const org = await getOrganization(params.id);
    return NextResponse.json({ organization: org });
  } catch (error) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

// PATCH /api/admin/organizations/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await updateOrganization(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
```

---

### Step 3: 管理画面UI作成

**ファイル**: `app/admin/page.tsx` (新規作成)

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;

    // 統計情報取得
    const statsRes = await fetch('/api/admin/stats', {
      headers: { 'x-admin-key': adminKey }
    });
    const statsData = await statsRes.json();
    setStats(statsData);

    // 組織一覧取得
    const orgsRes = await fetch('/api/admin/organizations', {
      headers: { 'x-admin-key': adminKey }
    });
    const orgsData = await orgsRes.json();
    setOrganizations(orgsData.organizations);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">L-Apply 管理画面</h1>

        {/* サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">総顧客数</div>
            <div className="text-3xl font-bold">{stats.totalOrganizations}社</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">月間売上</div>
            <div className="text-3xl font-bold">¥{stats.totalRevenue.toLocaleString()}</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">今月の申込</div>
            <div className="text-3xl font-bold">{stats.totalApplications}件</div>
          </div>
        </div>

        {/* プラン別内訳 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">プラン別内訳</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-500">テスト</div>
              <div className="text-2xl font-bold">{stats.planCounts.test}社</div>
            </div>
            <div>
              <div className="text-gray-500">モニター</div>
              <div className="text-2xl font-bold">{stats.planCounts.monitor}社</div>
            </div>
            <div>
              <div className="text-gray-500">正規</div>
              <div className="text-2xl font-bold">{stats.planCounts.regular}社</div>
            </div>
            <div>
              <div className="text-gray-500">プロ</div>
              <div className="text-2xl font-bold">{stats.planCounts.pro}社</div>
            </div>
          </div>
        </div>

        {/* 組織一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">組織一覧</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">組織名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">プラン</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{org.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.subscription.plan === 'test' ? 'bg-gray-100 text-gray-800' :
                        org.subscription.plan === 'monitor' ? 'bg-blue-100 text-blue-800' :
                        org.subscription.plan === 'regular' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {org.subscription.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${
                        org.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                        org.subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {org.subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{org.usage?.applicationsCount || 0}</td>
                    <td className="px-6 py-4">
                      <a
                        href={`/admin/organizations/${org.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        詳細
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 セキュリティ

### 管理者認証

**環境変数** `.env.local`
```env
# 管理者用シークレットキー（ランダム生成）
ADMIN_SECRET_KEY=your-random-secret-key-here
NEXT_PUBLIC_ADMIN_KEY=your-random-secret-key-here
```

**生成方法**:
```bash
# ランダムなキーを生成
openssl rand -hex 32
```

---

## 📝 実装チェックリスト

### Phase 1: データ構造（Week 1）
- [ ] organizationsスキーマ拡張
- [ ] subscription情報追加
- [ ] usage情報追加
- [ ] stats情報追加

### Phase 2: API実装（Week 2）
- [ ] admin-firestore.ts作成
- [ ] 組織一覧API
- [ ] 組織詳細API
- [ ] プラン変更API
- [ ] 統計API

### Phase 3: UI実装（Week 3）
- [ ] ダッシュボード画面
- [ ] 組織一覧画面
- [ ] 組織詳細画面
- [ ] プラン変更UI

### Phase 4: セキュリティ（Week 3）
- [ ] 管理者認証
- [ ] API保護
- [ ] アクセスログ

---

**次のステップ**: まずFirestoreスキーマを拡張しましょうか？
