'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Settings,
  Calendar,
  MessageSquare,
  Bell,
  Users,
  Send,
} from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">使い方ガイド</h2>
        <p className="text-sm text-gray-600 mt-1">
          L-Applyの基本的な使い方とLINE連携方法をご紹介します
        </p>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            クイックスタート
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">1. LINE連携を設定</h4>
                <p className="text-sm text-gray-600 mt-1">
                  「設定」メニューからLINE Messaging APIの設定を行います。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">2. イベントを作成</h4>
                <p className="text-sm text-gray-600 mt-1">
                  「イベント管理」から新しいイベントと日時枠を作成します。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">3. LIFF URLを配信</h4>
                <p className="text-sm text-gray-600 mt-1">
                  設定ページに表示されるLIFF URLをLINEで配信します。
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900">4. 申込者を管理</h4>
                <p className="text-sm text-gray-600 mt-1">
                  「申込者管理」で参加者情報を確認・管理できます。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LINE Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
            LINE連携の設定方法
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-sm text-blue-900 font-semibold">
              LINE Developers コンソールでの設定が必要です
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ステップ1: LINE Developersアカウント作成
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
                <li>
                  <a
                    href="https://developers.line.biz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center"
                  >
                    LINE Developers
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  にアクセスしてログイン
                </li>
                <li>プロバイダーを作成（既にある場合は選択）</li>
                <li>新しいチャネルを作成（種類：Messaging API）</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ステップ2: チャネル基本設定
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
                <li>チャネル名、チャネル説明を入力</li>
                <li>大業種・小業種を選択</li>
                <li>利用規約に同意して作成</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ステップ3: Messaging API設定
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
                <li>「Messaging API設定」タブを開く</li>
                <li>「チャネルアクセストークン（長期）」を発行</li>
                <li>「Webhook URL」を設定（Functions URLを使用）</li>
                <li>「Webhookの利用」をONにする</li>
                <li>「応答メッセージ」をOFFにする（自動応答を無効化）</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ステップ4: LIFF設定
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
                <li>「LIFF」タブを開く</li>
                <li>「追加」ボタンをクリック</li>
                <li>LIFF名を入力（例：イベント申込）</li>
                <li>サイズ：Full</li>
                <li>エンドポイントURL：Vercelのデプロイ先URL + /liff/apply</li>
                <li>Scope: profile, openid</li>
                <li>作成後、LIFF IDをコピー</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                ステップ5: L-Applyに設定を登録
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 pl-4">
                <li>L-Applyの「設定」メニューを開く</li>
                <li>チャネルアクセストークンを入力</li>
                <li>チャネルシークレットを入力</li>
                <li>LIFF IDを入力</li>
                <li>「保存」ボタンをクリック</li>
              </ol>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 rounded">
            <p className="text-sm text-yellow-900">
              <strong>注意：</strong>
              Webhook URLは必ずHTTPSである必要があります。Firebase Functions URLを使用してください。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Guides */}
      <Card>
        <CardHeader>
          <CardTitle>各機能の説明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Management */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-3 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">イベント管理</h4>
                <p className="text-sm text-gray-600 mt-1">
                  セミナーや説明会などのイベントを作成・管理できます。複数の日時枠を設定し、各枠の定員を管理できます。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>イベント作成・編集・削除</li>
                  <li>複数の日時枠設定</li>
                  <li>定員管理（現在の参加者数/最大定員）</li>
                  <li>公開/非公開の切り替え</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Bell className="h-5 w-5 mr-3 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">リマインダー設定</h4>
                <p className="text-sm text-gray-600 mt-1">
                  イベント前に自動でリマインダー通知をLINEで送信できます。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>前日リマインダー（T-24h）</li>
                  <li>当日リマインダー（Day-of）</li>
                  <li>カスタムタイミング設定</li>
                  <li>メッセージテンプレート編集</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step Delivery */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Send className="h-5 w-5 mr-3 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">ステップ配信設定</h4>
                <p className="text-sm text-gray-600 mt-1">
                  イベント参加後に段階的にフォローアップメッセージを自動配信できます。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>ステップ1〜10まで設定可能</li>
                  <li>各ステップの配信タイミング設定（イベント後○日）</li>
                  <li>メッセージ内容のカスタマイズ</li>
                  <li>配信状況の監視</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Auto Reply */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <MessageSquare className="h-5 w-5 mr-3 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">自動返信設定</h4>
                <p className="text-sm text-gray-600 mt-1">
                  特定のキーワードに反応して自動返信する機能です。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>トリガーワード設定</li>
                  <li>返信メッセージ設定</li>
                  <li>有効/無効の切り替え</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Application Management */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Users className="h-5 w-5 mr-3 text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">申込者管理</h4>
                <p className="text-sm text-gray-600 mt-1">
                  イベント申込者の一覧表示と管理ができます。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>申込者リストの表示</li>
                  <li>申込日時、イベント情報の確認</li>
                  <li>ステータス管理（申込済み/キャンセル）</li>
                  <li>CSVエクスポート（準備中）</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="flex items-start">
              <Settings className="h-5 w-5 mr-3 text-gray-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">設定</h4>
                <p className="text-sm text-gray-600 mt-1">
                  LINE連携情報やLIFF URLを管理できます。
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
                  <li>チャネルアクセストークン設定</li>
                  <li>チャネルシークレット設定</li>
                  <li>LIFF ID設定</li>
                  <li>LIFF URL表示（ユーザーに配信）</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>よくある質問</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900">Q. LINEで申込ができません</h4>
            <p className="text-sm text-gray-600 mt-1">
              A. 以下を確認してください：
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
              <li>LINE連携設定が正しく行われているか</li>
              <li>イベントが「公開中」になっているか</li>
              <li>選択した日時枠が満席ではないか</li>
              <li>LIFF URLが正しいか</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Q. リマインダーが送信されません</h4>
            <p className="text-sm text-gray-600 mt-1">
              A. 以下を確認してください：
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
              <li>リマインダー設定が有効になっているか</li>
              <li>Cloud Schedulerが正しく設定されているか</li>
              <li>申込時にユーザーが通知に同意しているか</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900">Q. Webhookが動作しません</h4>
            <p className="text-sm text-gray-600 mt-1">
              A. 以下を確認してください：
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
              <li>Webhook URLがHTTPSであるか</li>
              <li>Firebase Functionsがデプロイされているか</li>
              <li>LINE Developersコンソールで「Webhookの利用」がONになっているか</li>
              <li>「応答メッセージ」がOFFになっているか</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>サポート</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            問題が解決しない場合は、開発者にお問い合わせください。
          </p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>ドキュメント：</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2 pl-4">
              <li>
                <a
                  href="https://developers.line.biz/ja/docs/messaging-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  LINE Messaging API ドキュメント
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <a
                  href="https://developers.line.biz/ja/docs/liff/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center"
                >
                  LINE LIFF ドキュメント
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
