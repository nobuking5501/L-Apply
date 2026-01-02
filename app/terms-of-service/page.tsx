import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <CardTitle className="text-3xl">サービス利用規約</CardTitle>
            <p className="text-sm text-gray-600 mt-2">最終更新日: 2025年12月29日</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第1条（適用）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  本規約は、本サービス（以下「当サービス」）の提供者（以下「当社」）が提供する全てのサービスの利用条件を定めるものです。
                </li>
                <li>
                  利用者は、本規約に同意の上、当サービスを利用するものとします。
                </li>
                <li>
                  利用者が当サービスの利用を開始した時点で、本規約に同意したものとみなします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第2条（定義）</h2>
              <p className="text-gray-700 mb-2">本規約において使用する用語の定義は、以下の通りとします。</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  <strong>「当サービス」：</strong>当社が提供する本サービスおよびこれに関連するサービス
                </li>
                <li>
                  <strong>「利用者」：</strong>当サービスを利用する全ての個人または法人
                </li>
                <li>
                  <strong>「アカウント」：</strong>当サービスを利用するために登録された利用者の情報
                </li>
                <li>
                  <strong>「コンテンツ」：</strong>当サービスを通じて利用者が作成、送信、表示する情報
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第3条（アカウント登録）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当サービスの利用を希望する者は、本規約に同意の上、当社が定める方法により登録を申請するものとします。
                </li>
                <li>
                  当社は、登録申請者が以下のいずれかに該当すると判断した場合、登録を承認しないことがあります。
                  <ul className="list-disc list-inside space-y-1 pl-6 mt-2">
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>登録事項に虚偽の記載、誤記または記載漏れがあった場合</li>
                    <li>反社会的勢力等（暴力団、暴力団員、暴力団関係企業等）である、または資金提供その他を通じて反社会的勢力等の維持、運営もしくは経営に協力もしくは関与する等反社会的勢力等との何らかの交流もしくは関与を行っていると当社が判断した場合</li>
                    <li>その他、当社が登録を適当でないと判断した場合</li>
                  </ul>
                </li>
                <li>
                  利用者は、登録情報に変更があった場合、速やかに当社に届け出るものとします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第4条（アカウント管理）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  利用者は、自己の責任において、アカウント情報（メールアドレス、パスワード等）を適切に管理および保管するものとします。
                </li>
                <li>
                  利用者は、いかなる場合にも、アカウント情報を第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
                </li>
                <li>
                  アカウント情報の管理不十分、使用上の過誤、第三者の使用等による損害の責任は利用者が負うものとし、当社は一切の責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第5条（利用料金）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当サービスの利用料金については、当社が別途定める料金プランに従うものとします。
                </li>
                <li>
                  利用者は、当社が定める支払方法により、当サービスの利用料金を支払うものとします。
                </li>
                <li>
                  利用者が利用料金の支払を遅滞した場合、利用者は年14.6%の割合による遅延損害金を支払うものとします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第6条（禁止事項）</h2>
              <p className="text-gray-700 mb-2">
                利用者は、当サービスの利用にあたり、以下の各号のいずれかに該当する行為をしてはなりません。
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 pl-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社、他の利用者、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>他の利用者のアカウントを不正に使用する行為</li>
                <li>他の利用者または第三者に対する嫌がらせや誹謗中傷を目的とする行為</li>
                <li>当社、他の利用者、またはその他第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
                <li>当サービスを通じて、迷惑メール、スパムメールに該当するメッセージを送信する行為</li>
                <li>過度な商用利用やマーケティング活動（当社が認めたものを除く）</li>
                <li>不当な営業、宣伝、広告、勧誘、その他営利を目的とする行為（当社の認めたものを除きます）</li>
                <li>異性との出会いや交際を目的とする行為</li>
                <li>反社会的勢力等への利益供与</li>
                <li>本サービスを通じて取得した情報を、当サービスの利用以外の目的で使用する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第7条（サービスの提供停止等）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当社は、以下のいずれかの事由があると判断した場合、利用者に事前に通知することなく当サービスの全部または一部の提供を停止または中断することができるものとします。
                  <ul className="list-disc list-inside space-y-1 pl-6 mt-2">
                    <li>当サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                    <li>地震、落雷、火災、停電または天災などの不可抗力により、当サービスの提供が困難となった場合</li>
                    <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                    <li>その他、当社が当サービスの提供が困難と判断した場合</li>
                  </ul>
                </li>
                <li>
                  当社は、当サービスの提供の停止または中断により、利用者または第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第8条（利用制限および登録抹消）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当社は、利用者が以下のいずれかに該当する場合には、事前の通知なく、当該利用者に対して、当サービスの全部もしくは一部の利用を制限し、または利用者としての登録を抹消することができるものとします。
                  <ul className="list-disc list-inside space-y-1 pl-6 mt-2">
                    <li>本規約のいずれかの条項に違反した場合</li>
                    <li>登録事項に虚偽の事実があることが判明した場合</li>
                    <li>料金等の支払債務の不履行があった場合</li>
                    <li>当社からの連絡に対し、一定期間返答がない場合</li>
                    <li>当サービスについて、最終の利用から一定期間利用がない場合</li>
                    <li>その他、当社が当サービスの利用を適当でないと判断した場合</li>
                  </ul>
                </li>
                <li>
                  当社は、本条に基づき当社が行った行為により利用者に生じた損害について、一切の責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第9条（退会）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  利用者は、当社が定める方法により、当サービスから退会することができます。
                </li>
                <li>
                  退会により利用者としての資格は喪失し、以後当サービスを利用することはできません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第10条（保証の否認および免責事項）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当社は、当サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                </li>
                <li>
                  当社は、当サービスに起因して利用者に生じたあらゆる損害について、一切の責任を負いません。ただし、当サービスに関する当社と利用者との間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                </li>
                <li>
                  前項ただし書に定める場合であっても、当社は、当社の過失（重過失を除きます。）による債務不履行または不法行為により利用者に生じた損害のうち特別な事情から生じた損害（当社または利用者が損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。また、当社の過失（重過失を除きます。）による債務不履行または不法行為により利用者に生じた損害の賠償は、利用者から当該損害が発生した月に受領した利用料の額を上限とします。
                </li>
                <li>
                  当社は、当サービスに関して、利用者と他の利用者または第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第11条（サービス内容の変更等）</h2>
              <p className="text-gray-700">
                当社は、利用者への事前の通知なく、当サービスの内容を変更、追加または廃止することがあり、利用者はこれを承諾するものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第12条（利用規約の変更）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  当社は、必要と判断した場合には、利用者に通知することなくいつでも本規約を変更することができるものとします。
                </li>
                <li>
                  変更後の本規約は、当社が別途定める場合を除いて、当サービス上に表示した時点より効力を生じるものとします。
                </li>
                <li>
                  利用者は、本規約の変更後も当サービスを利用し続けることにより、変更後の本規約に同意したものとみなされます。
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第13条（個人情報の取扱い）</h2>
              <p className="text-gray-700">
                当社は、当サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第14条（通知または連絡）</h2>
              <p className="text-gray-700">
                利用者と当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、利用者から、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時に利用者へ到達したものとみなします。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第15条（権利義務の譲渡の禁止）</h2>
              <p className="text-gray-700">
                利用者は、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第16条（準拠法・裁判管轄）</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 pl-4">
                <li>
                  本規約の解釈にあたっては、日本法を準拠法とします。
                </li>
                <li>
                  当サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                </li>
              </ol>
            </section>

            <div className="border-t pt-6 mt-8">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="text-gray-900 font-semibold mb-2">お問い合わせ窓口</p>
                <p className="text-gray-700 mb-1">
                  メールアドレス：
                  <a
                    href="mailto:kwmlink2025@gmail.com"
                    className="text-blue-600 hover:underline"
                  >
                    kwmlink2025@gmail.com
                  </a>
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-4">制定日：2025年12月29日</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
