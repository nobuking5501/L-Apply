# Vercel クイックセットアップ（5分版）

問題が発生した場合は、この手順でプロジェクトを再作成してください。

## 🚀 手順

### 1. Vercel にログイン
https://vercel.com → GitHub でログイン

### 2. 新しいプロジェクト作成
1. 「Add New...」→「Project」
2. `L-Apply` を検索
3. 「Import」をクリック

### 3. プロジェクト設定
**全てデフォルトのままでOK！**
- Framework: Next.js
- Root Directory: ./
- Build Command: npm run build
- Output Directory: .next

### 4. 環境変数を追加（最重要）

以下を**コピペ**して、1行ずつ追加：

```
NEXT_PUBLIC_LIFF_ID=2008405494-nKEy7Pl0
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=l-apply.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=l-apply
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=l-apply.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1076344687205
NEXT_PUBLIC_FIREBASE_APP_ID=1:1076344687205:web:313e0215b6defd2b11d48c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-KN8JRX4LN6
```

**追加方法:**
- 左に「KEY」（例: NEXT_PUBLIC_LIFF_ID）
- 右に「VALUE」（例: 2008405494-nKEy7Pl0）
- Production, Preview, Development **全てチェック**
- 「Add」をクリック

**これを10回繰り返します**

### 5. デプロイ
「Deploy」ボタンをクリック → 1-2分待つ

### 6. 確認
✅ 成功したら「Visit」をクリックしてサイトを確認

---

## ❌ よくあるミス

- 環境変数の追加漏れ（10個全て必要）
- Production, Preview, Development のチェック漏れ
- 値のコピペミス（スペースや改行が入らないように）

## ✅ 成功の確認

デプロイ後、以下のURLにアクセスして確認：

- `https://あなたのURL.vercel.app` → トップページが表示される
- `https://あなたのURL.vercel.app/login` → ログインページが表示される

両方とも表示されればOKです！
