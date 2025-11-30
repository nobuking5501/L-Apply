# 管理者ダッシュボード実装完了

## 📋 実装内容

L-Applyの管理者ダッシュボードとサブスクリプション管理機能の実装が完了しました。

### 実装された機能

#### 1. ✅ Firestoreスキーマ拡張

`organizations` コレクションに以下のフィールドを追加:

```typescript
{
  subscription: {
    plan: 'test' | 'monitor' | 'regular' | 'pro',
    status: 'active' | 'trial' | 'canceled' | 'past_due',
    limits: {
      maxEvents: 10,
      maxStepDeliveries: 3,
      maxReminders: 3,
      maxApplicationsPerMonth: 100,
    },
    trialEndsAt: Timestamp | null,
    currentPeriodStart: Timestamp,
    currentPeriodEnd: Timestamp,
  },
  usage: {
    eventsCount: 8,
    stepDeliveriesCount: 3,
    remindersCount: 3,
    applicationsThisMonth: 45,
    lastResetAt: Timestamp,
  }
}
```

#### 2. ✅ 管理者用ユーティリティ関数

**ファイル**: `functions/src/utils/admin-firestore.ts`

主要な関数:
- `getAllOrganizations()` - 全組織の取得
- `getOrganizationAdmin()` - 組織詳細の取得
- `updateOrganizationPlan()` - プラン変更
- `updateOrganizationStatus()` - ステータス変更
- `canAcceptApplication()` - 申込可否チェック
- `incrementApplicationCount()` - 申込数カウント
- `getAdminStats()` - 統計情報取得

#### 3. ✅ 管理者用APIエンドポイント

**エンドポイント**:
- `GET /api/admin/organizations` - 組織一覧取得
- `GET /api/admin/organizations/[id]` - 組織詳細取得
- `PATCH /api/admin/organizations/[id]` - 組織更新（プラン/ステータス変更）
- `GET /api/admin/stats` - 統計情報取得

**認証**: `x-admin-secret` ヘッダーで管理者認証

#### 4. ✅ 管理画面UI

**ルート**: `/admin`

**ページ**:
- `/admin` - ダッシュボード（統計情報表示）
- `/admin/organizations` - 組織一覧
- `/admin/organizations/[id]` - 組織詳細・プラン変更

**機能**:
- 📊 統計情報の可視化（総組織数、MRR、プラン別内訳）
- 📋 組織一覧表示・フィルタリング
- 🔄 プラン変更（テスト/モニター/正規/プロ）
- 📈 使用状況の可視化（プログレスバー表示）
- ✏️ ステータス変更（有効/トライアル/キャンセル）

#### 5. ✅ 機能制限チェック

**ファイル**: `functions/src/apply-prod.ts` (修正済み)

申込受付時に自動的にサブスクリプション制限をチェック:
- 申込上限チェック
- 申込数の自動カウント
- エラーメッセージの返却

#### 6. ✅ 既存組織の初期化スクリプト

**ファイル**: `functions/src/init-subscriptions.ts`

既存の組織にサブスクリプション情報を追加するスクリプト。

---

## 🚀 使い方

### 1. 環境変数の設定

`.env.local` に以下を追加（既に追加済み）:

```env
ADMIN_SECRET=your-secure-admin-secret-change-this
NEXT_PUBLIC_ADMIN_SECRET=your-secure-admin-secret-change-this
```

**重要**: 本番環境では強力なランダム文字列に変更してください！

### 2. 既存組織の初期化（初回のみ）

既存の組織データにサブスクリプション情報を追加する必要があります。

#### 方法A: Firebase Functions経由

1. `functions/src/index.ts` に以下を追加:

```typescript
export { initSubscriptions } from './init-subscriptions';
```

2. デプロイ:

```bash
cd functions
npm run deploy
```

3. 実行:

```bash
curl -X POST https://asia-northeast1-l-apply.cloudfunctions.net/initSubscriptions \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: your-secure-admin-secret-change-this"
```

詳細は `scripts/init-subscriptions.md` を参照してください。

### 3. 管理画面へのアクセス

1. **開発環境**:

```
http://localhost:3000/admin
```

2. **本番環境**:

