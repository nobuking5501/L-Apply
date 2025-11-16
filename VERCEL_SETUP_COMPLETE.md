# Vercel セットアップ完了 - 次のステップ

## ✅ 完了したこと

- Vercelへのデプロイ成功
- URL: https://l-apply.vercel.app/
- 環境変数設定済み

---

## 🔧 次にやること（3ステップ）

### ステップ1: LINE LIFF の Endpoint URL を更新

**重要**: LIFFアプリがVercelを指すように変更します。

1. **LINE Developers Console を開く**
   - https://developers.line.biz/console/

2. **L-Apply チャンネルを選択**

3. **LIFF タブを開く**

4. **LIFF アプリの Endpoint URL を更新**
   - 現在: `https://l-apply.web.app/liff/apply`
   - **新しいURL**: `https://l-apply.vercel.app/liff/apply`

5. **保存** をクリック

---

### ステップ2: 動作確認

#### 2-1. Webサイトの確認

ブラウザで以下のURLにアクセス：

✅ **トップページ**
```
https://l-apply.vercel.app/
```
→ サイトが表示されればOK

✅ **ログインページ**
```
https://l-apply.vercel.app/login
```
→ ログインフォームが表示されればOK

#### 2-2. LIFF アプリの確認

1. **LINEアプリで友だち追加**
   - LINE Developers Console のQRコードをスキャン

2. **LIFF アプリを開く**
   - リッチメニューをタップ
   - または、友だち追加時に送られたリンクをタップ

3. **申込フォームが表示される**
   - ✅ フォームが正しく表示される
   - ✅ 日付選択ができる
   - ✅ プラン選択ができる

---

### ステップ3: Firebase Functions の設定（オプション）

**現在の状態**:
- フロントエンド（Next.js）: Vercelで動作中 ✅
- バックエンド（Firebase Functions）: まだ未デプロイ

**Functionsが必要な機能**:
- ✅ 申込処理（apply）
- ✅ LINEメッセージ受信（webhook）
- ✅ リマインド送信（remind）
- ✅ ステップ配信（deliverSteps）

#### オプションA: Firebase Functions を使う（従来通り）

```bash
# ローカルでテスト
firebase emulators:start

# デプロイ
firebase deploy --only functions
```

**課題**: デプロイ時にタイムアウトエラーが発生中

#### オプションB: Vercel Functions に移行（推奨）

Next.js API Routesを使ってVercelで全て完結させる方が簡単です。

---

## 📊 現在の状態

| 機能 | 状態 | URL |
|------|------|-----|
| フロントエンド | ✅ 動作中 | https://l-apply.vercel.app/ |
| LIFF申込フォーム | ⏳ URL更新待ち | https://l-apply.vercel.app/liff/apply |
| 管理画面 | ✅ 動作中 | https://l-apply.vercel.app/login |
| 申込API | ⏳ 未デプロイ | - |
| Webhook | ⏳ 未デプロイ | - |
| リマインド | ⏳ 未デプロイ | - |

---

## 🎯 推奨される次のアクション

### すぐにやること

1. **LIFF Endpoint URLを更新**（上記ステップ1）
2. **動作確認**（上記ステップ2）

### 今後の課題

- Firebase Functionsのデプロイ問題を解決
- または、Vercel Functionsに移行

---

**質問があれば教えてください！**
