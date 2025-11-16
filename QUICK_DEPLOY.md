# ⚡ クイックデプロイ

最も早くデプロイする方法です。

## 🚀 デプロイコマンド（WSLで実行）

### Cloud Functionsのみ

```bash
deploy-functions
```

### Hostingのみ

```bash
# 先にビルド（Windowsで）
cd /mnt/c/Users/user/Desktop/L-Apply
npm run build

# デプロイ（WSLで）
deploy-hosting
```

### 全部

```bash
# 先にビルド（Windowsで）
cd /mnt/c/Users/user/Desktop/L-Apply
npm run build

# デプロイ（WSLで）
deploy-all
```

---

## 🔄 再起動後の手順

### 1回だけ実行（初回のみ）

```bash
source ~/.bashrc
```

これでエイリアスが使えるようになります。

---

## ✅ 確認

```bash
# 関数が正しくデプロイされているか確認
firebase functions:list

# ログを確認
firebase functions:log --only apply
```

---

**これだけ覚えておけばOKです！**
