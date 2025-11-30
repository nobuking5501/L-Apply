'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Clock, Save, Sparkles } from 'lucide-react';

interface ReminderTemplate {
  id?: string;
  organizationId: string;
  reminderType: string;
  delayDays: number;      // How many days before the seminar
  timeOfDay: string;      // Time of day to send (HH:mm format)
  message: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export default function RemindersPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReminderTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReminderTemplate | null>(null);
  const [formData, setFormData] = useState<Omit<ReminderTemplate, 'id' | 'organizationId' | 'createdAt'>>({
    reminderType: 'T-24h',
    delayDays: 1,
    timeOfDay: '08:00',
    message: '',
    isActive: true,
  });

  // デフォルトのリマインダーメッセージ
  const defaultMessages = [
    {
      reminderType: 'T-24h' as const,
      delayDays: 1,
      timeOfDay: '14:00',
      message: `⏰ 【リマインダー】明日{time}から開始です

{plan}

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

ご都合が悪い場合は「キャンセル」と返信ください。`,
      isActive: true,
    },
    {
      reminderType: 'day-of' as const,
      delayDays: 0,
      timeOfDay: '08:00',
      message: `🔔 【本日開催】{time}スタートです

{plan}

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

5分前にはZoomに接続してご準備をお願いします！`,
      isActive: true,
    },
  ];

  const fetchTemplates = async () => {
    if (!userData?.organizationId) return;

    try {
      const templatesQuery = query(
        collection(db, 'reminder_message_templates'),
        where('organizationId', '==', userData.organizationId)
      );
      const snapshot = await getDocs(templatesQuery);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ReminderTemplate[];

      // Sort: T-24h first, then day-of
      templatesData.sort((a, b) => {
        if (a.reminderType === 'T-24h' && b.reminderType === 'day-of') return -1;
        if (a.reminderType === 'day-of' && b.reminderType === 'T-24h') return 1;
        return 0;
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

  const handleImportDefaults = async () => {
    if (!userData?.organizationId) return;
    if (!confirm('デフォルトのリマインダーメッセージをインポートしますか？')) {
      return;
    }

    try {
      for (const msg of defaultMessages) {
        const templateData: ReminderTemplate = {
          ...msg,
          organizationId: userData.organizationId,
          createdAt: new Date(),
        };
        const newDocRef = doc(collection(db, 'reminder_message_templates'));
        await setDoc(newDocRef, templateData);
      }

      fetchTemplates();
      alert('デフォルトメッセージをインポートしました');
    } catch (error) {
      console.error('Error importing defaults:', error);
      alert('インポートに失敗しました');
    }
  };

  const handleOpenDialog = (template: ReminderTemplate) => {
    setEditingTemplate(template);
    setFormData({
      reminderType: template.reminderType,
      delayDays: template.delayDays,
      timeOfDay: template.timeOfDay,
      message: template.message,
      isActive: template.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!userData?.organizationId || !editingTemplate?.id) return;

    try {
      const templateData: ReminderTemplate = {
        ...formData,
        organizationId: userData.organizationId,
        createdAt: editingTemplate.createdAt,
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'reminder_message_templates', editingTemplate.id), templateData);

      fetchTemplates();
      setDialogOpen(false);
      setEditingTemplate(null);
      alert('保存しました');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('保存に失敗しました');
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

  const t24hTemplate = templates.find((t) => t.reminderType === 'T-24h');
  const dayOfTemplate = templates.find((t) => t.reminderType === 'day-of');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">リマインダー設定</h2>
          <p className="text-sm text-gray-600 mt-1">
            セミナー前に送信されるリマインダーメッセージを設定できます
          </p>
        </div>
        {templates.length === 0 && (
          <Button variant="outline" onClick={handleImportDefaults}>
            <Sparkles className="h-4 w-4 mr-2" />
            デフォルトをインポート
          </Button>
        )}
      </div>

      {/* T-24h Reminder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">T-24hリマインダー</h3>
          </div>
          <p className="text-sm text-gray-600">セミナー24時間前に送信</p>
        </div>

        {!t24hTemplate ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                リマインダーメッセージを設定
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                「デフォルトをインポート」ボタンでメッセージを作成できます
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
            onClick={() => handleOpenDialog(t24hTemplate)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">24時間前</h4>
                    <p className="text-xs text-gray-500">セミナー開始の24時間前に送信</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!t24hTemplate.isActive && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      無効
                    </span>
                  )}
                  {t24hTemplate.isActive && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                      有効
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-hidden">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-4">
                  {t24hTemplate.message}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>使用可能な変数:</p>
                  <p className="font-mono">{'{plan}'} = プラン名</p>
                  <p className="font-mono">{'{time}'} = 時刻</p>
                </div>
                <span className="text-xs text-blue-600">クリックして編集 →</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Day-of Reminder */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">当日朝リマインダー</h3>
          </div>
          <p className="text-sm text-gray-600">セミナー当日朝8時に送信</p>
        </div>

        {!dayOfTemplate ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h4 className="text-base font-medium text-gray-900 mb-1">
                リマインダーメッセージを設定
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                「デフォルトをインポート」ボタンでメッセージを作成できます
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="cursor-pointer hover:border-green-400 hover:shadow-md transition-all"
            onClick={() => handleOpenDialog(dayOfTemplate)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Bell className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">当日朝8時</h4>
                    <p className="text-xs text-gray-500">セミナー当日の朝8時に送信</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!dayOfTemplate.isActive && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      無効
                    </span>
                  )}
                  {dayOfTemplate.isActive && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                      有効
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-32 overflow-hidden">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans line-clamp-4">
                  {dayOfTemplate.message}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-500 space-y-1">
                  <p>使用可能な変数:</p>
                  <p className="font-mono">{'{plan}'} = プラン名</p>
                  <p className="font-mono">{'{time}'} = 時刻</p>
                </div>
                <span className="text-xs text-green-600">クリックして編集 →</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 編集モーダル */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>リマインダーメッセージを編集</DialogTitle>
            <DialogDescription>
              {formData.reminderType === 'T-24h' && 'セミナー開始の24時間前に送信されます'}
              {formData.reminderType === 'day-of' && 'セミナー当日の朝8時に送信されます'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Timing Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="delayDays">何日前に送信</Label>
                <input
                  id="delayDays"
                  type="number"
                  min="0"
                  max="30"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={formData.delayDays}
                  onChange={(e) => setFormData({ ...formData, delayDays: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = 当日、1 = 1日前、2 = 2日前...
                </p>
              </div>
              <div>
                <Label htmlFor="timeOfDay">送信時刻</Label>
                <input
                  id="timeOfDay"
                  type="time"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  24時間形式（例: 14:00）
                </p>
              </div>
            </div>

            {/* Example */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs font-medium text-blue-900 mb-1">📌 送信タイミングの例</p>
              <p className="text-xs text-blue-700">
                {formData.delayDays === 0
                  ? `セミナー当日の ${formData.timeOfDay} に送信`
                  : `セミナーの ${formData.delayDays} 日前の ${formData.timeOfDay} に送信`}
              </p>
            </div>

            <div>
              <Label htmlFor="message">メッセージ内容</Label>
              <textarea
                id="message"
                rows={12}
                className="w-full px-3 py-2 border rounded-md font-sans text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="ここにメッセージを入力してください..."
              />
              <p className="text-xs text-gray-500 mt-1">
                使用可能な変数: {'{plan}'}, {'{time}'}
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
                このリマインダーを有効にする
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
