'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './apply.module.css';

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
const APPLY_API_URL = process.env.NEXT_PUBLIC_APPLY_API_URL || '';

interface EventSlot {
  id: string;
  date: string;
  time: string;
  maxCapacity: number;
  currentCapacity: number;
}

interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  slots: EventSlot[];
}

interface FormData {
  plan: string;
  slotAt: string;
  notes: string;
  consent: boolean;
}

export default function ApplyPage() {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    plan: '',
    slotAt: '',
    notes: '',
    consent: true,
  });

  // Fetch active event
  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        // Get organization ID from LIFF ID
        const orgsQuery = query(
          collection(db, 'organizations'),
          where('liffId', '==', LIFF_ID),
          limit(1)
        );
        const orgsSnapshot = await getDocs(orgsQuery);

        if (orgsSnapshot.empty) {
          setError('組織情報が見つかりません');
          setLoadingEvent(false);
          return;
        }

        const organizationId = orgsSnapshot.docs[0].id;

        // Get active event for this organization
        const eventsQuery = query(
          collection(db, 'events'),
          where('organizationId', '==', organizationId),
          where('isActive', '==', true),
          limit(1)
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        if (eventsSnapshot.empty) {
          setError('現在公開中のイベントがありません');
          setLoadingEvent(false);
          return;
        }

        const eventData = eventsSnapshot.docs[0].data();
        setActiveEvent({
          id: eventsSnapshot.docs[0].id,
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          slots: eventData.slots || [],
        });
      } catch (err) {
        console.error('Error fetching active event:', err);
        setError('イベント情報の取得に失敗しました');
      } finally {
        setLoadingEvent(false);
      }
    };

    fetchActiveEvent();
  }, []);

  // Initialize LIFF
  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        setIsLiffReady(true);
      } catch (err) {
        console.error('LIFF initialization failed', err);
        setError('LIFFの初期化に失敗しました');
      }
    };

    initLiff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!activeEvent) {
        throw new Error('イベント情報がありません');
      }

      if (!selectedSlot) {
        throw new Error('日時を選択してください');
      }

      if (!liff.isLoggedIn()) {
        throw new Error('Not logged in');
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      // Find selected slot
      const slot = activeEvent.slots.find(s => s.id === selectedSlot);
      if (!slot) {
        throw new Error('選択された日時が見つかりません');
      }

      // Convert date and time to ISO format
      const slotDateTime = `${slot.date}T${slot.time}:00+09:00`;

      // Call apply API
      const response = await fetch(APPLY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          liffId: LIFF_ID,
          plan: activeEvent.title,
          slotAt: slotDateTime,
          notes: formData.notes,
          consent: formData.consent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setSuccess(true);

      // Close LIFF window after 2 seconds
      setTimeout(() => {
        liff.closeWindow();
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : '申込に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingEvent || !isLiffReady) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  if (error && !activeEvent) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <h2>申込完了</h2>
          <p>お申し込みありがとうございます！</p>
          <p>詳細はトークに送信しました。</p>
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>イベント情報が見つかりません</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{activeEvent.title}</h1>

      <div className={styles.seminarInfo}>
        <h2>イベント情報</h2>
        <p className={styles.description}>{activeEvent.description}</p>
        <p><strong>📍 開催場所：</strong>{activeEvent.location}</p>
        <p><strong>📅 開催日時：</strong></p>
        <ul className={styles.slotsList}>
          {activeEvent.slots.map((slot) => (
            <li key={slot.id}>
              {slot.date} {slot.time}
              {slot.currentCapacity >= slot.maxCapacity && <span className={styles.full}> (満席)</span>}
            </li>
          ))}
        </ul>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="slot" className={styles.label}>
            参加希望日時 <span className={styles.required}>*</span>
          </label>
          <select
            id="slot"
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className={styles.select}
            required
          >
            <option value="">選択してください</option>
            {activeEvent.slots.map((slot) => {
              const isFull = slot.currentCapacity >= slot.maxCapacity;
              return (
                <option key={slot.id} value={slot.id} disabled={isFull}>
                  {slot.date} {slot.time} {isFull ? '(満席)' : `(残り${slot.maxCapacity - slot.currentCapacity}席)`}
                </option>
              );
            })}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.label}>
            参加動機・ご質問など（任意）
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className={styles.textarea}
            rows={4}
            placeholder="イベントに期待することや、質問があればご記入ください"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              className={styles.checkbox}
            />
            <span>リマインダー通知を受け取る（前日・当日にLINEで通知します）</span>
          </label>
        </div>

        <button type="submit" disabled={isSubmitting || !selectedSlot} className={styles.submitButton}>
          {isSubmitting ? '送信中...' : 'イベントに申込む'}
        </button>
      </form>
    </div>
  );
}
