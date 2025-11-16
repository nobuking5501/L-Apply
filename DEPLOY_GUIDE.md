# L-Apply デプロイガイド（超簡単版）

このガイドでは、L-Applyを簡単にデプロイする方法を説明します。

## 🚀 クイックスタート

WSLを開いて、以下のコマンドを実行するだけです：

```bash
# Cloud Functionsのみデプロイ
deploy-functions

# Hostingのみデプロイ
deploy-hosting

# 全部デプロイ
deploy-all
```

**これだけです！** 自動的に同期してデプロイされます。

---

## 📋 詳細な手順

### 1. フロントエンド（Hosting）を更新する場合

```bash
# ① プロジェクトディレクトリに移動
cd /mnt/c/Users/user/Desktop/L-Apply

# ② ビルド
npm run build

# ③ デプロイ（WSLで）
deploy-hosting
```

**完了！** https://l-apply.web.app で確認できます。

---

### 2. バックエンド（Cloud Functions）を更新する場合

```bash
# ① functions/src/ 内のファイルを編集

# ② デプロイ（WSLで）
deploy-functions
```

**完了！** 関数が自動的に更新されます。

---

### 3. 両方を更新する場合

```bash
# ① プロジェクトディレクトリに移動
cd /mnt/c/Users/user/Desktop/L-Apply

# ② フロントエンドをビルド
npm run build

# ③ 全部デプロイ（WSLで）
deploy-all
```

**完了！** フロントエンドとバックエンドの両方が更新されます。

---

## 🔧 便利なコマンド

### エイリアス一覧

| コマンド | 説明 |
|---------|------|
| `deploy-functions` | Cloud Functionsのみデプロイ |
| `deploy-hosting` | Hostingのみデプロイ |
| `deploy-all` | 全部デプロイ |
| `cd-lapply` | L-Applyプロジェクトディレクトリへ移動 |

### その他の便利コマンド

```bash
# デプロイされている関数の一覧を表示
firebase functions:list

# 関数のログを確認
firebase functions:log --only apply

# Firestoreのデータを確認
firebase firestore:data
```

---

## 🐛 トラブルシューティング

### エイリアスが見つからない

WSLを再起動するか、以下を実行：

```bash
source ~/.bashrc
```

### デプロイが失敗する

#### エラー: "npm run build を実行してください"

フロントエンドのビルドが必要です：

```bash
cd /mnt/c/Users/user/Desktop/L-Apply
npm run build
```

その後、再度デプロイ。

#### エラー: "認証エラー"

Firebaseに再ログイン：

```bash
firebase login
```

#### エラー: "Cannot find module"

Functionsの依存関係を再インストール：

```bash
cd ~/l-apply-temp/functions
rm -rf node_modules
npm ci
```

その後、再度デプロイ。

---

## 📁 プロジェクト構造

```
L-Apply/
├── app/                    # Next.jsのページ
├── components/             # Reactコンポーネント
├── functions/              # Cloud Functions
│   ├── src/               # TypeScriptソースコード
│   │   ├── apply-prod.ts      # 申込処理
│   │   ├── webhook-prod.ts    # LINEメッセージ受信
│   │   ├── remind-prod.ts     # リマインダー送信
│   │   └── deliver-steps-prod.ts  # ステップ配信
│   ├── package.json
│   └── .env               # 環境変数（Git除外）
├── lib/                    # ユーティリティ
├── out/                    # ビルド済みファイル（自動生成）
└── firebase.json           # Firebase設定
```

---

## 🔐 環境変数

### Functions (.env)

`functions/.env` に以下を設定：

```env
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx
LIFF_ID=xxx
APP_BASE_URL=https://l-apply.web.app
ORGANIZATION_ID=org_xxx
```

### Next.js (.env.local)

`.env.local` に以下を設定：

```env
NEXT_PUBLIC_LIFF_ID=xxx
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
# ... その他Firebase設定
```

---

## ✅ デプロイ成功の確認

### フロントエンド

- https://l-apply.web.app にアクセス
- ページが正しく表示されることを確認

### Cloud Functions

```bash
firebase functions:list
```

以下が表示されればOK：
- apply
- webhook
- remind
- deliverSteps

### LINEアプリ

1. LINEアプリを開く
2. LIFFアプリ（セミナー申込）を開く
3. イベントが表示される
4. 申込みができる
5. 完了メッセージが届く

---

## 🎯 よくある作業フロー

### 新機能を追加する

```bash
# 1. コードを編集（VS Codeなどで）

# 2. フロントエンドの場合
cd /mnt/c/Users/user/Desktop/L-Apply
npm run build
deploy-hosting

# 3. バックエンドの場合
deploy-functions
```

### バグ修正

```bash
# 1. 修正箇所を特定（ログ確認）
firebase functions:log --only apply

# 2. コードを修正

# 3. デプロイ
deploy-functions

# 4. 確認
firebase functions:log --only apply
```

---

## 📞 サポート

問題が発生した場合：

1. このガイドのトラブルシューティングを確認
2. Firebase Consoleでログを確認
   - https://console.firebase.google.com/project/l-apply/overview
3. GitHub Issuesで質問
   - https://github.com/nobuking5501/L-Apply/issues

---

## 🎓 参考リンク

- Firebase Console: https://console.firebase.google.com/project/l-apply
- LINE Developers Console: https://developers.line.biz/console/
- Firebase Functions ドキュメント: https://firebase.google.com/docs/functions
- Next.js ドキュメント: https://nextjs.org/docs

---

## 💡 Tips

### デプロイ前のチェックリスト

- [ ] コードのビルドエラーがない
- [ ] 環境変数が正しく設定されている
- [ ] .envファイルをGitにコミットしていない
- [ ] ローカルでテストが通る

### デプロイ後のチェックリスト

- [ ] フロントエンドが表示される
- [ ] Cloud Functionsがデプロイされている（`firebase functions:list`）
- [ ] LINEアプリで動作確認
- [ ] エラーログを確認（`firebase functions:log`）

---

**🎉 これで完璧にデプロイできます！**
