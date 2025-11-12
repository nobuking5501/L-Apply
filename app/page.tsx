import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Send, Users, BarChart, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Calendar,
      title: 'イベント管理',
      description: 'セミナーやイベントを簡単に作成・管理できます',
    },
    {
      icon: Users,
      title: '申込者管理',
      description: '参加者の情報を一元管理し、効率的に運営できます',
    },
    {
      icon: Send,
      title: 'ステップ配信',
      description: 'セミナー後の自動フォローアップメッセージを配信',
    },
    {
      icon: BarChart,
      title: '統計・分析',
      description: '申込状況や配信状況をリアルタイムで確認できます',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            L-Apply
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            LINE連携型イベント申込・管理システム
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
            セミナーやイベントの申込受付から参加者管理、自動フォローアップまで。
            LINEと連携したオールインワンの管理システムです。
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                無料で始める
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                ログイン
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              今すぐ始めましょう
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              アカウント作成は無料です。数分で設定が完了し、すぐにイベント管理を開始できます。
            </p>
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                無料アカウント作成
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500">
          <p>&copy; 2025 L-Apply. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
