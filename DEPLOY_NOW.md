# 🚀 デプロイコマンド集

すべての環境変数が設定されました！以下のコマンドを順番に実行してください。

## ✅ 取得済みの情報

```
✓ Channel ID: 2008405467
✓ Channel Secret: 9182d8af6435ce79b43d2522cbad08d4
✓ Channel Access Token: 取得済み
✓ LIFF ID: 2008405494-nKEy7Pl0
✓ LIFF URL: https://liff.line.me/2008405494-nKEy7Pl0
```

環境変数ファイルも更新済みです：
- ✓ `.env.local`
- ✓ `functions/.env`

---

## 📋 デプロイ手順（コピペで実行）

### ステップ1: プロジェクトディレクトリに移動

```bash
cd /mnt/c/Users/user/Desktop/L-Apply
```

### ステップ2: 依存関係のインストール

```bash
# ルートディレクトリ
npm install

# Functions ディレクトリ
cd functions
npm install
cd ..
```

**所要時間**: 2-3分

### ステップ3: Firebase Secrets の設定（本番環境用）

```bash
# Channel Access Token
echo "TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=" | firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN

# Channel Secret
echo "9182d8af6435ce79b43d2522cbad08d4" | firebase functions:secrets:set LINE_CHANNEL_SECRET

# LIFF ID
echo "2008405494-nKEy7Pl0" | firebase functions:secrets:set LIFF_ID
```

**所要時間**: 1分

**注意**: エラーが出る場合は、対話的に入力してください：

```bash
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# プロンプトで: TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=

firebase functions:secrets:set LINE_CHANNEL_SECRET
# プロンプトで: 9182d8af6435ce79b43d2522cbad08d4

firebase functions:secrets:set LIFF_ID
# プロンプトで: 2008405494-nKEy7Pl0
```

### ステップ4: テスト実行（オプション）

```bash
cd functions
npm test
cd ..
```

**所要時間**: 30秒

### ステップ5: ビルド

```bash
npm run build
```

**所要時間**: 1-2分

### ステップ6: Firebase にデプロイ 🚀

```bash
firebase deploy
```

**所要時間**: 5-10分

デプロイが完了すると、以下のような出力が表示されます：

```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/l-apply/overview
Hosting URL: https://l-apply.web.app

Functions:
  - apply(asia-northeast1): https://asia-northeast1-l-apply.cloudfunctions.net/apply
  - webhook(asia-northeast1): https://asia-northeast1-l-apply.cloudfunctions.net/webhook
  - remind(asia-northeast1): (scheduled)
```

---

## ⚙️ デプロイ後の設定

### ステップ7: LINE Webhook URL を設定

1. **LINE Developers Console** にアクセス
   - https://developers.line.biz/console/

2. **Messaging API チャンネル**（Channel ID: **2008405467**）を選択

3. **「Messaging API設定」タブ** を開く

4. **Webhook URL** を設定：
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```

5. **「更新」** をクリック

6. **「検証」** ボタンで接続確認 → 「成功」と表示される

7. **設定を確認**：
   ```
   ✅ Webhookの利用: オン（緑色）
   ✅ 応答メッセージ: オフ（グレー）
   ✅ あいさつメッセージ: オフ（推奨）
   ```

---

## 🎯 動作確認

### ステップ8: ボットを友だち追加

1. LINE Developers Console の「Messaging API設定」タブ
2. **QRコード** をスキャン
3. ボットを友だち追加

### ステップ9: コマンドテスト

トーク画面で送信：

```
予約確認
```

**期待される返信**：
```
現在、予約は登録されていません
```

### ステップ10: LIFF アプリテスト

1. **リッチメニューを作成**（後述）

または

2. **ブラウザで直接アクセス**：
   ```
   https://liff.line.me/2008405494-nKEy7Pl0
   ```

3. **フォームに入力**：
   - プラン: ベーシックプラン
   - 日時: 5分後の日時
   - 備考: テスト
   - リマインダー: チェック

4. **送信**

5. **完了メッセージ** がトークに届くことを確認

---

## 📱 リッチメニューの作成（オプション）

### LINE Official Account Manager で作成

1. https://manager.line.biz/ にアクセス

2. アカウントを選択

3. 「リッチメニュー」→ 「作成」

4. 設定：
   ```
   タイトル: 申込メニュー
   表示期間: 常に表示
   テンプレート: 大（1分割）
   アクション: リンク
   URL: https://liff.line.me/2008405494-nKEy7Pl0
   ```

5. 画像をアップロード（2500x1686px または 2500x843px）

6. 「保存」→ 「適用」

---

## ⚠️ トラブルシューティング

### エラー1: `npm install` でエラー

```bash
# Node.js のバージョン確認
node -v
# 20.x 以上が必要

# バージョンが古い場合はアップデート
```

### エラー2: Firebase Secrets 設定でエラー

```bash
# Firebase CLI が最新か確認
firebase --version

# 古い場合はアップデート
npm install -g firebase-tools

# ログイン状態を確認
firebase login
```

### エラー3: デプロイでエラー

```bash
# ログを確認
firebase functions:log

# Secrets が正しく設定されているか確認
firebase functions:secrets:access LINE_CHANNEL_ACCESS_TOKEN
```

### エラー4: Webhook 検証が失敗

- Firebase Functions がデプロイされているか確認
- URL が正確か確認（コピペミスがないか）
- Functions のログでエラー確認：`firebase functions:log --only webhook`

### エラー5: LIFF が開かない

- LIFF の Endpoint URL を確認：`https://l-apply.web.app/liff/apply`
- Firebase Hosting がデプロイされているか確認
- ブラウザの開発者ツールでエラー確認

---

## 📊 監視とログ

### Functions のログを確認

```bash
# リアルタイムログ
firebase functions:log

# 特定の Function のログ
firebase functions:log --only apply
firebase functions:log --only webhook
firebase functions:log --only remind
```

### Firebase Console で確認

- https://console.firebase.google.com/project/l-apply/functions
- 実行回数、エラー率、実行時間を確認

---

## 🎉 完了！

すべての手順が完了すると：

- ✅ LIFF で申込ができる
- ✅ 申込完了メッセージが届く
- ✅ リマインドが自動送信される
- ✅ Webhook コマンドが動作する

---

## 📞 次のステップ

1. **リッチメニューを作成**
2. **本番運用開始**
3. **ユーザーフィードバックを収集**

お疲れ様でした！🎊
