# 開発環境の起動手順

## 🚀 クイックスタート（毎回これを実行）

```bash
cd /mnt/c/Users/user/Desktop/L-Apply
npm run dev
```

ブラウザで http://localhost:3000 を開く

---

## 📋 プロジェクト構成

### フロントエンド: Next.js + Vercel
- **ローカル開発**: `npm run dev` (port 3000)
- **本番環境**: https://l-apply.vercel.app
- **デプロイ**: GitHubへのpushで自動デプロイ

### バックエンド: Firebase Cloud Functions
- **ローカル開発**: functionsディレクトリで作業
- **本番環境**: Firebase Functions
- **デプロイ**: GitHubへのpushで自動デプロイ（GitHub Actions）

---

## 🔧 トラブルシューティング

### ポートが使用中の場合
```bash
# ポート3000を使っているプロセスを確認
lsof -ti:3000

# 強制終了
lsof -ti:3000 | xargs kill -9

# または一括終了
pkill -f "next dev"
```

### node_modulesの問題
```bash
rm -rf node_modules package-lock.json
npm install
```

### ビルドキャッシュの問題
```bash
rm -rf .next
npm run dev
```

---

## 📦 主要なディレクトリ構成

```
L-Apply/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理画面
│   ├── dashboard/         # ダッシュボード
│   ├── api/               # API Routes
│   └── signup/            # サインアップ
├── functions/             # Firebase Cloud Functions
│   └── src/
│       ├── apply-prod.ts       # 申込処理（制限チェック実装済み）
│       ├── webhook-prod.ts     # LINEウェブフック
│       └── utils/
│           └── admin-firestore.ts  # サブスクリプション管理
├── contexts/              # React Context（認証など）
├── lib/                   # 共通ユーティリティ
└── components/            # 再利用可能コンポーネント
```

---

## 🔐 環境変数（すでに設定済み）

### フロントエンド (.env.local)
- Firebase設定
- Stripe公開鍵

### バックエンド (Firebase Config)
- LINE設定
- LIFF設定
- Stripe秘密鍵

---

## 🎯 最近の実装内容（2025-11-21）

### ✅ 完了した機能
1. **フリープランへの名称変更**
   - 「テスト」→「フリープラン」にUI全体を変更

2. **サブスクリプション制限の実装**
   - フリープラン: イベント1件、ステップ配信0件、リマインダー0件、月間申込10件
   - バックエンドでステップ配信制限チェック追加（apply-prod.ts:196-236）
   - 申込制限チェック（既存機能、正常動作中）
   - リマインダー制限チェック（既存機能、正常動作中）

3. **管理機能**
   - アカウント無効化/有効化
   - アカウント削除
   - 無制限プラン付与機能

### 📝 実装したファイル
- `functions/src/apply-prod.ts` - ステップ配信制限追加
- `functions/src/count-events-trigger.ts` - イベントカウンター（準備完了、有効化保留）
- `app/admin/**/*` - 管理画面
- `app/signup/page.tsx` - プラン選択機能
- 各種UI - フリープラン表示変更

---

## 🚨 注意事項

### デプロイについて
- **ローカルからfirebase deployを実行しない**
- GitHubにpushすれば自動でデプロイされます
- GitHub Actions: https://github.com/nobuking5501/L-Apply/actions
- Vercel: https://vercel.com/dashboard

### 開発の流れ
1. ローカルで開発・テスト
2. `git add .`
3. `git commit -m "変更内容"`
4. `git push origin main`
5. 自動デプロイ開始（数分で完了）

---

## 📞 よく使うコマンド

```bash
# 開発サーバー起動
npm run dev

# ビルドテスト
npm run build

# Firestoreルールのデプロイ
firebase deploy --only firestore:rules

# Gitの状態確認
git status

# 変更のコミット
git add .
git commit -m "変更内容"
git push origin main
```

---

## 🔗 重要なURL

- **ローカル開発**: http://localhost:3000
- **本番サイト**: https://l-apply.vercel.app
- **管理画面**: https://l-apply.vercel.app/admin
- **Firebase Console**: https://console.firebase.google.com/project/l-apply
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repo**: https://github.com/nobuking5501/L-Apply

---

## 💡 次回開発時のヒント

### 現在の状態（2025-11-21時点）
- ✅ フロントエンド: Vercelにデプロイ済み
- ✅ バックエンド: GitHub Actionsで自動デプロイ中
- ✅ サブスクリプション制限: 実装完了
- ⏳ イベントカウンタートリガー: コード準備完了、有効化は保留中

### 未実装・今後の課題
1. イベントカウンタートリガーの有効化
   - `functions/src/index.ts` でコメントアウト解除
2. 月次リセット機能（既存コードあり、スケジュール設定が必要）
3. Stripe連携の完全な動作確認

---

## 🆘 困った時は

1. **開発サーバーが起動しない**
   → プロセスを全部終了: `pkill -f "next dev"`
   → `npm run dev` で再起動

2. **ビルドエラー**
   → `.next` 削除: `rm -rf .next && npm run dev`

3. **デプロイが失敗**
   → GitHub Actionsログを確認: https://github.com/nobuking5501/L-Apply/actions

4. **ポート3000が使えない**
   → `lsof -ti:3000 | xargs kill -9`

---

最終更新: 2025-11-21
作成者: Claude Code
