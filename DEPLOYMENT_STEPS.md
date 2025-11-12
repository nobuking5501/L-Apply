# Cloud Functions デプロイ手順

## 1. 環境変数の設定

Cloud Functionsをデプロイする前に、Firebase Consoleで環境変数を設定する必要があります。

### Firebase Consoleでの設定手順:

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. プロジェクト「l-apply」を選択
3. 左メニューから「Functions」を選択
4. デプロイ済みの関数（apply, webhook など）を選択
5. 「構成」タブを選択
6. 「環境変数」セクションで「編集」をクリック
7. 以下の環境変数を追加:

```
LINE_CHANNEL_ACCESS_TOKEN=TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=9182d8af6435ce79b43d2522cbad08d4
LIFF_ID=2008405494-nKEy7Pl0
APP_BASE_URL=https://l-apply.web.app
ORGANIZATION_ID=org_MMWWMU8RmzWKdvXctUCwKTZfD453
```

### コマンドラインでの設定（推奨）:

```bash
# Firebase CLIで環境変数を設定
firebase functions:config:set \
  line.channel_access_token="TXFPeLK+AGl3TGjdUz5scfn5XlNo+eG0nBLj6TCT6IQfXeH/04Ao2qM2D5yJuFrpqnhcilqMc2+e+nr9JO6k9rRHZCGomUeGgZYhZN5o1+pUw31bCknDCXjulniAvV0KgwLzbzwY5hiuKbz0NIDMAgdB04t89/1O/w1cDnyilFU=" \
  line.channel_secret="9182d8af6435ce79b43d2522cbad08d4" \
  liff.id="2008405494-nKEy7Pl0" \
  app.base_url="https://l-apply.web.app" \
  app.organization_id="org_MMWWMU8RmzWKdvXctUCwKTZfD453"
```

ただし、Gen2 Functionsでは環境変数の形式が異なるため、以下の方法を使用してください：

```bash
# Gen2 Functions用の環境変数設定
cd functions
# .envファイルは既に作成済みなので、デプロイ時に自動的に読み込まれます
```

## 2. Cloud Functionsのデプロイ

```bash
# プロジェクトルートから実行
firebase deploy --only functions
```

デプロイが完了すると、以下のエンドポイントが利用可能になります:
- `https://asia-northeast1-l-apply.cloudfunctions.net/webhook` - LINE Webhook
- `https://asia-northeast1-l-apply.cloudfunctions.net/apply` - セミナー申込API

## 3. LINE Developersコンソールでの設定

### Webhookの設定:

1. [LINE Developers Console](https://developers.line.biz/) を開く
2. プロバイダー「L-Apply」を選択
3. Messaging API チャンネルを選択
4. 「Messaging API設定」タブを選択
5. 「Webhook URL」に以下を設定:
   ```
   https://asia-northeast1-l-apply.cloudfunctions.net/webhook
   ```
6. 「Webhookの利用」を「オン」にする
7. 「検証」ボタンをクリックしてWebhookが正しく動作するか確認

### Webhook設定の確認項目:

- [x] Webhook URL が正しく設定されている
- [x] Webhookの利用が「オン」
- [x] 応答メッセージが「オフ」（Botからの自動応答を無効化）
- [x] 友だち追加時のあいさつメッセージが「オフ」（カスタムウェルカムメッセージを使用）

### リッチメニューの設定:

リッチメニューを設定することで、ユーザーが簡単にセミナー申込やメニュー操作ができます。

#### 設定方法:

1. LINE Developers Console > Messaging API設定 > リッチメニュー
2. 「作成」をクリック
3. 以下の設定を行う:

**基本設定:**
- タイトル: L-Applyメニュー
- 表示期間: 常に表示
- メニューバーのテキスト: メニュー

**テンプレート:**
- 大テンプレート（6分割）を選択

**アクション設定:**

| 領域 | タイプ | ラベル | アクション |
|------|--------|--------|-----------|
| A | リンク | セミナー申込 | `https://liff.line.me/2008405494-nKEy7Pl0` |
| B | テキスト | 予約確認 | `予約確認` |
| C | テキスト | キャンセル | `キャンセル` |
| D | リンク | お知らせ | `https://l-apply.web.app` |
| E | テキスト | 配信停止 | `配信停止` |
| F | テキスト | 再開 | `再開` |

**画像:**
- サイズ: 2500 x 1686px または 2500 x 843px
- 画像をアップロードするか、テキストのみのメニューを使用

4. 「保存」をクリック
5. 「公開」をクリックしてリッチメニューを有効化

## 4. 動作確認

### テスト手順:

1. **友だち追加のテスト:**
   - LINEアプリでBotを友だち追加
   - ウェルカムメッセージが送信されることを確認
   - メッセージにLIFFアプリのリンクが含まれていることを確認

2. **セミナー申込のテスト:**
   - リッチメニューまたはウェルカムメッセージのリンクからLIFFアプリを開く
   - セミナー情報が表示されることを確認
   - 申込フォームを送信
   - 完了メッセージがLINEに送信されることを確認

3. **ダッシュボードでの確認:**
   - https://l-apply.web.app/dashboard/applications にアクセス
   - 申込データが表示されることを確認

4. **コマンドのテスト:**
   - 「予約確認」と送信 → 予約情報が表示される
   - 「キャンセル」と送信 → キャンセル確認メッセージが表示される
   - 「配信停止」と送信 → 配信停止メッセージが表示される

## トラブルシューティング

### Webhookが動作しない場合:

```bash
# ログを確認
firebase functions:log --only webhook

# 特定の関数のログを表示
firebase functions:log
```

### 環境変数が反映されない場合:

```bash
# 環境変数を確認
firebase functions:config:get

# 再デプロイ
firebase deploy --only functions --force
```

### LIFFアプリが開かない場合:

1. LIFF IDが正しいか確認
2. LIFFエンドポイントURLが`https://l-apply.web.app`に設定されているか確認
3. LINE Developers Consoleで設定を確認

## 今後の改善項目

- [ ] ダッシュボードのイベント管理とLIFFアプリを連動
- [ ] 複数イベントの選択機能
- [ ] ステップ配信メッセージのFirestore連動（現在はハードコード）
- [ ] リマインダー設定のカスタマイズ機能
- [ ] 統計・分析ダッシュボード
