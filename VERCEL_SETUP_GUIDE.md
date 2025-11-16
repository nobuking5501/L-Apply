# Vercel プロジェクト作成ガイド（完全版）

## ステップ1: Vercelにログイン

1. https://vercel.com にアクセス
2. 「Sign Up」または「Log In」をクリック
3. 「Continue with GitHub」を選択
4. GitHubアカウントでログイン・認証

## ステップ2: 新しいプロジェクトを作成

### 2-1. プロジェクト作成を開始

1. Vercelダッシュボード（https://vercel.com/dashboard）
2. 右上の「Add New...」ボタンをクリック
3. 「Project」を選択

### 2-2. GitHubリポジトリをインポート

**もし "Import Git Repository" が表示されない場合：**

1. 「Import Git Repository」の下の「Adjust GitHub App Permissions」をクリック
2. GitHubの認証画面で、`nobuking5501/L-Apply` リポジトリへのアクセスを許可
3. Vercelに戻る

**リポジトリを選択：**

1. 検索ボックスに「L-Apply」と入力
2. `nobuking5501/L-Apply` が表示されたら、「Import」をクリック

### 2-3. プロジェクト設定

以下の設定画面が表示されます：

```
Project Name: l-apply （自動で入力されます）
Framework Preset: Next.js （自動検出されます）
Root Directory: ./ （そのまま）
Build Command: npm run build （そのまま）
Output Directory: .next （そのまま）
Install Command: npm install （そのまま）
```

**全てデフォルトのままでOKです！**

### 2-4. 環境変数を追加

「Environment Variables」セクションを展開します。

以下の環境変数を**1つずつ**追加してください：

#### 追加方法
1. 「KEY」欄に変数名を入力
2. 「VALUE」欄に値を入力
3. 「Production」「Preview」「Development」**全てにチェック**
4. 「Add」ボタンをクリック

#### 環境変数リスト（コピペ用）

**1つ目:**
```
KEY: NEXT_PUBLIC_LIFF_ID
VALUE: 2008405494-nKEy7Pl0
```

**2つ目:**
```
KEY: NEXT_PUBLIC_APP_NAME
VALUE: L-Apply
```

**3つ目:**
```
KEY: NEXT_PUBLIC_APPLY_API_URL
VALUE: https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

**4つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_API_KEY
VALUE: AIzaSyD5R_EwSLznU1TZxPP3w8EHA1iopYDzhZI
```

**5つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
VALUE: l-apply.firebaseapp.com
```

**6つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_PROJECT_ID
VALUE: l-apply
```

**7つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
VALUE: l-apply.firebasestorage.app
```

**8つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
VALUE: 1076344687205
```

**9つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_APP_ID
VALUE: 1:1076344687205:web:313e0215b6defd2b11d48c
```

**10つ目:**
```
KEY: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
VALUE: G-KN8JRX4LN6
```

### 2-5. デプロイ開始

1. 全ての環境変数を追加したら、一番下の「Deploy」ボタンをクリック
2. ビルドが開始されます（1-2分待ちます）

### 2-6. デプロイ完了

✅ 「Congratulations!」が表示されたら成功です！

- 「Visit」ボタンをクリックしてアプリケーションを確認
- 表示されたURLをメモ（例: https://l-apply-xxx.vercel.app）

---

## トラブルシューティング

### 問題1: GitHubリポジトリが表示されない

**原因:** VercelにGitHubへのアクセス権限がない

**解決策:**
1. Vercel画面で「Adjust GitHub App Permissions」をクリック
2. GitHub側で「Configure」をクリック
3. 「Repository access」で「All repositories」または「Only select repositories」→ `L-Apply` を選択
4. 「Save」をクリック
5. Vercelに戻って再試行

### 問題2: ビルドが失敗する

**原因:** 環境変数が正しく設定されていない

**解決策:**
1. 環境変数が**10個全て**追加されているか確認
2. 各環境変数に「Production」「Preview」「Development」全てにチェックが入っているか確認
3. Vercel Dashboard → Settings → Environment Variables で確認
4. 問題があれば修正して、Deployments → Redeploy

### 問題3: デプロイは成功するがページが表示されない

**原因:** Firebase設定の問題

**解決策:**
1. ブラウザで F12 キーを押してコンソールを開く
2. エラーメッセージを確認
3. 環境変数の値が正しいか再確認

---

## 成功後の確認

デプロイが成功したら、以下を確認してください：

- [ ] トップページ（https://あなたのURL.vercel.app）が表示される
- [ ] ログインページ（/login）が表示される
- [ ] ダッシュボード（/dashboard）にアクセスできる（要ログイン）

---

## 次のステップ

✅ Vercelデプロイが成功したら、次は：

1. **LIFF Endpoint URLの更新**
   - LINE Developers Console でLIFFアプリのURLを更新

2. **動作確認**
   - LINEからLIFFアプリを開いて動作確認

詳細は `NEXT_STEPS.md` を参照してください。
