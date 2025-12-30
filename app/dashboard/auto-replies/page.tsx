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
import { Plus, Edit, Trash2, Save, MessageSquare, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getDoc } from 'firebase/firestore';

interface AutoReply {
  id?: string;
  organizationId: string;
  trigger: string;
  message: string;
  isActive: boolean;
  createdAt: any;
  updatedAt?: any;
}

export default function AutoRepliesPage() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showLineSetupWarning, setShowLineSetupWarning] = useState(false);
  const [replies, setReplies] = useState<AutoReply[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null);

  const emptyReply: Omit<AutoReply, 'id' | 'organizationId' | 'createdAt'> = {
    trigger: '',
    message: '',
    isActive: true,
  };

  const [formData, setFormData] = useState(emptyReply);

  // デフォルトの自動返信
  const defaultReplies = [
    {
      trigger: '個別相談希望',
      message: '個別相談のお申し込みありがとうございます！\n\n日程調整をいたしますので少々お待ちください。\n\n担当者より24時間以内にご連絡させていただきます。',
      isActive: true,
    },
  ];

  const fetchReplies = async () => {
    if (!userData?.organizationId || !user) return;

    try {
      const repliesQuery = query(
        collection(db, 'auto_reply_messages'),
        where('organizationId', '==', userData.organizationId)
      );
      const snapshot = await getDocs(repliesQuery);
      const repliesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AutoReply[];

      repliesData.sort((a, b) => a.trigger.localeCompare(b.trigger));

      setReplies(repliesData);
    } catch (error) {
      console.error('Error fetching auto replies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies();
  }, [userData, user]);

  // Check LINE setup status
  useEffect(() => {
    if (!userData?.organizationId || !user) return;

    const checkLineSetup = async () => {
      try {
        const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
        if (!orgDoc.exists()) return;

        const orgData = orgDoc.data();
        const hasLineSetup = !!(orgData.lineChannelId && orgData.liffId);

        // Initially set warning based on organization data
        let shouldShowWarning = !hasLineSetup;

        try {
          const idToken = await user.getIdToken();
          const response = await fetch('/api/settings', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            const hasSecrets = data.secretsMetadata?.hasChannelSecret &&
                               data.secretsMetadata?.hasChannelAccessToken;

            shouldShowWarning = !hasLineSetup || !hasSecrets;
          }
        } catch (error) {
          console.error('Error fetching settings:', error);
        }

        // Set the warning state
        setShowLineSetupWarning(shouldShowWarning);
      } catch (error) {
        console.error('Error checking LINE setup:', error);
      }
    };

    checkLineSetup();
  }, [userData, user]);

  const handleOpenDialog = (reply?: AutoReply) => {
    if (reply) {
      setEditingReply(reply);
      setFormData({
        trigger: reply.trigger,
        message: reply.message,
        isActive: reply.isActive,
      });
    } else {
      setEditingReply(null);
      setFormData(emptyReply);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!userData?.organizationId || !user) return;

    if (!formData.trigger || !formData.message) {
      alert('トリガーとメッセージを入力してください');
      return;
    }

    try {
      const replyData: AutoReply = {
        ...formData,
        organizationId: userData.organizationId,
        createdAt: editingReply?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (editingReply?.id) {
        await setDoc(doc(db, 'auto_reply_messages', editingReply.id), replyData);
      } else {
        const newDocRef = doc(collection(db, 'auto_reply_messages'));
        await setDoc(newDocRef, replyData);
      }

      fetchReplies();
      setDialogOpen(false);
      setEditingReply(null);
      setFormData(emptyReply);
    } catch (error) {
      console.error('Error saving auto reply:', error);
      alert('保存に失敗しました');
    }
  };

  const handleDelete = async (replyId: string) => {
    if (!confirm('この自動返信を削除しますか？')) return;

    try {
      await deleteDoc(doc(db, 'auto_reply_messages', replyId));
      fetchReplies();
    } catch (error) {
      console.error('Error deleting auto reply:', error);
      alert('削除に失敗しました');
    }
  };

  const handleImportDefaults = async () => {
    if (!userData?.organizationId || !user) return;
    if (!confirm('デフォルトの自動返信をインポートしますか？\n既存のメッセージは削除されません。')) {
      return;
    }

    try {
      for (const reply of defaultReplies) {
        const replyData: AutoReply = {
          ...reply,
          organizationId: userData.organizationId,
          createdAt: new Date(),
        };
        const newDocRef = doc(collection(db, 'auto_reply_messages'));
        await setDoc(newDocRef, replyData);
      }

      fetchReplies();
      alert('デフォルトの自動返信をインポートしました');
    } catch (error) {
      console.error('Error importing defaults:', error);
      alert('インポートに失敗しました');
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

  return (
    <div className="relative space-y-6">
      {/* LINE Setup Blocking Overlay */}
      {showLineSetupWarning && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 border-amber-300 bg-white shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  LINE連携の設定が必要です
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  自動返信機能を使用するには、設定画面でLINE Messaging APIの認証情報を設定する必要があります。
                  <br /><br />
                  設定が完了するまで、自動返信機能はご利用いただけません。
                </p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                >
                  設定画面を開く
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">自動返信メッセージ</h2>
          <p className="text-sm text-gray-600 mt-1">
            特定のキーワードを受信したときの自動返信メッセージを設定できます
          </p>
        </div>
        <div className="flex space-x-2">
          {replies.length === 0 && (
            <Button variant="outline" onClick={handleImportDefaults}>
              デフォルトをインポート
            </Button>
          )}
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            新規作成
          </Button>
        </div>
      </div>

      {/* Auto Replies List */}
      {replies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              自動返信が設定されていません
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              ユーザーからのメッセージに自動で返信する設定を追加しましょう
            </p>
            <Button onClick={handleImportDefaults}>
              デフォルトをインポート
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {replies.map((reply) => (
            <Card
              key={reply.id}
              className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              onClick={() => handleOpenDialog(reply)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        「{reply.trigger}」
                      </h4>
                      <p className="text-xs text-gray-500">トリガーキーワード</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!reply.isActive && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        無効
                      </span>
                    )}
                    {reply.isActive && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">
                        有効
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(reply.id!);
                      }}
                      className="h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-h-24 overflow-hidden">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans line-clamp-3">
                    {reply.message}
                  </pre>
                </div>
                <div className="mt-2 text-right">
                  <span className="text-xs text-blue-600">クリックして編集 →</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 編集モーダル */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReply ? '自動返信を編集' : '自動返信を作成'}
            </DialogTitle>
            <DialogDescription>
              特定のキーワードを受信したときに自動で返信するメッセージを設定します
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trigger">トリガーキーワード</Label>
              <Input
                id="trigger"
                value={formData.trigger}
                onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                placeholder="例: 個別相談希望"
              />
              <p className="text-xs text-gray-500 mt-1">
                ユーザーがこのキーワードを送信したときに自動返信します
              </p>
            </div>

            <div>
              <Label htmlFor="message">返信メッセージ</Label>
              <textarea
                id="message"
                rows={10}
                className="w-full px-3 py-2 border rounded-md font-sans text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="自動返信するメッセージを入力してください..."
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
                この自動返信を有効にする
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
