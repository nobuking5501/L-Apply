# 開発ガイドライン - エラー再発防止策

このドキュメントは、今後同様のエラーを防ぐための開発ガイドラインです。

---

## 🚨 今回発生したエラーと原因

### 1. Vercelビルドエラー: モジュールが見つからない

**エラー:**
```
Module not found: Can't resolve '@/functions/src/utils/admin-firestore'
```

**根本原因:**
- Next.js (app/) と Firebase Functions (functions/) が別々のプロジェクトとして扱われる
- Vercelでのビルド時に functions/ ディレクトリにアクセスできない
- tsconfig.jsonの `@/` は app/ や lib/ を指すが、functions/ は含まれない

**解決策:**
- functions/ の共通コードを lib/ に移動・再実装
- Next.js側で必要なパッケージ（firebase-admin）をインストール

---

### 2. GitHub Actions: Service Account権限エラー

**エラー:**
```
Missing permissions required for functions deploy.
You must have permission iam.serviceAccounts.ActAs on service account
```

**根本原因:**
- Firebase service accountに "Service Account User" ロールが付与されていない
- GitHub Actionsからの Functions デプロイに必要な権限が不足

**解決策:**
1. Firebase Consoleで権限を追加する
2. または、より権限の強いService Accountを使用する

---

## ✅ 今後のエラー防止策

### 1. プロジェクト構造の原則

#### **Next.js (app/) と Firebase Functions (functions/) は完全に分離**

```
L-Apply/
├── app/              # Next.js (Vercel にデプロイ)
│   └── api/         # Next.js API Routes
├── functions/        # Firebase Functions (Firebase にデプロイ)
│   └── src/         # Cloud Functions コード
└── lib/              # 共通ユーティリティ (両方で使用可能)
```

**ルール:**
- ❌ app/ から functions/ を直接インポートしない
- ❌ functions/ から app/ を直接インポートしない
- ✅ 共通コードは lib/ に配置
- ✅ 各環境で必要なパッケージを個別にインストール

---

### 2. インポートパスのルール

#### **許可されるインポート:**

```typescript
// ✅ OK: Next.js API Route から lib/ をインポート
import { getOrganizationAdmin } from '@/lib/admin-firestore';

// ✅ OK: Cloud Functions から functions/src/ をインポート
import { getDb } from './utils/firestore';

// ✅ OK: lib/ 内で必要なパッケージをインポート
import { getFirestore } from 'firebase-admin/firestore';
```

#### **禁止されるインポート:**

```typescript
// ❌ NG: Next.js API Route から functions/ をインポート
import { something } from '@/functions/src/utils/admin-firestore';

// ❌ NG: 存在しないパスをインポート
import { something } from '../../../some/deep/path';
```

---

### 3. 依存関係の管理

#### **パッケージインストールのルール:**

```bash
# Next.js (Vercel用) の依存関係
cd /path/to/L-Apply
npm install <package-name>

# Firebase Functions の依存関係
cd /path/to/L-Apply/functions
npm install <package-name>
```

#### **firebase-admin の扱い:**
- `functions/package.json` に必須（Cloud Functions用）
- `package.json` にも必要（Next.js API Routesで使う場合）

---

### 4. ビルド前のチェックリスト

#### **デプロイ前に必ず実行:**

```bash
# 1. Next.jsのビルドテスト
npm run build

# 2. Firebase Functionsのビルドテスト
cd functions && npm run build

# 3. インポートエラーのチェック
grep -r "@/functions" app/  # 何も出力されないこと

# 4. 依存関係の確認
npm list firebase-admin       # Next.js用
cd functions && npm list firebase-admin  # Functions用
```

---

### 5. GitHub Actions設定のルール

#### **必要な権限:**

Firebase Functions をデプロイする際は、Service Account に以下のロールが必要：

1. **Cloud Functions Developer** - Functions のデプロイ
2. **Service Account User** - Service Account として動作
3. **Cloud Build Service Account** - ビルドの実行

#### **設定方法:**

Firebase Console → プロジェクト設定 → サービスアカウント → IAM で権限を追加

または、GitHub Secrets の `FIREBASE_SERVICE_ACCOUNT` を更新して、適切な権限を持つService Accountを使用する

---

### 6. コード変更時の影響確認

#### **変更前にチェック:**

| 変更内容 | 確認事項 |
|---------|---------|
| lib/ に新規ファイル追加 | Next.js と Functions 両方でビルド可能か |
| app/ に新規APIルート追加 | functions/ からインポートしていないか |
| functions/ に新規関数追加 | app/ からインポートしていないか |
| パッケージを追加 | 正しいディレクトリでインストールしたか |

---

### 7. エラー発生時のデバッグ手順

#### **"Module not found" エラーの場合:**

```bash
# 1. インポートパスを確認
grep -r "<エラーのモジュールパス>" .

# 2. tsconfig.json の paths を確認
cat tsconfig.json | grep -A 5 "paths"

# 3. node_modules を確認
ls node_modules/<パッケージ名>

# 4. 必要に応じて再インストール
rm -rf node_modules package-lock.json
npm install
```

#### **"Permission denied" エラーの場合:**

```bash
# 1. GitHub Secrets を確認
# GitHub リポジトリ → Settings → Secrets and variables → Actions

# 2. Firebase Console で権限を確認
# https://console.firebase.google.com/project/<project-id>/settings/iam

# 3. Service Account のロールを確認
gcloud projects get-iam-policy <project-id>
```

---

### 8. CI/CD パイプラインの改善

#### **推奨する追加チェック:**

`.github/workflows/deploy-functions.yml` に以下を追加：

```yaml
- name: Check import paths
  run: |
    if grep -r "@/functions" app/; then
      echo "Error: Found forbidden import from app/ to functions/"
      exit 1
    fi

- name: Verify dependencies
  run: |
    npm list firebase-admin || echo "Warning: firebase-admin not in main project"
    cd functions && npm list firebase-admin || exit 1
```

---

## 📋 開発フローの標準化

### **新機能開発時の標準フロー:**

1. **設計段階**
   - ✅ どこにコードを配置するか決定（app/、functions/、lib/）
   - ✅ 必要な依存関係を確認

2. **実装段階**
   - ✅ コードを書く
   - ✅ ローカルでビルドテスト
   - ✅ インポートパスをチェック

3. **コミット前**
   - ✅ `npm run build` 実行
   - ✅ `cd functions && npm run build` 実行
   - ✅ エラーがないことを確認

4. **プッシュ後**
   - ✅ GitHub Actions のログを確認
   - ✅ Vercel のデプロイ状況を確認

---

## 🔗 関連リンク

- [Next.js ドキュメント - Module Resolution](https://nextjs.org/docs/app/api-reference/next-config-js/resolving)
- [Firebase Functions デプロイガイド](https://firebase.google.com/docs/functions/get-started)
- [Google Cloud IAM ロール](https://cloud.google.com/iam/docs/understanding-roles)

---

## 📞 トラブルシューティング

問題が発生した場合：

1. このガイドラインを確認
2. エラーメッセージを検索
3. GitHub Actions / Vercel のログを確認
4. 必要に応じて依存関係を再インストール

---

**最終更新**: 2025-11-30
**作成者**: Claude Code
