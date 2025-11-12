# 現在の設定状況

## ✅ 設定済み

```
Channel ID: 2008405467
Channel Secret: 9182d8af6435ce79b43d2522cbad08d4
Channel Access Token: TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=
```

## ⚠️ あと1つだけ必要！

### LIFF ID の取得

LINE Developers Console で LIFF アプリを作成してください。

**手順:**

1. https://developers.line.biz/console/ にアクセス
2. あなたのチャンネル（Channel ID: **2008405467**）を選択
3. **「LIFF」** タブを開く
4. **「追加」** をクリック
5. 以下を入力：
   ```
   LIFFアプリ名: L-Apply
   サイズ: Full
   エンドポイントURL: https://l-apply.web.app/liff/apply
   Scope: ☑ profile, ☑ openid
   ボットリンク機能: オフのまま
   ```
6. **「追加」** をクリック
7. 作成された **LIFF ID**（例: 1234567890-abcdefgh）をコピー

---

## 🚀 セットアップコマンド（LIFF ID 取得後に実行）

### ステップ1: 依存関係のインストール

```bash
cd /mnt/c/Users/user/Desktop/L-Apply
npm install
cd functions && npm install && cd ..
```

### ステップ2: LIFF ID を設定

取得した LIFF ID を以下の2ファイルに設定してください：

#### 2-1. `.env.local` を編集

```bash
nano .env.local
# または任意のエディタで開く
```

`YOUR_LIFF_ID_HERE` を実際の LIFF ID に置き換え：

```env
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh  # ← 実際のLIFF IDに置き換え
NEXT_PUBLIC_APP_NAME=L-Apply
NEXT_PUBLIC_APPLY_API_URL=https://asia-northeast1-l-apply.cloudfunctions.net/apply
```

#### 2-2. `functions/.env` を編集

```bash
nano functions/.env
# または任意のエディタで開く
```

`YOUR_LIFF_ID_HERE` を実際の LIFF ID に置き換え：

```env
LINE_CHANNEL_ACCESS_TOKEN=TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=9182d8af6435ce79b43d2522cbad08d4
LIFF_ID=1234567890-abcdefgh  # ← 実際のLIFF IDに置き換え
APP_BASE_URL=https://l-apply.web.app
```

### ステップ3: Firebase Secrets の設定（本番環境用）

```bash
# Channel Access Token
echo "TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=" | firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN

# Channel Secret
echo "9182d8af6435ce79b43d2522cbad08d4" | firebase functions:secrets:set LINE_CHANNEL_SECRET

# LIFF ID（取得後に実行）
echo "YOUR_LIFF_ID_HERE" | firebase functions:secrets:set LIFF_ID
```

または対話的に入力：

```bash
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
# プロンプトで: TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=

firebase functions:secrets:set LINE_CHANNEL_SECRET
# プロンプトで: 9182d8af6435ce79b43d2522cbad08d4

firebase functions:secrets:set LIFF_ID
# プロンプトで: YOUR_LIFF_ID（実際のIDに置き換え）
```

### ステップ4: テスト実行

```bash
cd functions
npm test
cd ..
```

### ステップ5: ビルド

```bash
npm run build
```

### ステップ6: デプロイ

```bash
firebase deploy
```

デプロイが完了すると、以下が表示されます：

```
✔ Deploy complete!

Hosting URL: https://l-apply.web.app
Functions:
  - apply: https://asia-northeast1-l-apply.cloudfunctions.net/apply
  - webhook: https://asia-northeast1-l-apply.cloudfunctions.net/webhook
  - remind: (scheduled)
```

### ステップ7: LINE Webhook URL の設定

1. LINE Developers Console に戻る
2. チャンネル（Channel ID: **2008405467**）を選択
3. **「Messaging API設定」** タブ
4. **Webhook URL** を設定：
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```
5. **「検証」** ボタンで接続確認
6. **「Webhookの利用」** を **オン** に設定
7. **「応答メッセージ」** を **オフ** に設定（重要！）

---

## 📝 チェックリスト

- [x] Channel ID を取得
- [x] Channel Secret を取得
- [x] Channel Access Token を取得
- [ ] LIFF アプリを作成して LIFF ID を取得 ← **これだけ残っています**
- [ ] 依存関係をインストール
- [ ] .env.local に LIFF ID を設定
- [ ] functions/.env に LIFF ID を設定
- [ ] Firebase Secrets を設定
- [ ] テスト実行
- [ ] ビルド
- [ ] デプロイ
- [ ] Webhook URL を設定
- [ ] Webhook の利用をオン
- [ ] 応答メッセージをオフ
- [ ] 動作確認

---

## 🎯 動作確認

すべて完了したら：

1. **QRコードで友だち追加**
   - LINE Developers Console の「Messaging API設定」タブ
   - QRコードをスキャン

2. **コマンドテスト**
   ```
   トークで「予約確認」と送信
   → 「現在、予約は登録されていません」と返信される
   ```

3. **LIFF 申込テスト**（リッチメニュー作成後）
   - リッチメニューをタップ
   - フォーム入力・送信
   - 完了メッセージ受信

---

## 📞 次のステップ

LIFF ID を取得したら、以下のコマンドを実行してください：

```bash
# プロジェクトディレクトリに移動
cd /mnt/c/Users/user/Desktop/L-Apply

# セットアップ開始
npm install
```

**LIFF ID を取得したら教えてください！一緒にセットアップを進めます。** 🚀
