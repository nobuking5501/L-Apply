'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, MapPin, Calendar, Users } from 'lucide-react';
import type { Event } from '@/types';

export default function EventsPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    slots: [{ date: '', time: '', maxCapacity: 10, currentCapacity: 0 }],
    isActive: true,
  });

  useEffect(() => {
    if (!userData?.organizationId) return;

    const fetchEvents = async () => {
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizationId', '==', userData.organizationId),
          orderBy('createdAt', 'desc')
        );
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[];

        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userData]);

  const handleCreateEvent = async () => {
    if (!userData?.organizationId) return;

    try {
      const slotsWithIds = formData.slots.map((slot, index) => ({
        ...slot,
        id: `slot-${Date.now()}-${index}`,
      }));

      await addDoc(collection(db, 'events'), {
        ...formData,
        slots: slotsWithIds,
        organizationId: userData.organizationId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        location: '',
        slots: [{ date: '', time: '', maxCapacity: 10, currentCapacity: 0 }],
        isActive: true,
      });
      setShowCreateModal(false);

      // Refresh events
      const eventsQuery = query(
        collection(db, 'events'),
        where('organizationId', '==', userData.organizationId),
        orderBy('createdAt', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error creating event:', error);
      alert('イベントの作成に失敗しました');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !userData?.organizationId) return;

    try {
      await updateDoc(doc(db, 'events', editingEvent.id), {
        ...formData,
        updatedAt: Timestamp.now(),
      });

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        location: '',
        slots: [{ date: '', time: '', maxCapacity: 10, currentCapacity: 0 }],
        isActive: true,
      });
      setEditingEvent(null);

      // Refresh events
      const eventsQuery = query(
        collection(db, 'events'),
        where('organizationId', '==', userData.organizationId),
        orderBy('createdAt', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error updating event:', error);
      alert('イベントの更新に失敗しました');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('このイベントを削除してもよろしいですか？')) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));

      // Refresh events
      setEvents(events.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('イベントの削除に失敗しました');
    }
  };

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      location: event.location,
      slots: event.slots || [],
      isActive: event.isActive,
    });
  };

  const addSlot = () => {
    setFormData({
      ...formData,
      slots: [...formData.slots, { date: '', time: '', maxCapacity: 10, currentCapacity: 0 }],
    });
  };

  const removeSlot = (index: number) => {
    setFormData({
      ...formData,
      slots: formData.slots.filter((_, i) => i !== index),
    });
  };

  const updateSlot = (index: number, field: string, value: any) => {
    const newSlots = [...formData.slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setFormData({ ...formData, slots: newSlots });
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
          <h2 className="text-2xl font-bold text-gray-900">イベント管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            イベントを作成・管理できます
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">総イベント数</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {events.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">公開中</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {events.filter((e) => e.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">非公開</div>
            <div className="text-2xl font-bold text-gray-600 mt-1">
              {events.filter((e) => !e.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>イベント一覧 ({events.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              イベントがありません
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-gray-900">
                          {event.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            event.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {event.isActive ? '公開中' : '非公開'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {event.slots?.length || 0} 枠
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingEvent) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingEvent ? 'イベント編集' : '新規イベント作成'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="セミナータイトル"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="イベントの詳細説明"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開催場所
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="会場名またはURL"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    開催枠
                  </label>
                  <Button size="sm" variant="outline" onClick={addSlot}>
                    <Plus className="h-4 w-4 mr-1" />
                    枠を追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.slots.map((slot, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateSlot(index, 'date', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        value={slot.time}
                        onChange={(e) => updateSlot(index, 'time', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={slot.maxCapacity}
                        onChange={(e) =>
                          updateSlot(index, 'maxCapacity', parseInt(e.target.value))
                        }
                        placeholder="定員"
                        className="w-24"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeSlot(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  公開する
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingEvent(null);
                    setFormData({
                      title: '',
                      description: '',
                      location: '',
                      slots: [{ date: '', time: '', maxCapacity: 10, currentCapacity: 0 }],
                      isActive: true,
                    });
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}
                >
                  {editingEvent ? '更新' : '作成'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
