# Vercel デプロイ トラブルシューティング

## デプロイが失敗する場合

### チェックリスト

#### 1. プロジェクト設定の確認

Vercel Dashboard → Settings → General

- **Framework Preset**: Next.js
- **Root Directory**: `./` (空白またはルート)
- **Build Command**: `npm run build` (デフォルト)
- **Output Directory**: `.next` (デフォルト)
- **Install Command**: `npm install` (デフォルト)
- **Node.js Version**: 20.x (推奨)

#### 2. 環境変数の確認

Vercel Dashboard → Settings → Environment Variables

すべての環境変数が以下の条件を満たしているか確認：

- [ ] Production にチェック
- [ ] Preview にチェック
- [ ] Development にチェック

必要な環境変数（10個）：
- [ ] `NEXT_PUBLIC_LIFF_ID`
- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NEXT_PUBLIC_APPLY_API_URL`
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

#### 3. ビルドログの確認

Vercel Dashboard → Deployments → 失敗したデプロイをクリック → Building タブ

よくあるエラー：

**エラー1: "Module not found"**
```
解決策: package.json の dependencies を確認
```

**エラー2: "Build exceeded maximum duration"**
```
解決策:
1. Vercel Dashboard → Settings → General
2. Node.js Version を 20.x に設定
3. Redeploy
```

**エラー3: "Environment variable is not defined"**
```
解決策: 環境変数が全て設定されているか確認
```

**エラー4: "ENOENT: no such file or directory"**
```
解決策:
1. Root Directory が正しいか確認 (空白または ./)
2. .vercelignore を確認
```

### 手動再デプロイの手順

1. Vercel Dashboard → Deployments
2. 最新のデプロイの右側の「...」をクリック
3. 「Redeploy」をクリック
4. 「Redeploy」を再度クリック

### それでもダメな場合

#### A. キャッシュをクリアして再デプロイ

```bash
# ローカルで実行
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main
```

Vercel側で：
1. Settings → General
2. 「Clear Build Cache」をクリック
3. 再デプロイ

#### B. プロジェクトを削除して再作成

1. Vercel Dashboard → Settings → General
2. 一番下の「Delete Project」
3. 再度プロジェクトをインポート

#### C. vercel.json を簡素化

もし複雑な設定が原因の場合、シンプルにします：

`vercel.json` を以下に変更：

```json
{
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

そして再デプロイ。

### サポート情報の収集

問題が解決しない場合、以下の情報を確認してください：

1. **ビルドログの全文**
   - Vercel Dashboard → Deployments → 失敗したデプロイ → Building タブ
   - 全てコピーしてテキストファイルに保存

2. **環境変数のリスト**
   - Vercel Dashboard → Settings → Environment Variables
   - スクリーンショットを撮影

3. **プロジェクト設定**
   - Vercel Dashboard → Settings → General
   - スクリーンショットを撮影

## よくある質問

**Q: 環境変数を変更したのに反映されない**

A: 環境変数の変更後は必ず再デプロイが必要です。
   Deployments → 最新のデプロイ → ... → Redeploy

**Q: ローカルでは動くのにVercelで動かない**

A: 環境変数がVercelで設定されているか確認してください。
   `.env.local` の内容はVercelにアップロードされません。

**Q: デプロイは成功するが、ページが真っ白**

A: ブラウザのコンソールを開いて（F12）、エラーメッセージを確認してください。
   多くの場合、環境変数の設定漏れが原因です。
