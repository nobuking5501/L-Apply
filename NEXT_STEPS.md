# 🚀 次のステップ

Vercel移行の準備が完了しました！以下の順序で進めてください。

## ✅ 完了済み

- [x] 不要なCloud Functionsファイルを削除
- [x] Firebase設定を環境変数化
- [x] Vercel設定ファイルの作成
- [x] 移行手順書の作成
- [x] 変更をGitにプッシュ

## 📝 次に実行すること

### 1. GitHub Actionsの設定 ⏱️ 所要時間: 5分

1. **Firebase CI Tokenを生成**
   ```bash
   firebase login:ci
   ```
   表示されたトークンをコピー

2. **GitHubでワークフローを作成**
   - 詳細は `GITHUB_ACTIONS_SETUP.md` を参照
   - https://github.com/nobuking5501/L-Apply/actions
   - 「New workflow」から `.github/workflows/deploy-functions.yml` を作成

3. **GitHubシークレットに追加**
   - Settings → Secrets and variables → Actions
   - Name: `FIREBASE_TOKEN`
   - Secret: コピーしたトークン

### 2. Vercelプロジェクトのセットアップ ⏱️ 所要時間: 10分

1. **Vercelにログイン**: https://vercel.com

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - GitHubリポジトリ `nobuking5501/L-Apply` をインポート
   - Framework Preset: **Next.js**

3. **環境変数を設定**

   Vercelダッシュボード → Settings → Environment Variables

   以下をコピー＆ペーストして追加：

   ```env
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

   **重要**: 各環境変数を「Production」「Preview」「Development」全てにチェック！

4. **デプロイ**
   - 「Deploy」をクリック
   - 完了を待つ（通常1-2分）

### 3. LIFFアプリのエンドポイント更新 ⏱️ 所要時間: 3分

1. **LINE Developers Consoleを開く**
   - https://developers.line.biz/console/

2. **LIFFアプリを選択**
   - 該当のLIFFアプリ（ID: 2008405494-nKEy7Pl0）を選択

3. **Endpoint URLを更新**
   - 古い URL: `https://l-apply.web.app/liff/apply`
   - 新しい URL: `https://あなたのvercel-url.vercel.app/liff/apply`

   ※ Vercelのデプロイ完了後にURLが表示されます

4. **保存**

### 4. 動作確認 ⏱️ 所要時間: 10分

#### フロントエンド確認
- [ ] Vercel URLにアクセスして、ページが表示されるか確認
- [ ] ログイン/サインアップが動作するか確認
- [ ] ダッシュボードが表示されるか確認

#### LIFFアプリ確認
- [ ] LINEからLIFFアプリを開く
- [ ] イベント一覧が表示されるか確認
- [ ] 申込みができるか確認
- [ ] 完了メッセージが届くか確認

#### Cloud Functions確認
- [ ] GitHub Actionsのログを確認
  - https://github.com/nobuking5501/L-Apply/actions
- [ ] デプロイが成功しているか確認
- [ ] `firebase functions:list` で関数が表示されるか確認

## 📚 参考ドキュメント

- **詳細な移行手順**: `VERCEL_MIGRATION.md`
- **GitHub Actions設定**: `GITHUB_ACTIONS_SETUP.md`
- **環境変数サンプル**: `.env.local.example`

## 🆘 トラブルが発生したら

### Vercelデプロイが失敗する
1. 環境変数が全て設定されているか確認
2. Vercelのデプロイログを確認
3. ローカルで `npm run build` が成功するか確認

### LIFFアプリが動かない
1. Endpoint URLが正しいか確認
2. `NEXT_PUBLIC_LIFF_ID` が正しいか確認
3. ブラウザのコンソールでエラーを確認

### Cloud Functionsがデプロイされない
1. GitHub ActionsでFIREBASE_TOKENが設定されているか確認
2. ワークフローログを確認
3. `functions/` ディレクトリの変更をプッシュしているか確認

## 💡 今後のワークフロー

### フロントエンドの更新
```bash
git add .
git commit -m "Update frontend"
git push origin main
```
→ Vercelが自動デプロイ ✨

### Cloud Functionsの更新
```bash
git add functions/
git commit -m "Update functions"
git push origin main
```
→ GitHub Actionsが自動デプロイ ✨

## ✨ 完了！

全ての手順が完了したら、スムーズなデプロイ環境が整います！

問題が発生した場合は、各ドキュメントを参照してください。
