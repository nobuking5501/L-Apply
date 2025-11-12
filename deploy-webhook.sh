#!/bin/bash

echo "=========================================="
echo "Webhook デプロイパッケージ作成"
echo "=========================================="
echo ""

# 関数をビルド
echo "1. Functions をビルド中..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ビルドに失敗しました"
    exit 1
fi

echo "✓ ビルド完了"
echo ""

# デプロイを試行
echo "2. Firebase にデプロイ中..."
firebase deploy --only functions:webhook

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ デプロイ成功！"
    echo "=========================================="
    echo ""
    echo "動作確認:"
    echo "1. LINEアプリでBotを開く"
    echo "2. 「個別相談」ボタンをタップ"
    echo "3. 返信メッセージを確認"
else
    echo ""
    echo "=========================================="
    echo "⚠ Firebase CLI がタイムアウトしました"
    echo "=========================================="
    echo ""
    echo "代替方法: 手動アップロード"
    echo "1. functions/lib フォルダをZIPに圧縮"
    echo "2. Firebase Console からアップロード"
    echo ""
    echo "または、もう一度実行してください:"
    echo "  bash deploy-webhook.sh"
fi
