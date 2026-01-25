# トラブルシューティングガイド

**対象組織**: org_n6iKxvKk55MgP3YhaD2rRrDM1bj1

**問題**: LIFFアプリが「読み込み中」のまま進まない

**状況**: イベントは公開、LIFF IDも設定済みと報告あり

---

## 🔍 診断結果

マルチテナント機能自体は**正常に動作**しています（他の組織では正しく動作することを確認済み）。

問題はこの組織固有の設定にあります。以下の手順で原因を特定してください。

---

## ✅ 確認手順

### Step 1: LIFF IDを確認

1. https://l-apply.vercel.app/dashboard/settings にアクセス
2. **LIFF ID** 欄を確認
3. 値が表示されているか？
   - **表示されている**: Step 2へ
   - **表示されていない**: Step 1-Bへ

#### Step 1-B: LIFF IDを設定

1. LINE Developers Console (https://developers.line.biz/console/) にログイン
2. プロバイダー → チャネル → LIFF を選択
3. 作成したLIFFアプリをクリック
4. **LIFF ID** をコピー（例: `2008405494-abcd1234`）
5. L-Apply ダッシュボードの設定ページに戻る
6. LIFF ID 欄に貼り付け
7. **「設定を保存」をクリック**
8. Step 2へ

### Step 2: イベントの公開状態を確認

1. https://l-apply.vercel.app/dashboard/events にアクセス
2. イベント一覧を確認
3. イベントの右側のバッジを確認：
   - **「公開中」（緑色）**: ✅ OK → Step 3へ
   - **「非公開」（灰色）**: ❌ NG → Step 2-Bへ

#### Step 2-B: イベントを公開する

1. イベントの **「編集」ボタン**（鉛筆アイコン）をクリック
2. 編集モーダルの下部にある **「公開する」チェックボックス** を確認
3. チェックが入っていない場合は、チェックを入れる
4. **「更新」ボタン** をクリック
5. イベント一覧で「公開中」バッジを確認
6. Step 3へ

### Step 3: ブラウザのコンソールログを確認

デバッグログが有効になっているので、詳細な情報が確認できます。

#### PCの場合

1. LIFFアプリを開く（LINE → リッチメニュー → 申込フォーム）
2. `F12` キーを押す（または右クリック → 「検証」）
3. 「Console」タブを開く
4. `[DEBUG]` で始まるログを確認

#### スマートフォンの場合

1. PCでブラウザを開く
2. 以下のURLを直接開く：
   ```
   https://l-apply.vercel.app/liff/apply?liffId=(ダッシュボードに表示されているLIFF_ID)
   ```
3. `F12` キーでコンソールを開く

#### 確認するログ

以下のようなログが表示されるはずです：

```
[DEBUG] Step 1: Extracting LIFF ID from URL
[DEBUG] LIFF ID found: xxxxxxxxx
[DEBUG] Step 2: Fetching active event for LIFF ID: xxxxxxxxx
[DEBUG] Calling API: /api/liff/organization?liffId=xxxxxxxxx
[DEBUG] API response status: 200
[DEBUG] API response data: {...}
```

**重要なチェックポイント**:

- `[DEBUG] LIFF ID found:` が表示されているか？
  - **NO**: URLにLIFF IDパラメータが含まれていない
  - **YES**: 次へ

- `[DEBUG] API response status:` は何？
  - **200**: 正常 → 次へ
  - **404**: 組織が見つからない → LIFF IDが間違っている
  - **500**: サーバーエラー → 管理者に連絡

- `[DEBUG] API response data:` に `"activeEvent": null` と表示されているか？
  - **YES**: イベントが公開されていない → Step 2-Bへ
  - **NO**: 次へ

- `[DEBUG] Active event found:` が表示されているか？
  - **YES**: イベント取得成功 → 次へ
  - **NO**: イベントが見つからない → Step 2へ

- `[DEBUG] Step 3: Initializing LIFF` が表示されているか？
  - **YES**: LIFF初期化開始 → 次へ
  - **NO**: `loadingEvent` が true のまま → 前のステップに問題

- `[DEBUG] liff.init() completed successfully` が表示されているか？
  - **YES**: LIFF初期化成功 → 次へ
  - **NO**: LIFF初期化失敗 → LIFF IDが間違っている

- `[DEBUG] User is logged in, setting isLiffReady to true` が表示されているか？
  - **YES**: すべて正常 → キャッシュクリアを試す
  - **NO**: ログインが必要 or エラー

---

## 🔧 問題パターンと解決方法

### パターン1: LIFF IDが見つからない

**ログ**:
```
[DEBUG] No liffId parameter found in URL
```

**原因**: URLにLIFF IDパラメータが含まれていない

**解決方法**:
1. LINE Developers Console → LIFF → Endpoint URLを確認
2. 正しいURL形式に修正:
   ```
   https://l-apply.vercel.app/liff/apply?liffId=(あなたのLIFF_ID)
   ```

### パターン2: 組織が見つからない (404)

**ログ**:
```
[DEBUG] API response status: 404
[DEBUG] API error: {"error":"Organization not found"}
```

**原因**: LIFF IDがFirestoreに登録されていない、または間違っている

**解決方法**:
1. ダッシュボードの設定ページを開く
2. LIFF IDが正しいか確認（スペースや改行がないか）
3. LINE Developers Console で正しい LIFF ID をコピーして再保存

### パターン3: アクティブイベントがない

**ログ**:
```
[DEBUG] API response data: {..., "activeEvent": null}
[DEBUG] No active event found
```

**原因**: イベントが公開されていない（`isActive: false`）

**解決方法**:
1. ダッシュボードのイベント管理ページを開く
2. イベントの「編集」をクリック
3. 「公開する」にチェックを入れる
4. 「更新」をクリック

### パターン4: LIFF初期化失敗

**ログ**:
```
[DEBUG] Step 3: Initializing LIFF with ID: xxxxxxxxx
[DEBUG] Calling liff.init()...
[DEBUG] LIFF initialization failed: Error: ...
```

**原因**: LIFF IDが無効、またはLINE Developersの設定に問題

**解決方法**:
1. LINE Developers Console → LIFF → 該当アプリを確認
2. LIFF IDが正しいか確認
3. チャネルが「公開」されているか確認（「開発中」ではダメ）
4. Endpoint URLが正しいか確認

### パターン5: すべて正常だが「読み込み中」のまま

**ログ**:
```
[DEBUG] Active event found: イベント名
[DEBUG] Setting loadingEvent to false
[DEBUG] User is logged in, setting isLiffReady to true
```

**原因**: ブラウザのキャッシュ、または状態管理の問題

**解決方法**:
1. LINEアプリを完全に終了して再起動
2. ブラウザのキャッシュをクリア
3. シークレットモード/プライベートブラウジングで開く
4. 時間を置いて再度アクセス

---

## 📞 管理者への連絡が必要な場合

以下の情報を添えて管理者に連絡してください：

1. **組織ID**: `org_n6iKxvKk55MgP3YhaD2rRrDM1bj1`
2. **LIFF ID**: （ダッシュボードの設定ページに表示されている値）
3. **コンソールログ**: 上記で確認した `[DEBUG]` ログをすべてコピー
4. **スクリーンショット**:
   - ダッシュボードの設定ページ（LIFF ID欄）
   - イベント管理ページ（イベント一覧）
   - ブラウザのコンソール

---

## 🧪 管理者側でのテスト方法

管理者は、組織さんから LIFF ID を教えていただければ、以下のコマンドで直接APIをテストできます：

```bash
curl "https://l-apply.vercel.app/api/liff/organization?liffId=(組織のLIFF_ID)" | python3 -m json.tool
```

**期待される結果**:
```json
{
  "success": true,
  "organization": {
    "id": "org_n6iKxvKk55MgP3YhaD2rRrDM1bj1",
    "name": "組織名",
    ...
  },
  "activeEvent": {
    "id": "...",
    "title": "イベント名",
    "description": "...",
    "location": "...",
    "slots": [...]
  }
}
```

**activeEventがnullの場合**:
- イベントが作成されていない
- イベントが公開されていない（isActive: false）
- イベントのorganizationIdが一致していない

**404エラーの場合**:
- LIFF IDがFirestoreに登録されていない
- LIFF IDが間違っている

---

**作成日**: 2025-12-19
**バージョン**: デバッグログ付き（最新デプロイ）
