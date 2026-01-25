# 申込エラー診断ガイド

組織ID: `org_XOVcuVO7o6Op6idItDHsqiBgdBD3`
LIFF ID: `2008813377-giAgrmJV`

## 🔍 エラーの原因を特定する方法

申込ボタンを押した時にエラーが出る場合、以下の3つの方法でエラーの詳細を確認できます。

---

## 方法1: Firebase Consoleでログを確認（最も確実）

### 手順：

1. **Firebase Console にアクセス**
   https://console.firebase.google.com/

2. **プロジェクトを選択**
   `l-apply` プロジェクトをクリック

3. **Functions → Logs を開く**
   - 左メニューの「Functions」をクリック
   - 「apply」関数を探す
   - 「ログ」タブをクリック

4. **最新のエラーを確認**
   - 赤色で表示されているエラーログを探す
   - エラーメッセージを確認

### よくあるエラーと原因：

| ログに表示されるエラー | 原因 | 解決方法 |
|-------------------|------|---------|
| `Invalid ID token` または `ID token verification failed` | LINE Channel Access Tokenが未設定または無効 | `/dashboard/settings` から正しいAccess Tokenを設定 |
| `Application already exists for this slot` | 重複申込 | `/dashboard/applications` から既存の申込をキャンセル |
| `Slot is full` | 予約枠が満席 | `/dashboard/events` から定員を増やす |
| `Application limit reached` | 申込上限に達している | `/dashboard/subscription` からプランをアップグレード |

---

## 方法2: ブラウザの開発者ツールで確認

### 手順：

1. **PCでLIFF URLを開く**
   https://liff.line.me/2008813377-giAgrmJV

2. **開発者ツールを開く**
   - Windowsの場合: `F12` キーを押す
   - Macの場合: `Cmd + Option + I`

3. **Consoleタブを確認**
   - エラーメッセージが赤色で表示されます

4. **Networkタブを確認**
   - 申込ボタンを押す
   - `apply` というリクエストを探す
   - クリックして「Response」タブを見る
   - エラーメッセージが表示されます

### エラーレスポンスの例：

```json
{
  "error": "Invalid ID token",
  "message": "LINE認証に失敗しました。もう一度お試しください。"
}
```

---

## 方法3: LINE公式アカウントで実際のエラーメッセージを確認

申込ボタンを押した後、画面に表示されるエラーメッセージを確認してください。

### エラーメッセージと原因：

| 表示されるメッセージ | 原因 | HTTPステータス |
|-------------------|------|--------------|
| `LINE認証に失敗しました` | ID Token検証エラー | 401 |
| `すでにこの日時で申込済みです` | 重複申込 | 409 |
| `選択された日時は満席です` | 予約枠満席 | 409 |
| `今月の申込上限に達しています` | サブスクリプション上限 | 403 |
| `サーバーエラーが発生しました` | その他のエラー | 500 |

---

## 🔧 原因別の解決方法

### 1. LINE認証エラー (401)

**原因:** `organization_secrets` の `lineChannelAccessToken` が未設定または無効

**解決方法:**
1. 管理ダッシュボードにログイン
2. `/dashboard/settings` → LINE連携設定
3. 正しい Channel Access Token を入力
4. 保存

**Channel Access Tokenの取得方法:**
1. LINE Developers Console にログイン
2. プロバイダーとチャネルを選択
3. 「Messaging API」タブ
4. 「チャネルアクセストークン」をコピー

---

### 2. 重複申込エラー (409)

**原因:** 同じユーザーが同じ日時で既に申込済み

**解決方法:**
1. `/dashboard/applications` を開く
2. 該当ユーザーの申込を検索
3. 「キャンセル」ボタンをクリック
4. 再度申込を試してもらう

---

### 3. 予約枠満席エラー (409)

**原因:** 選択された予約枠の定員に達している

**解決方法:**
1. `/dashboard/events` を開く
2. イベントを編集
3. 予約枠の定員を増やす、または新しい予約枠を追加
4. 保存

---

### 4. 申込上限エラー (403)

**原因:** サブスクリプションの月間申込数上限に達している

**解決方法:**
1. `/dashboard/subscription` を開く
2. プランをアップグレード
3. または、月が変わるのを待つ

---

## 📊 データベースを直接確認する

### Firestore Console で確認：

1. https://console.firebase.google.com/ にアクセス
2. プロジェクト `l-apply` を選択
3. 左メニュー「Firestore Database」をクリック

### 確認すべきコレクション：

#### `organization_secrets/org_XOVcuVO7o6Op6idItDHsqiBgdBD3`
```
✓ lineChannelAccessToken: <長い文字列>
✓ lineChannelSecret: <長い文字列>
```
→ これらが設定されていない場合、ID Token検証エラーが発生

#### `events` (organizationId = org_XOVcuVO7o6Op6idItDHsqiBgdBD3)
```
✓ isActive: true
✓ slots: [...]
```
→ アクティブなイベントがない場合、「イベントがありません」エラー

#### `applications` (最近の申込)
```
userId: <LINE User ID>
slotAt: <Timestamp>
status: 'applied' または 'canceled'
```
→ 同じユーザー・同じ日時の申込があると重複エラー

#### `subscriptions` (organizationId = org_XOVcuVO7o6Op6idItDHsqiBgdBD3)
```
applicationLimit: 100
currentApplicationCount: 50
```
→ currentApplicationCount >= applicationLimit の場合、上限エラー

---

## 🚀 次のステップ

エラーの詳細が分かったら、以下の情報を共有してください：

1. **Firebaseログのエラーメッセージ**（スクリーンショット）
2. **ブラウザConsoleのエラー**（スクリーンショット）
3. **画面に表示されるエラーメッセージ**

これらがあれば、より具体的な解決策を提示できます。
