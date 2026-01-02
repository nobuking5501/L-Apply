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
  HelpCircle,
  Mail,
} from 'lucide-react';

export default function GuidePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📖 はじめての方へ</h2>
        <p className="text-sm text-gray-600 mt-1">
          L-Applyは、LINEでセミナー参加申し込みを受け付けられるシステムです。
          <br />
          この画面では、初めての方でも簡単に設定できるように、分かりやすく手順をご案内します。
        </p>
      </div>

      {/* What is L-Apply */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <HelpCircle className="h-5 w-5 mr-2" />
            L-Applyって何ができるの？
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>L-Apply</strong>は、あなたのLINE公式アカウントと連携して、以下のことが自動でできるようになります：
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-gray-900">✅ セミナー申し込みの受付</p>
              <p className="text-xs text-gray-600 mt-1">
                お客様がLINEから日時を選んで申し込めます
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-gray-900">📅 予約管理</p>
              <p className="text-xs text-gray-600 mt-1">
                誰がいつ申し込んだか、一覧で確認できます
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-gray-900">🔔 リマインダー通知</p>
              <p className="text-xs text-gray-600 mt-1">
                前日・当日に自動でLINEメッセージを送信
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-gray-900">💬 自動返信</p>
              <p className="text-xs text-gray-600 mt-1">
                よくある質問に自動で返信できます
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
            かんたん4ステップで始められます
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-900">
              <strong>⏱️ 所要時間：約15分</strong>
              <br />
              初めての方でも、このページの通りに進めていけば大丈夫です！
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start bg-blue-50 p-4 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">LINE公式アカウントの準備</h4>
                <p className="text-sm text-gray-600 mt-1">
                  まだお持ちでない方は、LINE公式アカウントを作成してください。
                  <br />
                  <span className="text-xs text-gray-500">（すでにお持ちの方は、この手順は飛ばしてOKです）</span>
                </p>
              </div>
            </div>

            <div className="flex items-start bg-amber-50 p-4 rounded-lg border-2 border-amber-300">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  設定ページを解放する
                  <span className="ml-2 text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded">重要</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  設定ページを利用するには、<strong className="text-amber-900">サポートサービス</strong>の購入が必要です。
                  <br />
                  <span className="text-xs text-gray-500 mt-1 block">
                    💡 サポートサービスには、LINE連携の初期設定サポートと使い方レクチャーが含まれています（¥15,000・一回限り）
                  </span>
                </p>
                <div className="mt-2 bg-white p-3 rounded border border-amber-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">📝 購入手順：</p>
                  <ol className="list-decimal list-inside text-xs text-gray-700 space-y-1 pl-2">
                    <li>「サポートプラン」メニューをクリック</li>
                    <li>「追加サービス」セクションでサポートサービスを購入</li>
                    <li>決済完了後、設定ページが使えるようになります</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex items-start bg-green-50 p-4 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">LINEとL-Applyを連携</h4>
                <p className="text-sm text-gray-600 mt-1">
                  L-Applyの「設定」メニューから、LINEと連携するための情報を入力します。
                  <br />
                  <span className="text-xs text-gray-500">（詳しい手順は、下の「詳しい設定方法」をご覧ください）</span>
                </p>
              </div>
            </div>

            <div className="flex items-start bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  セミナー情報を登録
                  <span className="ml-2 text-xs bg-purple-200 text-purple-900 px-2 py-0.5 rounded">プラン要確認</span>
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  「イベント管理」メニューから、セミナーの日程や定員を設定します。
                  <br />
                  <span className="text-xs text-gray-500">（例：「個別相談会」2月10日 10:00〜、定員5名）</span>
                </p>
                <div className="mt-2 bg-white p-3 rounded border border-purple-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2">📊 プランによる制限：</p>
                  <ul className="text-xs text-gray-700 space-y-1 pl-4">
                    <li>• <strong>フリープラン</strong>：イベント作成数に制限あり</li>
                    <li>• <strong>有料プラン</strong>：より多くのイベントやリマインダーを作成可能</li>
                  </ul>
                  <p className="text-xs text-gray-600 mt-2">
                    💡 制限を超える場合は「サポートプラン」メニューからプランをアップグレードしてください
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start bg-orange-50 p-4 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">申し込みページをLINEで配信</h4>
                <p className="text-sm text-gray-600 mt-1">
                  ここはリッチメニューに設定してください。
                  <br />
                  <span className="text-xs text-gray-500">リッチメニューの設定が分からない人は、サポートに問い合わせしてください。</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mt-4">
            <p className="text-sm text-green-900">
              <strong>✅ これで準備完了です！</strong>
              <br />
              あとは、お客様からの申し込みを待つだけです。申し込みがあると「申込者管理」で確認できます。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* LINE Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
            詳しい設定方法（ステップ2の詳細）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>📌 この設定は最初に1回だけ行えばOKです</strong>
              <br />
              少し専門的な手順になりますが、画面の通りに進めれば大丈夫です。
              分からない場合は、下の「サポート」からお問い合わせください。
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  1
                </span>
                LINE Developers（ライン デベロッパーズ）にログイン
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                「LINE Developers」というLINEの設定画面にアクセスします。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-4 bg-gray-50 p-3 rounded">
                <li>
                  <a
                    href="https://developers.line.biz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center font-semibold"
                  >
                    LINE Developers
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  を開きます
                </li>
                <li>LINE公式アカウントで使っているアカウントでログインします</li>
                <li>「プロバイダー」を作成します（会社名や個人名でOKです）</li>
                <li>「新しいチャネルを作成」ボタンをクリック</li>
                <li>「Messaging API」を選択します</li>
              </ol>
              <p className="text-xs text-gray-500 mt-2 pl-4">
                💡 「プロバイダー」= あなたの会社や個人を表す名前です
                <br />
                💡 「Messaging API」= LINEで自動メッセージを送る機能のことです
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mt-3 ml-4">
                <p className="text-xs text-blue-900">
                  <strong>📋 プライバシーポリシー・利用規約は下記のURLをお使いください</strong>
                  <br />
                  <span className="text-xs text-blue-800 mt-1 block">
                    チャネル作成時に「プライバシーポリシーURL」と「利用規約URL」の入力が必要です。
                  </span>
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-blue-900">
                    🔒 プライバシーポリシー：
                    <a
                      href="https://l-apply.vercel.app/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono ml-1"
                    >
                      https://l-apply.vercel.app/privacy-policy
                    </a>
                  </p>
                  <p className="text-xs text-blue-900">
                    📜 利用規約：
                    <a
                      href="https://l-apply.vercel.app/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-mono ml-1"
                    >
                      https://l-apply.vercel.app/terms-of-service
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  2
                </span>
                LINEチャネルの基本情報を入力
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                作成するチャネルの名前や説明を入力します。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-4 bg-gray-50 p-3 rounded">
                <li>チャネル名：あなたのサービス名を入力（例：「個別相談予約」）</li>
                <li>チャネル説明：何に使うかを簡単に書きます</li>
                <li>大業種・小業種：当てはまるものを選択</li>
                <li>利用規約に同意して「作成」ボタンをクリック</li>
              </ol>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  3
                </span>
                必要なコードを取得する
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                L-ApplyとLINEを連携するために必要な「3つのコード」を取得します。
              </p>

              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">📌 取得するもの</p>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1 pl-4">
                    <li>① チャネルアクセストークン（長い英数字）</li>
                    <li>② チャネルシークレット（短い英数字）</li>
                    <li>③ LIFF ID（申し込みフォームのID）</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">① チャネルアクセストークンの取得：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-4">
                    <li>「Messaging API設定」タブをクリック</li>
                    <li>下にスクロールして「チャネルアクセストークン（長期）」を探す</li>
                    <li>「発行」ボタンをクリック</li>
                    <li>表示された長い文字列を<strong>コピー</strong>してメモ帳などに保存</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">② チャネルシークレットの取得：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-4">
                    <li>「チャネル基本設定」タブをクリック</li>
                    <li>「チャネルシークレット」の項目を探す</li>
                    <li>表示されている文字列を<strong>コピー</strong>してメモ帳などに保存</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">③ LIFF IDの取得：</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 pl-4">
                    <li>「LIFF」タブをクリック</li>
                    <li>「追加」ボタンをクリック</li>
                    <li>以下のように入力：
                      <ul className="list-disc list-inside text-xs pl-6 mt-1 space-y-1">
                        <li>LIFF名：「セミナー申込」など好きな名前</li>
                        <li>サイズ：「Full」を選択</li>
                        <li>エンドポイントURL：L-Applyの「設定」ページに表示されているURLをコピペ</li>
                        <li>Scope：「profile」と「openid」にチェック</li>
                      </ul>
                    </li>
                    <li>「作成」ボタンをクリック</li>
                    <li>作成されたLIFF IDを<strong>コピー</strong>してメモ帳などに保存</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  4
                </span>
                Webhook URL（ウェブフック URL）を設定
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                LINEからL-Applyに通知が届くように設定します。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-4 bg-gray-50 p-3 rounded">
                <li>「Messaging API設定」タブに戻る</li>
                <li>「Webhook URL」の欄にこのURLを入力：
                  <div className="bg-white p-2 rounded border mt-1 font-mono text-xs break-all">
                    https://asia-northeast1-l-apply.cloudfunctions.net/webhook
                  </div>
                </li>
                <li>「Webhookの利用」を<strong>オン</strong>にする</li>
                <li>「応答メッセージ」を<strong>オフ</strong>にする（重要！）</li>
              </ol>
              <p className="text-xs text-red-600 mt-2 pl-4">
                ⚠️ 「応答メッセージ」をオフにしないと、LINEの自動応答とL-Applyの両方が反応してしまいます
              </p>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                  5
                </span>
                L-Applyに情報を入力
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                メモ帳に保存した3つのコードを、L-Applyの「設定」ページに入力します。
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 pl-4 bg-gray-50 p-3 rounded">
                <li>L-Applyのメニューから「設定」をクリック</li>
                <li>「LINE Channel Access Token」の欄に、①のコードを貼り付け</li>
                <li>「LINE Channel Secret」の欄に、②のコードを貼り付け</li>
                <li>「LIFF ID」の欄に、③のコードを貼り付け</li>
                <li>「保存」ボタンをクリック</li>
                <li>「🔌 LINE API 接続テスト」ボタンをクリックして、接続できるか確認</li>
              </ol>
              <div className="bg-green-50 border border-green-200 p-3 rounded mt-3">
                <p className="text-sm text-green-900">
                  <strong>✅ 接続成功のメッセージが出たら完了です！</strong>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Guides */}
      <Card>
        <CardHeader>
          <CardTitle>各メニューの説明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Management */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Calendar className="h-6 w-6 mr-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">イベント管理</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  セミナーや説明会の日程を登録・管理できます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【できること】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>セミナーの名前・説明を登録</li>
                    <li>複数の日時（例：2月10日 10:00〜、2月15日 14:00〜など）を設定</li>
                    <li>各日時の定員を設定（例：5名まで）</li>
                    <li>現在何人申し込んでいるか確認</li>
                    <li>公開/非公開の切り替え</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Application Management */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Users className="h-6 w-6 mr-3 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">申込者管理</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  誰がいつ申し込んだか、一覧で確認できます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【できること】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>申込者の一覧表示</li>
                    <li>申し込んだ日時・セミナー名の確認</li>
                    <li>キャンセルされた申込の確認</li>
                    <li>LINEのユーザー名の確認</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Bell className="h-6 w-6 mr-3 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">リマインダー設定</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  セミナーの前日や当日に、自動でLINEメッセージを送れます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【できること】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>前日の通知（例：明日10時からです、お忘れなく！）</li>
                    <li>当日の通知（例：本日10時スタートです！）</li>
                    <li>送るタイミングを自由に設定（3日前、1週間前など）</li>
                    <li>メッセージの内容を自由に編集</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Step Delivery */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <Send className="h-6 w-6 mr-3 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">ステップ配信設定</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  セミナー参加後に、段階的にフォローメッセージを自動送信できます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【使い方の例】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>セミナー終了後1日目：お礼メッセージ</li>
                    <li>セミナー終了後3日目：追加資料の案内</li>
                    <li>セミナー終了後7日目：次回セミナーのご案内</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 最大10ステップまで設定できます
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Reply */}
          <div className="border-b pb-4">
            <div className="flex items-start">
              <MessageSquare className="h-6 w-6 mr-3 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">自動返信設定</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  お客様が特定の言葉を送ると、自動で返信できます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【使い方の例】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>お客様が「料金」と送る → 料金表を自動返信</li>
                    <li>お客様が「場所」と送る → 会場の住所を自動返信</li>
                    <li>お客様が「相談希望」と送る → 相談受付のメッセージを自動返信</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 よくある質問に自動で答えられるので、対応が楽になります
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <div className="flex items-start">
              <Settings className="h-6 w-6 mr-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-lg">設定</h4>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>何ができる？</strong>
                  <br />
                  LINEとの連携情報や、申し込みページのURLを確認できます。
                </p>
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-700 mb-2">【できること】</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 pl-2">
                    <li>LINE連携コードの入力・確認</li>
                    <li>申し込みページURLの確認とコピー</li>
                    <li>LINE API接続テスト</li>
                    <li>組織情報の確認</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>よくあるトラブルと解決方法</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <h4 className="font-semibold text-red-900 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              Q. LINEから申し込みができません
            </h4>
            <p className="text-sm text-red-800 mt-2">
              <strong>A. 以下を確認してください：</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-red-800 mt-2 pl-4 space-y-1">
              <li>「設定」ページでLINE連携が正しく設定されているか</li>
              <li>「設定」ページで「接続テスト」が成功するか</li>
              <li>「イベント管理」でイベントが「公開中」になっているか</li>
              <li>選んだ日時の定員がいっぱいではないか</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h4 className="font-semibold text-yellow-900 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              Q. リマインダーが送られません
            </h4>
            <p className="text-sm text-yellow-800 mt-2">
              <strong>A. 以下を確認してください：</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 pl-4 space-y-1">
              <li>「リマインダー設定」ページでリマインダーが作成されているか</li>
              <li>リマインダーが「有効」になっているか</li>
              <li>送信予定日時が正しいか</li>
              <li>お客様が申込時に通知に同意しているか</li>
            </ul>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="font-semibold text-blue-900 flex items-center">
              <HelpCircle className="h-4 w-4 mr-2" />
              Q. LINEで送ったメッセージに自動返信されません
            </h4>
            <p className="text-sm text-blue-800 mt-2">
              <strong>A. 以下を確認してください：</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-blue-800 mt-2 pl-4 space-y-1">
              <li>「自動返信設定」でキーワードを登録しているか</li>
              <li>登録したキーワードと、お客様が送った言葉が完全に一致しているか</li>
              <li>自動返信が「有効」になっているか</li>
              <li>LINE Developersで「Webhookの利用」がオンになっているか</li>
              <li>LINE Developersで「応答メッセージ」がオフになっているか</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <Mail className="h-5 w-5 mr-2" />
            サポート・お問い合わせ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-300">
            <p className="text-sm text-gray-700 mb-3">
              <strong className="text-lg text-gray-900">📧 困ったときは、お気軽にご連絡ください</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>📧 サポートメール：</strong>
                </p>
                <a
                  href="mailto:kwmlink2025@gmail.com"
                  className="text-base font-mono text-blue-600 hover:text-blue-800 hover:underline block break-all"
                >
                  kwmlink2025@gmail.com
                </a>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>💬 公式LINE：</strong>
                </p>
                <a
                  href="https://lin.ee/j26yFRB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-mono text-blue-600 hover:text-blue-800 hover:underline block break-all"
                >
                  https://lin.ee/j26yFRB
                </a>
                <p className="text-xs text-gray-600 mt-2">
                  LINEでもお問い合わせいただけます
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
              <p className="text-xs text-gray-600">
                💡 お問い合わせの際は、以下を書いていただけるとスムーズです：
              </p>
              <ul className="text-xs text-gray-600 mt-2 list-disc list-inside pl-2">
                <li>困っている内容（できるだけ詳しく）</li>
                <li>エラーメッセージ（表示されている場合）</li>
                <li>どの画面での操作か</li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              <strong>📚 参考リンク（もっと詳しく知りたい方向け）</strong>
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <ExternalLink className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                <a
                  href="https://developers.line.biz/ja/docs/messaging-api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LINE Messaging API 公式ドキュメント（技術者向け）
                </a>
              </li>
              <li className="flex items-start">
                <ExternalLink className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                <a
                  href="https://developers.line.biz/ja/docs/liff/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LINE LIFF 公式ドキュメント（技術者向け）
                </a>
              </li>
              <li className="flex items-start">
                <ExternalLink className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                <a
                  href="https://www.linebiz.com/jp/manual/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  LINE公式アカウント 使い方ガイド
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <p className="text-sm text-yellow-900">
              <strong>⏰ サポート対応時間</strong>
              <br />
              平日 9:00〜18:00（土日祝日はお休みです）
              <br />
              <span className="text-xs">※ 返信まで1〜2営業日いただく場合があります</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy and Terms */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <BookOpen className="h-5 w-5 mr-2" />
            プライバシーポリシー・利用規約
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-700 mb-4">
              <strong>📋 LINE Developers でチャネル作成時に必要な情報</strong>
              <br />
              <span className="text-xs text-gray-600">
                LINE Messaging API のチャネルを作成する際、プライバシーポリシーとサービス利用規約のURLを入力する必要があります。
                <br />
                以下のL-Applyの各ページURLをご使用ください。
              </span>
            </p>

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  🔒 プライバシーポリシー
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  個人情報の取り扱いについて記載されています
                </p>
                <div className="bg-white p-2 rounded border">
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all font-mono"
                  >
                    https://l-apply.vercel.app/privacy-policy
                  </a>
                </div>
                <div className="mt-2">
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    ページを開く
                  </a>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  📜 サービス利用規約
                </p>
                <p className="text-xs text-gray-600 mb-2">
                  サービスの利用条件について記載されています
                </p>
                <div className="bg-white p-2 rounded border">
                  <a
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all font-mono"
                  >
                    https://l-apply.vercel.app/terms-of-service
                  </a>
                </div>
                <div className="mt-2">
                  <a
                    href="/terms-of-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    ページを開く
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded mt-4">
              <p className="text-xs text-amber-900">
                <strong>💡 使い方：</strong>
                <br />
                LINE Developers でチャネル作成時に「プライバシーポリシーURL」と「利用規約URL」を入力する欄があります。
                <br />
                上記のURLをコピーして貼り付けてください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
