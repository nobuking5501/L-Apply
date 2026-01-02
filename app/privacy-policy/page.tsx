import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/dashboard/guide"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          使い方ガイドに戻る
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">プライバシーポリシー</CardTitle>
            <p className="text-sm text-gray-600 mt-2">最終更新日: 2025年12月29日</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. はじめに</h2>
              <p className="text-gray-700">
                本サービス（以下「当サービス」）は、お客様の個人情報の保護を重要な責務と認識し、個人情報保護法その他の関連法令を遵守し、以下のプライバシーポリシー（以下「本ポリシー」）に従って、適切に取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. 個人情報の定義</h2>
              <p className="text-gray-700">
                本ポリシーにおいて「個人情報」とは、個人情報保護法第2条第1項に定義される、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日その他の記述等により特定の個人を識別できるもの、または個人識別符号が含まれるものをいいます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. 取得する情報</h2>
              <p className="text-gray-700 mb-2">当サービスでは、以下の情報を取得する場合があります：</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  <strong>アカウント情報：</strong>メールアドレス、パスワード、表示名、プロフィール情報
                </li>
                <li>
                  <strong>LINE連携情報：</strong>LINEユーザーID、LINEプロフィール名
                </li>
                <li>
                  <strong>サービス利用時の入力情報：</strong>お客様がフォームやメッセージで入力した情報（氏名、メールアドレス、電話番号、住所、その他お客様が入力した情報）
                </li>
                <li>
                  <strong>利用情報：</strong>サービスの利用状況、アクセスログ、閲覧履歴
                </li>
                <li>
                  <strong>端末情報：</strong>IPアドレス、ブラウザ情報、デバイス情報
                </li>
                <li>
                  <strong>Cookie情報：</strong>Cookie、類似技術により取得される情報
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. 個人情報の利用目的</h2>
              <p className="text-gray-700 mb-2">取得した個人情報は、以下の目的で利用します：</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>サービスの提供、運営、維持、保護および改善のため</li>
                <li>お客様からのお問い合わせへの対応のため</li>
                <li>お客様が入力した情報の受付および管理のため</li>
                <li>お客様への通知機能、メッセージ配信機能の提供のため</li>
                <li>利用規約違反、不正利用の調査および対応のため</li>
                <li>サービスに関する重要なお知らせの送信のため</li>
                <li>統計データの作成および分析のため（個人を特定できない形式に加工した上で利用します）</li>
                <li>新機能、更新情報、キャンペーン等の案内のため</li>
                <li>利用料金の請求、決済処理のため</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. 個人情報の第三者提供</h2>
              <p className="text-gray-700 mb-2">
                当サービスは、以下の場合を除き、お客様の個人情報を第三者に提供することはありません：
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>お客様の同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難である場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難である場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. 外部サービスの利用</h2>
              <p className="text-gray-700 mb-2">当サービスは、以下の外部サービスを利用しています：</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  <strong>Firebase（Google LLC）：</strong>認証、データベース、ホスティング
                  <br />
                  <a
                    href="https://firebase.google.com/support/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Firebase プライバシーポリシー
                  </a>
                </li>
                <li>
                  <strong>LINE Messaging API（LINE株式会社）：</strong>LINE連携、メッセージ送信
                  <br />
                  <a
                    href="https://line.me/ja/terms/policy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    LINE プライバシーポリシー
                  </a>
                </li>
                <li>
                  <strong>Vercel Inc.：</strong>アプリケーションホスティング
                  <br />
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Vercel プライバシーポリシー
                  </a>
                </li>
              </ul>
              <p className="text-gray-700 mt-3">
                これらのサービスは、それぞれのプライバシーポリシーに従って個人情報を取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. 個人情報の安全管理</h2>
              <p className="text-gray-700">
                当サービスは、個人情報の紛失、破壊、改ざんおよび漏洩などのリスクに対して、業界標準のセキュリティ技術を使用し、合理的な安全対策を実施します。個人情報へのアクセスは、業務上必要な従業員に限定し、適切なアクセス制御を実施します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. お客様の権利</h2>
              <p className="text-gray-700 mb-2">お客様は、ご自身の個人情報について、以下の権利を有します：</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>開示を請求する権利</li>
                <li>訂正、追加または削除を請求する権利</li>
                <li>利用の停止または消去を請求する権利</li>
                <li>第三者への提供の停止を請求する権利</li>
              </ul>
              <p className="text-gray-700 mt-3">
                これらの権利を行使される場合は、本ポリシー末尾に記載の問い合わせ窓口までご連絡ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Cookie（クッキー）の使用</h2>
              <p className="text-gray-700">
                当サービスは、サービスの利便性向上およびサービスの利用状況の把握のため、Cookieおよび類似技術を使用します。Cookieの使用を希望されない場合は、ブラウザの設定でCookieを無効にすることができますが、一部機能が正常に動作しない可能性があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">10. 未成年者の個人情報</h2>
              <p className="text-gray-700">
                当サービスは、未成年者が当サービスを利用する場合、保護者の同意を得た上でご利用いただくことを推奨します。未成年者の個人情報を取得した場合、保護者の権利を尊重し、適切に取り扱います。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. プライバシーポリシーの変更</h2>
              <p className="text-gray-700">
                当サービスは、法令の変更、サービス内容の変更その他の理由により、本ポリシーを変更することがあります。変更後のプライバシーポリシーは、当サービス上に掲載した時点で効力を生じるものとします。重要な変更がある場合は、サービス内での通知またはメールでお知らせします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. お問い合わせ</h2>
              <p className="text-gray-700 mb-3">
                個人情報の取り扱いに関するご質問、苦情、開示等の請求については、以下の窓口までお問い合わせください。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-gray-900 font-semibold mb-2">サポート窓口</p>
                <p className="text-gray-700 mb-1">
                  メールアドレス：
                  <a
                    href="mailto:kwmlink2025@gmail.com"
                    className="text-blue-600 hover:underline"
                  >
                    kwmlink2025@gmail.com
                  </a>
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  ※お問い合わせには、1〜2営業日以内に回答いたします。
                </p>
              </div>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-600">制定日：2025年12月29日</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
