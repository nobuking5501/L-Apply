'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, Mail, Clock, Users, Sparkles, CheckCircle } from 'lucide-react';

interface StepMessageTemplate {
  id?: string;
  organizationId: string;
  stepNumber: number;
  delayDays: number;
  messageType: 'after-seminar' | 'general' | 'welcome' | 'completion';
  message: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export default function StepMessagesPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<StepMessageTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StepMessageTemplate | null>(null);

  const emptyTemplate: Omit<StepMessageTemplate, 'id' | 'organizationId' | 'createdAt'> = {
    stepNumber: 1,
    delayDays: 1,
    messageType: 'after-seminar',
    message: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(emptyTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // メッセージテンプレート
  const messageTemplates = {
    welcome: [
      {
        id: 'welcome-1',
        name: '基本的な挨拶',
        message: `友だち追加ありがとうございます！🎉

L-Applyへようこそ！

このアカウントでは、イベントの申込や最新情報をお届けします。

【利用できる機能】
📅 イベント申込
📬 リマインダー通知
💡 お役立ち情報配信

何かご不明な点がございましたら、お気軽にメッセージをお送りください。

今後ともよろしくお願いいたします！`,
      },
      {
        id: 'welcome-2',
        name: 'カジュアルな挨拶',
        message: `友だち追加ありがとうございます！😊

はじめまして、L-Applyです！

このアカウントでは：
✨ イベント情報のお知らせ
✨ 簡単申込
✨ リマインダー通知

などを提供しています。

気になるイベントがあれば、お気軽にお申し込みください！
質問もいつでもどうぞ！`,
      },
      {
        id: 'welcome-3',
        name: 'シンプルな挨拶',
        message: `ご登録ありがとうございます！

L-Applyでは、イベントの申込や最新情報をお届けします。

リッチメニューから各種機能をご利用いただけます。

ご質問がございましたら、お気軽にメッセージをお送りください。`,
      },
    ],
    completion: [
      {
        id: 'completion-1',
        name: '基本的な申込完了（Zoom）',
        message: `✅ お申し込みありがとうございます！

【イベント情報】
{plan}
📅 {datetime}

【参加方法】
以下のZoomリンクからご参加ください。

🔗 Zoomリンク
https://zoom.us/j/YOUR_MEETING_ID

※前日と当日にリマインダーをお送りします。

ご不明点はこのトークに返信してください。`,
      },
      {
        id: 'completion-2',
        name: '申込完了（オンライン汎用）',
        message: `✅ 申込が完了しました！

【イベント詳細】
{plan}
📅 {datetime}

参加方法の詳細は、開催日が近づきましたらお知らせいたします。

※リマインダーを設定しましたので、忘れずにご参加いただけます。

楽しみにお待ちください！`,
      },
      {
        id: 'completion-3',
        name: '申込完了（会場）',
        message: `✅ お申し込みありがとうございます！

【イベント情報】
{plan}
📅 {datetime}

【会場】
〒xxx-xxxx
東京都xxx区xxx
最寄駅：xxx駅 徒歩x分

※前日と当日にリマインダーをお送りします。

当日お会いできることを楽しみにしております！`,
      },
    ],
    'after-seminar': [
      {
        id: 'after-1',
        name: '個別相談案内（翌日）',
        message: `イベントへのご参加ありがとうございました！🎉

いかがでしたか？
AI×コピペでアプリ開発の可能性を感じていただけましたでしょうか。

【個別相談のご案内】
もっと詳しく知りたい方向けに、無料の個別相談を実施しています💡

✨ 個別相談でできること
・あなたのアイデアを具体化
・最適な開発手順をご提案
・疑問点を直接解消

ご希望の方は「個別相談希望」と返信してください📩`,
      },
      {
        id: 'after-2',
        name: '個別相談案内（3日後）',
        message: `こんにちは！
イベントから少し時間が経ちましたが、アプリ開発は進んでいますか？😊

【無料個別相談、まだ受付中です】

「何から始めればいいかわからない...」
「自分のアイデアは実現できる？」
「もっと詳しく聞きたい！」

そんなお悩みを個別相談で解決しませんか？

📅 所要時間：30分程度
💰 料金：完全無料
💻 形式：オンライン（Zoom）

ご希望の方は「個別相談希望」と返信してください！`,
      },
      {
        id: 'after-3',
        name: '個別相談案内（最終）',
        message: `イベントからもうすぐ1週間ですね📆

【個別相談ラストチャンス！】

この機会を逃すと、次回のご案内は未定です。

実際に多くの方が個別相談を経て、
自分のアイデアをアプリとして形にしています✨

「ちょっと話を聞いてみたい」
だけでも大歓迎です！

今ならまだ枠が空いています。
「個別相談希望」と返信してお気軽にお申し込みください。

※この案内が最後となります`,
      },
      {
        id: 'after-4',
        name: 'アンケート依頼',
        message: `イベントへのご参加ありがとうございました！

よろしければ、簡単なアンケートにご協力いただけますでしょうか？📝

今後のイベント改善のため、皆様の率直なご意見をお聞かせください。

🔗 アンケートはこちら
[アンケートURL]

所要時間：約3分

ご協力いただいた方には、次回イベントで使える特典をご用意しています🎁`,
      },
      {
        id: 'after-5',
        name: 'お礼メッセージ',
        message: `イベントへのご参加、誠にありがとうございました！

今回のイベントが、皆様の今後の活動に少しでもお役に立てれば幸いです。

また次回のイベントでお会いできることを楽しみにしております。

引き続き、どうぞよろしくお願いいたします！`,
      },
    ],
    general: [
      {
        id: 'general-1',
        name: '次回イベント案内',
        message: `こんにちは！

【新しいイベントのお知らせ】📢

次回のイベントが決定しました！

📅 日時：[日時]
📍 場所：[場所/オンライン]
💡 内容：[内容説明]

詳細・お申し込みは以下から
🔗 [申込URL]

皆様のご参加をお待ちしております！`,
      },
      {
        id: 'general-2',
        name: 'お役立ち情報',
        message: `こんにちは！

今日は[トピック]についての情報をお届けします💡

【[トピック]のポイント】
✅ ポイント1
✅ ポイント2
✅ ポイント3

詳しくはこちらの記事をご覧ください👇
🔗 [記事URL]

何かご質問があれば、お気軽にメッセージをお送りください！`,
      },
      {
        id: 'general-3',
        name: '定期的なリマインド',
        message: `こんにちは！

最近、イベントに参加されていますか？😊

私たちは定期的に様々なイベントを開催しています。

気になるイベントがあれば、ぜひお気軽にお申し込みください！

リッチメニューから最新のイベント情報をご確認いただけます。`,
      },
    ],
  };

  // デフォルトのステップメッセージ
  const defaultMessages = [
    {
      stepNumber: 0,
      delayDays: 0,
      messageType: 'welcome' as const,
      message: `友だち追加ありがとうございます！🎉

L-Applyへようこそ！

このアカウントでは、イベントの申込や最新情報をお届けします。

【利用できる機能】
📅 イベント申込
📬 リマインダー通知
💡 お役立ち情報配信

何かご不明な点がございましたら、お気軽にメッセージをお送りください。

今後ともよろしくお願いいたします！`,
      isActive: true,
    },
    {
      stepNumber: 0,
      delayDays: 0,
      messageType: 'completion' as const,
      message: `✅ お申し込みありがとうございます！

【イベント情報】
{plan}
📅 {datetime}

【参加方法】
以下のZoomリンクからご参加ください。

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

※前日と当日にリマインダーをお送りします。

ご不明点はこのトークに返信してください。`,
      isActive: true,
    },
    {
      stepNumber: 1,
      delayDays: 1,
      messageType: 'after-seminar' as const,
      message: `イベントへのご参加ありがとうございました！🎉

いかがでしたか？
AI×コピペでアプリ開発の可能性を感じていただけましたでしょうか。

【個別相談のご案内】
もっと詳しく知りたい方向けに、無料の個別相談を実施しています💡

✨ 個別相談でできること
・あなたのアイデアを具体化
・最適な開発手順をご提案
・疑問点を直接解消

ご希望の方は「個別相談希望」と返信してください📩`,
      isActive: true,
    },
    {
      stepNumber: 2,
      delayDays: 3,
      messageType: 'after-seminar' as const,
      message: `こんにちは！
イベントから少し時間が経ちましたが、アプリ開発は進んでいますか？😊

【無料個別相談、まだ受付中です】

「何から始めればいいかわからない...」
「自分のアイデアは実現できる？」
「もっと詳しく聞きたい！」

そんなお悩みを個別相談で解決しませんか？

📅 所要時間：30分程度
💰 料金：完全無料
💻 形式：オンライン（Zoom）

ご希望の方は「個別相談希望」と返信してください！`,
      isActive: true,
    },
    {
      stepNumber: 3,
      delayDays: 7,
      messageType: 'after-seminar' as const,
      message: `イベントからもうすぐ1週間ですね📆

【個別相談ラストチャンス！】

この機会を逃すと、次回のご案内は未定です。

実際に多くの方が個別相談を経て、
自分のアイデアをアプリとして形にしています✨

「ちょっと話を聞いてみたい」
だけでも大歓迎です！

今ならまだ枠が空いています。
「個別相談希望」と返信してお気軽にお申し込みください。

※この案内が最後となります`,
      isActive: true,
    },
  ];

  const handleImportDefaults = async () => {
    if (!userData?.organizationId) return;
    if (!confirm('デフォルトのステップメッセージをインポートしますか？\n既存のメッセージは削除されません。')) {
      return;
    }

    try {
      for (const msg of defaultMessages) {
        const templateData: StepMessageTemplate = {
          ...msg,
          organizationId: userData.organizationId,
          createdAt: new Date(),
        };
        const newDocRef = doc(collection(db, 'step_message_templates'));
        await setDoc(newDocRef, templateData);
      }

      fetchTemplates();
      alert('デフォルトメッセージをインポートしました');
    } catch (error) {
      console.error('Error importing defaults:', error);
      alert('インポートに失敗しました');
    }
  };

  const fetchTemplates = async () => {
    if (!userData?.organizationId) return;

    try {
      const templatesQuery = query(
        collection(db, 'step_message_templates'),
        where('organizationId', '==', userData.organizationId)
      );
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StepMessageTemplate[];

      templatesData.sort((a, b) => {
        if (a.messageType !== b.messageType) {
          if (a.messageType === 'welcome') return -1;
          if (b.messageType === 'welcome') return 1;
          return a.messageType === 'after-seminar' ? -1 : 1;
        }
        return a.stepNumber - b.stepNumber;
      });

      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [userData]);

  const handleOpenDialog = (template?: StepMessageTemplate, messageType?: 'after-seminar' | 'general' | 'welcome' | 'completion') => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        stepNumber: template.stepNumber,
        delayDays: template.delayDays,
        messageType: template.messageType,
        message: template.message,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        ...emptyTemplate,
        messageType: messageType || 'after-seminar',
      });
    }
    setSelectedTemplate('');
    setDialogOpen(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);

