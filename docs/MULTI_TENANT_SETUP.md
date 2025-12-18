# マルチテナント設定ガイド

L-Applyは真のマルチテナントSaaSとして、各組織が独自のLINE チャネルとLIFF IDを使用できます。

## 📋 目次

1. [既存顧客の方へ](#既存顧客の方へ)
2. [新規顧客のセットアップ](#新規顧客のセットアップ)
3. [トラブルシューティング](#トラブルシューティング)

---

## 既存顧客の方へ

### ✅ 変更の影響

**既存のLIFFアプリは引き続き動作します。変更は不要です。**

- 環境変数 `NEXT_PUBLIC_LIFF_ID` がフォールバックとして機能します
- 既存のEndpoint URLはそのまま使用できます
- 動作に影響はありません

### 🔄 新しい方式への移行（オプション）

将来的に各組織が独自のLIFF IDを持つことを推奨します：

1. **ダッシュボードの設定ページ**にLIFF IDを登録
2. **LINE DevelopersでEndpoint URLを更新**：
   ```
   https://l-apply.vercel.app/liff/apply?liffId=あなたのLIFF_ID
   ```

---

## 新規顧客のセットアップ

### 手順1: LINE Developersでチャネル作成

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. プロバイダーを作成（会社名など）
3. Messaging API チャネルを作成

### 手順2: Webhook設定

**Webhook URL**:
```
https://asia-northeast1-l-apply.cloudfunctions.net/webhook
```

設定方法：
1. LINE Developers Console → チャネル → Messaging API
2. 「Webhook設定」セクションを開く
3. Webhook URLに上記URLを入力
4. 「検証」ボタンをクリック
5. 「Webhookの利用」をONにする

### 手順3: LIFF アプリ作成

1. LINE Developers Console → チャネル → LIFF
2. 「追加」ボタンをクリック
3. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| **LIFF app name** | L-Apply申込フォーム（任意の名前） |
| **Size** | Full |
| **Endpoint URL** | `https://l-apply.vercel.app/liff/apply?liffId=【次のステップで取得】` |
| **Scope** | ✅ profile<br>✅ openid |
| **Bot link feature** | On |

4. 「作成」をクリック
5. **LIFF ID**をコピーする（例：`2008405494-nKEy7Pl0`）

### 手順4: Endpoint URLを更新

1. コピーしたLIFF IDを使ってEndpoint URLを完成させる：
   ```
   https://l-apply.vercel.app/liff/apply?liffId=2008405494-nKEy7Pl0
   ```
   ※ `2008405494-nKEy7Pl0` はあなたのLIFF IDに置き換えてください

2. LINE Developers Console → LIFF → 作成したLIFFアプリを選択
3. 「編集」をクリック
4. Endpoint URLを上記の完全なURLに更新
5. 「更新」をクリック

### 手順5: 認証情報を取得

以下の情報をコピーしてください：

| 情報 | 取得場所 |
|------|----------|
| **LINE Channel ID** | Messaging API → Basic settings |
| **LINE Channel Secret** | Messaging API → Basic settings |
| **Channel Access Token** | Messaging API → Messaging API settings → 「発行」ボタン |
| **LIFF ID** | LIFF → 作成したLIFFアプリ |

### 手順6: L-Applyダッシュボードで設定

1. [L-Apply ダッシュボード](https://l-apply.vercel.app/dashboard)にログイン
2. **設定**ページを開く
3. LINE連携設定セクションに以下を入力：
   - LINE Channel ID
   - LINE Channel Secret
   - LINE Channel Access Token
   - LIFF ID
4. 「設定を保存」をクリック

---

## 🔧 トラブルシューティング

### LIFF アプリが開かない

**症状**: LIFFアプリを開くとエラーが表示される

**原因と解決策**:

1. **LIFF IDが設定されていない**
   - Endpoint URLに `?liffId=xxx` が含まれているか確認
   - ダッシュボードの設定ページでLIFF IDが保存されているか確認

2. **LIFF IDが間違っている**
   - LINE Developers ConsoleでLIFF IDを再確認
   - コピー時にスペースや改行が含まれていないか確認

3. **Endpoint URLが間違っている**
   - 正しいURL: `https://l-apply.vercel.app/liff/apply?liffId=xxx`
   - `https` (SSL) が必須
   - `liffId` パラメータが必須

### Webhookが動作しない

**症状**: LINEメッセージに反応しない

**確認項目**:

1. Webhook URLが正しく設定されているか
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```

2. 「Webhookの利用」がONになっているか

3. 「検証」ボタンで接続テストが成功するか

### 申込が失敗する

**症状**: 申込ボタンを押してもエラーになる

**確認項目**:

1. ダッシュボードの設定ページで全ての認証情報が保存されているか
2. Channel Access Tokenが有効か（期限切れの場合は再発行）
3. イベントが公開されているか（アクティブになっているか）

---

## 📊 Endpoint URL一覧（クイックリファレンス）

### 既存顧客（環境変数を使用）
```
https://l-apply.vercel.app/liff/apply
```

### 新規顧客（URLパラメータを使用）
```
https://l-apply.vercel.app/liff/apply?liffId=あなたのLIFF_ID
```

### Webhook（全組織共通）
```
https://asia-northeast1-l-apply.cloudfunctions.net/webhook
```

---

## 🔐 セキュリティ

- LINE Channel Secret と Access Token は安全に管理してください
- これらの情報は他人と共有しないでください
- 定期的にAccess Tokenを再発行することを推奨します

---

## 💡 ベストプラクティス

1. **テスト環境を用意する**
   - 本番用と開発用で別のLINEチャネルを作成
   - 開発用チャネルでテストしてから本番に反映

2. **バックアップを取る**
   - LINE Developersの設定をスクリーンショットで保存
   - L-Applyダッシュボードの設定もバックアップ

3. **ドキュメントを参照する**
   - [LINE Developers ドキュメント](https://developers.line.biz/ja/docs/)
   - [LIFF 公式ガイド](https://developers.line.biz/ja/docs/liff/)

---

## ❓ サポート

問題が解決しない場合は、以下の情報を添えてサポートにお問い合わせください：

- 組織ID（ダッシュボードの設定ページに表示）
- エラーメッセージのスクリーンショット
- ブラウザのコンソールエラー（F12キーで確認）
- 発生した日時と状況

---

**最終更新**: 2025-12-18
**バージョン**: 1.0.0
