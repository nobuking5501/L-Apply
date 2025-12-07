# Cloud Scheduler セットアップガイド

ブラウザで設定する簡単な方法です。

## 🔗 アクセス

https://console.cloud.google.com/cloudscheduler?project=l-apply

---

## 📝 ジョブ1: リマインダー送信

### 「スケジュールを作成」をクリック

以下の項目を**コピー&ペースト**してください：

```
名前（Name）:
remind-scheduler

リージョン（Region）:
asia-northeast1

説明（Description）:（任意）
Send reminder messages every 5 minutes

頻度（Frequency）:
*/5 * * * *

タイムゾーン（Timezone）:
Asia/Tokyo
```

### 「続行」をクリック

次の画面で：

```
ターゲットタイプ（Target type）:
HTTP

URL:
https://asia-northeast1-l-apply.cloudfunctions.net/remind

HTTPメソッド（HTTP method）:
POST

本文（Body）:（空欄のまま）
```

### 「続行」をクリック

認証設定：

```
認証ヘッダー（Auth header）:
Add OIDC token

サービスアカウント（Service account）:
l-apply@appspot.gserviceaccount.com
（ドロップダウンから選択、または自動で選ばれている）

対象ユーザー（Audience）:（任意）
https://asia-northeast1-l-apply.cloudfunctions.net/remind
```

### 「作成」をクリック

---

## 📝 ジョブ2: ステップ配信

### 再度「スケジュールを作成」をクリック

```
名前（Name）:
deliver-steps-scheduler

リージョン（Region）:
asia-northeast1

説明（Description）:（任意）
Deliver step messages every 5 minutes

頻度（Frequency）:
*/5 * * * *

タイムゾーン（Timezone）:
Asia/Tokyo
```

### 「続行」をクリック

```
ターゲットタイプ（Target type）:
HTTP

URL:
https://asia-northeast1-l-apply.cloudfunctions.net/deliverSteps

HTTPメソッド（HTTP method）:
POST

本文（Body）:（空欄のまま）
```

### 「続行」をクリック

```
認証ヘッダー（Auth header）:
Add OIDC token

サービスアカウント（Service account）:
l-apply@appspot.gserviceaccount.com

対象ユーザー（Audience）:（任意）
https://asia-northeast1-l-apply.cloudfunctions.net/deliverSteps
```

### 「作成」をクリック

---

## ✅ 完了確認

Cloud Schedulerの画面に2つのジョブが表示されます：

- ✅ remind-scheduler
- ✅ deliver-steps-scheduler

## 🧪 テスト実行

各ジョブの右側にある「...」（3点メニュー）→「今すぐ実行」をクリックすると、すぐにテストできます。

---

## 🔍 ログの確認

実行後、Firebase Consoleでログを確認：

https://console.firebase.google.com/project/l-apply/functions

「remind」または「deliverSteps」関数のログタブを見てください。

---

## ⚠️ トラブルシューティング

### エラー: "Cloud Scheduler API has not been used"

→ APIを有効にするボタンが表示されるので、クリックしてください。

### エラー: "Permission denied"

→ Google Cloudプロジェクトのオーナーまたは編集者権限が必要です。
   アカウントを確認してください。

### ジョブが作成できない

→ リージョンを「asia-northeast1」に設定しているか確認してください。

---

**作成日**: 2025-12-08