    // 現在のメッセージタイプに対応するテンプレートを検索
    const templates = messageTemplates[formData.messageType as keyof typeof messageTemplates];
    const template = templates?.find((t) => t.id === templateId);

    if (template) {
      setFormData({
        ...formData,
        message: template.message,
      });
    }
  };

  const handleSave = async () => {
    if (!userData?.organizationId) return;

    // ウェルカムメッセージの重複チェック
    if (formData.messageType === 'welcome' && !editingTemplate?.id) {
      const existingWelcome = templates.find((t) => t.messageType === 'welcome');
      if (existingWelcome) {
        alert('ウェルカムメッセージは既に存在します。既存のメッセージを編集してください。');
        return;
      }
    }

    // 申込完了メッセージの重複チェック
    if (formData.messageType === 'completion' && !editingTemplate?.id) {
      const existingCompletion = templates.find((t) => t.messageType === 'completion');
      if (existingCompletion) {
        alert('申込完了メッセージは既に存在します。既存のメッセージを編集してください。');
        return;
      }
    }

    try {
      const templateData: StepMessageTemplate = {
        ...formData,
        organizationId: userData.organizationId,
        createdAt: editingTemplate?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (editingTemplate?.id) {
        await setDoc(doc(db, 'step_message_templates', editingTemplate.id), templateData);
      } else {
        const newDocRef = doc(collection(db, 'step_message_templates'));
        await setDoc(newDocRef, templateData);
      }

      fetchTemplates();
      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData(emptyTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (templateId: string, messageType: string) => {
    if (messageType === 'welcome') {
      alert('ウェルカムメッセージは削除できません。無効化する場合は、編集画面で「有効化」のチェックを外してください。');
      return;
    }

    if (messageType === 'completion') {
      alert('申込完了メッセージは削除できません。無効化する場合は、編集画面で「有効化」のチェックを外してください。');
      return;
    }

    if (!confirm('このステップメッセージを削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'step_message_templates', templateId));
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const welcomeTemplates = templates.filter((t) => t.messageType === 'welcome');
  const completionTemplates = templates.filter((t) => t.messageType === 'completion');
  const afterSeminarTemplates = templates.filter((t) => t.messageType === 'after-seminar');
  const generalTemplates = templates.filter((t) => t.messageType === 'general');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ステップ配信設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            カードをクリックして編集できます
          </p>
        </div>
        {templates.length === 0 && (
          <Button variant="outline" onClick={handleImportDefaults}>
            <Sparkles className="h-4 w-4 mr-2" />
            デフォルトをインポート
          </Button>
        )}
      </div>

      {/* ウェルカムメッセージセクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">ウェルカムメッセージ</h3>
          </div>
          <p className="text-sm text-gray-600">友だち追加時に送信</p>
        </div>

        {welcomeTemplates.length === 0 ? (
          <Card
            className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all border-dashed"
            onClick={() => handleOpenDialog(undefined, 'welcome')}
          >
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                ウェルカムメッセージを設定
              </h4>
              <p className="text-sm text-gray-500">
                クリックして設定する
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {welcomeTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                onClick={() => handleOpenDialog(template)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">友だち追加時</h4>
                        <p className="text-xs text-gray-500">友だち追加直後に送信</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!template.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          無効
                        </span>
                      )}
                      {template.isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          有効
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-hidden">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-4">
                      {template.message}
                    </pre>
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-xs text-blue-600">クリックして編集 →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 申込完了メッセージセクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">申込完了メッセージ</h3>
          </div>
          <p className="text-sm text-gray-600">申込直後に送信</p>
        </div>

        {completionTemplates.length === 0 ? (
          <Card
            className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all border-dashed"
            onClick={() => handleOpenDialog(undefined, 'completion')}
          >
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                申込完了メッセージを設定
              </h4>
              <p className="text-sm text-gray-500 mb-2">
                申込直後に送信されるメッセージ
              </p>
              <p className="text-xs text-gray-400">
                {'{plan}'}, {'{datetime}'}, {'{time}'} が利用可能
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {completionTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
                onClick={() => handleOpenDialog(template)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">申込完了時</h4>
                        <p className="text-xs text-gray-500">申込直後に送信</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!template.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          無効
                        </span>
                      )}
                      {template.isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          有効
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-hidden">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-4">
                      {template.message}
                    </pre>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>使用可能な変数:</p>
                      <p className="font-mono">{'{plan}'} = プラン名</p>
                      <p className="font-mono">{'{datetime}'} = 日時</p>
                      <p className="font-mono">{'{time}'} = 時刻のみ</p>
                    </div>
                    <span className="text-xs text-green-600">クリックして編集 →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 申込後メッセージセクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">申込後メッセージ</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenDialog(undefined, 'after-seminar')}
          >
            <Plus className="h-4 w-4 mr-1" />
            メッセージを追加
          </Button>
        </div>

        {afterSeminarTemplates.length === 0 ? (
          <Card
            className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all border-dashed"
            onClick={() => handleOpenDialog(undefined, 'after-seminar')}
          >
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                申込後メッセージを追加
              </h4>
              <p className="text-sm text-gray-500">
                申し込んだ人向けのフォローメッセージ
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {afterSeminarTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                onClick={() => handleOpenDialog(template)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">
                          {template.stepNumber}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">ステップ {template.stepNumber}</h4>
                        <p className="text-xs text-gray-500">申込 {template.delayDays}日後</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!template.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          無効
                        </span>
                      )}
                      {template.isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          有効
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id!, template.messageType);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans line-clamp-3">
                      {template.message}
                    </pre>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-purple-600">クリックして編集 →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 一般向けメッセージセクション */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">一般向けメッセージ</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenDialog(undefined, 'general')}
          >
            <Plus className="h-4 w-4 mr-1" />
            メッセージを追加
          </Button>
        </div>

        {generalTemplates.length === 0 ? (
          <Card
            className="cursor-pointer hover:border-orange-400 hover:shadow-md transition-all border-dashed"
            onClick={() => handleOpenDialog(undefined, 'general')}
          >
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                一般向けメッセージを追加
              </h4>
              <p className="text-sm text-gray-500">
                まだ申し込んでいない人向けのメッセージ
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generalTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-orange-400 hover:shadow-md transition-all"
                onClick={() => handleOpenDialog(template)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">
                          {template.stepNumber}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">ステップ {template.stepNumber}</h4>
                        <p className="text-xs text-gray-500">{template.delayDays}日後</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!template.isActive && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          無効
                        </span>
                      )}
                      {template.isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                          有効
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(template.id!, template.messageType);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans line-clamp-3">
                      {template.message}
                    </pre>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-orange-600">クリックして編集 →</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'メッセージを編集' : 'メッセージを作成'}
            </DialogTitle>
            <DialogDescription>
              {formData.messageType === 'welcome' && '友だち追加時に送信されるメッセージ'}
              {formData.messageType === 'completion' && '申込完了直後に送信されるメッセージ（変数: {plan}, {datetime}, {time}）'}
              {formData.messageType === 'after-seminar' && '申込後に送信されるメッセージ'}
              {formData.messageType === 'general' && 'まだ申し込んでいない人向けのメッセージ'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* テンプレート選択 */}
            <div>
              <Label htmlFor="template">メッセージテンプレート</Label>
              <select
                id="template"
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">-- ひな形を選択 --</option>
                {messageTemplates[formData.messageType as keyof typeof messageTemplates]?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ひな形を選択すると、メッセージ欄に自動入力されます
              </p>
            </div>

            {formData.messageType !== 'welcome' && formData.messageType !== 'completion' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stepNumber">ステップ番号</Label>
                  <Input
                    id="stepNumber"
                    type="number"
                    min="1"
                    value={formData.stepNumber}
                    onChange={(e) => setFormData({ ...formData, stepNumber: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="delayDays">
                    {formData.messageType === 'after-seminar' ? '申込後の日数' : '友だち追加後の日数'}
                  </Label>
                  <Input
                    id="delayDays"
                    type="number"
                    min="0"
                    value={formData.delayDays}
                    onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="message">メッセージ内容</Label>
              <textarea
                id="message"
                rows={14}
                className="w-full px-3 py-2 border rounded-md font-sans text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="ここにメッセージを入力してください..."
              />
              <p className="text-xs text-gray-500 mt-1">
                改行や絵文字も使用できます
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                このメッセージを有効にする
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
