# 🚀 クイックスタートガイド

L-Apply を **30分で** セットアップする最短手順です。

## 📋 準備するもの

- [ ] LINE アカウント
- [ ] Firebase アカウント（Google アカウント）
- [ ] Node.js 20.x 以上
- [ ] Firebase CLI (`npm install -g firebase-tools`)

---

## ステップ 1: LINE Developers 設定（10分）

### 1.1 チャンネル作成

1. https://developers.line.biz/console/ にアクセス
2. 「作成」→ プロバイダー名入力（任意）→ 作成
3. 「新規チャンネル作成」→ 「Messaging API」
4. 必要事項を入力して作成

### 1.2 情報取得（メモ必須！）

**「チャンネル基本設定」タブ:**
- ✅ Channel Secret（「発行」ボタンを押す）

**「Messaging API設定」タブ:**
- ✅ Channel Access Token（「発行」ボタンを押す）
- ✅ QRコード（友だち追加用）

### 1.3 LIFF 作成

1. 「LIFF」タブ → 「追加」
2. 以下を入力：
   ```
   名前: L-Apply
   サイズ: Full
   エンドポイントURL: https://l-apply.web.app/liff/apply
   Scope: profile, openid
   ```
3. 作成後、✅ **LIFF ID** をメモ

### 1.4 Webhook 設定（後で戻ってくる）

「Messaging API設定」タブで：
- 応答メッセージ: **オフ**
- Webhook の利用: **オン**（デプロイ後に設定）

---

## ステップ 2: プロジェクトセットアップ（5分）

```bash
# プロジェクトディレクトリに移動
cd /path/to/L-Apply

# 依存関係インストール
npm install
cd functions && npm install && cd ..

# Firebase にログイン
firebase login

# 環境変数設定
cp .env.sample .env.local
```

`.env.local` を編集：
```env
NEXT_PUBLIC_LIFF_ID=YOUR_LIFF_ID
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

---

## ステップ 3: Firebase 設定（5分）

```bash
# Firebase Secrets 設定
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# → Channel Access Token を貼り付け

firebase functions:secrets:set LINE_CHANNEL_SECRET
# → Channel Secret を貼り付け

firebase functions:secrets:set LIFF_ID
# → LIFF ID を貼り付け
```

---

## ステップ 4: ビルド＆デプロイ（10分）

```bash
# ビルド
npm run build

# デプロイ
firebase deploy
```

デプロイが完了すると、以下の URL が表示されます：
```
✔ Deploy complete!

Hosting URL: https://l-apply.web.app
Functions:
  - apply: https://asia-northeast1-l-apply.cloudfunctions.net/apply
  - webhook: https://asia-northeast1-l-apply.cloudfunctions.net/webhook
```

---

## ステップ 5: LINE に戻って Webhook URL 設定（2分）

1. LINE Developers Console に戻る
2. 「Messaging API設定」タブ
3. **Webhook URL** を入力：
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```
4. 「検証」ボタンで接続確認 → 成功すれば OK！

---

## ステップ 6: リッチメニュー作成（5分）

### 方法A: LINE Official Account Manager（簡単）

1. https://manager.line.biz/ にアクセス
2. アカウント選択
3. 「リッチメニュー」→ 「作成」
4. テンプレート「大（1分割）」を選択
5. アクション設定:
   ```
   タイプ: リンク
   URL: https://liff.line.me/YOUR_LIFF_ID
   ```
6. 画像アップロード（2500x1686px または 2500x843px）
7. 「保存」→ 「適用」

### 方法B: デフォルトで開始（スキップ可）

リッチメニューなしでも動作します。
トーク画面で直接コマンドを送信できます。

---

## ステップ 7: 動作確認（3分）

### 7.1 友だち追加

1. LINE Developers Console の QRコードをスキャン
2. ボットを友だち追加

### 7.2 コマンドテスト

トーク画面で送信：
```
予約確認
```
→ 「現在、予約は登録されていません」と返信されればOK！

### 7.3 LIFF 申込テスト

1. リッチメニューをタップ（作成した場合）
2. 申込フォームが開く
3. フォーム入力・送信
4. 完了メッセージが届く

---

## 🎉 完成！

これで L-Apply が動作しています！

---

## 📚 次に読むべきドキュメント

| ドキュメント | 内容 | 推奨 |
|-------------|------|------|
| [LINE_SETUP_GUIDE.md](./LINE_SETUP_GUIDE.md) | LINE 詳細設定 | ⭐⭐⭐ |
| [README.md](./README.md) | システム概要 | ⭐⭐⭐ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 技術詳細 | ⭐⭐ |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | デプロイ詳細 | ⭐⭐ |

---

## ⚠️ トラブルシューティング

### Webhook が動作しない

```bash
# ログ確認
firebase functions:log --only webhook

# Webhook URL が正しいか確認
# → https://asia-northeast1-l-apply.cloudfunctions.net/webhook
```

### LIFF が開かない

- LIFF の Endpoint URL を確認
  - `https://l-apply.web.app/liff/apply`
- ブラウザの開発者ツールでエラー確認

### リマインドが送信されない

```bash
# リマインド Function のログ確認
firebase functions:log --only remind

# Firestore でデータ確認
# → reminders コレクションを確認
```

---

## 💡 よくある質問

**Q: テスト環境を作りたい**
```bash
# ステージング用 Firebase プロジェクトを作成
firebase projects:create l-apply-staging
firebase use --add
# → "staging" エイリアスで設定

# ステージングにデプロイ
firebase use staging
firebase deploy
```

**Q: ローカルで開発したい**
```bash
# エミュレーター起動
firebase emulators:start

# Next.js 開発サーバー
npm run dev
```

**Q: コストはどれくらい？**
- Firebase Hosting: 無料枠で十分
- Firebase Functions: 無料枠で月数千リクエスト
- Firestore: 無料枠で1日5万回読取
- LINE API: 無料

小規模なら完全無料で運用可能！

---

## 🔗 リンク集

- [LINE Developers Console](https://developers.line.biz/console/)
- [Firebase Console](https://console.firebase.google.com/)
- [LINE Official Account Manager](https://manager.line.biz/)
- [LINE Developers Community](https://www.line-community.me/)

---

**お疲れ様でした！** 🎊

問題があれば [LINE_SETUP_GUIDE.md](./LINE_SETUP_GUIDE.md) や [DEPLOYMENT.md](./DEPLOYMENT.md) を確認してください。