```
https://l-apply.vercel.app/admin
```

**認証**: 現在は `x-admin-secret` ヘッダーでの簡易認証です。

### 4. プラン管理

管理画面から各組織のプランを変更できます:

1. `/admin/organizations` から組織を選択
2. 組織詳細ページで「プラン変更」ボタンをクリック
3. 新しいプランを選択
4. 自動的に制限が更新されます

### 5. 使用状況の確認

各組織の詳細ページで以下を確認できます:

- イベント数: 8/10
- ステップ配信数: 3/3
- リマインド数: 3/3
- 今月の申込数: 45/100

プログレスバーで視覚的に表示されます。

---

## 📊 プラン詳細

| プラン | 月額 | イベント | ステップ配信 | リマインド | 月間申込数 |
|--------|------|---------|------------|-----------|-----------|
| テスト | ¥0 | 3件 | 3個 | 3回 | 10件 |
| モニター | ¥980 | 10件 | 3個 | 3回 | 100件 |
| 正規 | ¥1,980 | 10件 | 3個 | 3回 | 300件 |
| プロ | ¥4,980 | 無制限 | 10個 | 無制限 | 無制限 |

---

## 🔒 セキュリティ上の注意

### 1. 管理者シークレットの変更

`.env.local` の `ADMIN_SECRET` を強力なランダム文字列に変更してください:

```bash
# 例: ランダム文字列の生成
openssl rand -base64 32
```

### 2. 本番環境のシークレット設定

Vercelの環境変数に同じシークレットを設定:

```
Vercel Dashboard > Project > Settings > Environment Variables
ADMIN_SECRET=生成したランダム文字列
NEXT_PUBLIC_ADMIN_SECRET=同じランダム文字列
```

### 3. 将来的な改善案

現在は簡易的なヘッダー認証ですが、将来的には以下を検討:

- Firebase Authentication での管理者ログイン
- JWT トークン認証
- IP制限
- ログイン画面の追加

---

## 🎨 UI/UXについて

### 既存ダッシュボードへの影響

**重要**: 既存のユーザー向けダッシュボード (`/dashboard`) には一切変更を加えていません。

- `/dashboard` - ユーザー向け（変更なし）
- `/admin` - 管理者向け（新規作成）

完全に独立したルートとして実装されているため、既存機能に影響はありません。

### デザイン

管理画面は既存ダッシュボードと同様のデザイン言語を使用:
- Tailwind CSS
- グレー・ブルー・グリーンのカラースキーム
- レスポンシブデザイン

---

## 📝 今後の実装予定

### 次のステップ: Stripe決済統合

管理画面の基盤が完成したので、次は Stripe 決済の統合です:

1. **Stripe アカウント設定**
2. **Checkout セッション作成**
3. **Webhook 処理**
4. **サブスクリプション管理**

詳細は `SAAS_STRIPE_PLAN.md` を参照してください。

---

## 🐛 トラブルシューティング

### 管理画面が表示されない

1. 環境変数が正しく設定されているか確認:

```bash
cat .env.local | grep ADMIN_SECRET
```

2. Next.js を再起動:

```bash
npm run dev
```

### APIがUnauthorizedエラーを返す

ヘッダーに正しいシークレットが設定されているか確認してください。

### サブスクリプション情報が表示されない

既存組織の初期化スクリプトを実行してください（上記参照）。

---

## 📞 サポート

実装に関する質問や問題があれば、お気軽にお問い合わせください。

---

## ✅ チェックリスト

実装完了の確認:

- [x] Firestore スキーマ拡張
- [x] 管理者用ユーティリティ関数
- [x] 管理者用 API エンドポイント
- [x] 管理画面 UI
- [x] 機能制限チェック統合
- [x] 初期化スクリプト
- [x] ドキュメント作成
- [x] ビルド成功確認
- [ ] 既存組織の初期化実行
- [ ] 管理画面での動作確認
- [ ] Stripe 決済統合（次のステップ）

---

**実装完了日**: 2025年11月17日

**次のアクション**:
1. `.env.local` の `ADMIN_SECRET` を強力なものに変更
2. 既存組織の初期化スクリプトを実行
3. 管理画面での動作確認
4. Stripe 決済統合の準備
