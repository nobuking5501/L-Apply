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
import { Plus, Edit, Trash2, Save, MessageSquare } from 'lucide-react';

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
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
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
    if (!userData?.organizationId) return;

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
  }, [userData]);

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
    if (!userData?.organizationId) return;

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
    if (!userData?.organizationId) return;
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
    <div className="space-y-6">
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
