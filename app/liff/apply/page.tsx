'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import styles from './apply.module.css';

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';
const APPLY_API_URL = process.env.NEXT_PUBLIC_APPLY_API_URL || '';

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

  const [formData, setFormData] = useState<FormData>({
    plan: '',
    slotAt: '',
    notes: '',
    consent: true,
  });

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
      if (!liff.isLoggedIn()) {
        throw new Error('Not logged in');
      }

      const idToken = liff.getIDToken();
      if (!idToken) {
        throw new Error('Failed to get ID token');
      }

      // Fixed values for this seminar
      const seminarPlan = 'AI×コピペアプリ開発無料体験セミナー';
      const seminarDate = '2025-11-15T21:00:00+09:00'; // Japan Standard Time (JST)

      // Call apply API
      const response = await fetch(APPLY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          liffId: LIFF_ID, // Added for multi-tenant support
          plan: seminarPlan,
          slotAt: seminarDate,
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

  if (!isLiffReady) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>AI×コピペアプリ開発<br/>無料体験セミナー 申込</h1>

      <div className={styles.seminarInfo}>
        <h2>セミナー情報</h2>
        <p><strong>📅 日時：</strong>2025年11月15日（土）21:00～22:30</p>
        <p><strong>💻 参加方法：</strong>オンライン（Zoom）</p>
        <p><strong>💰 参加費：</strong>無料</p>
        <div className={styles.zoomInfo}>
          <p><strong>Zoom情報：</strong></p>
          <p>ミーティングID: 871 2107 4742</p>
          <p>パスコード: 300798</p>
          <a
            href="https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.zoomLink}
          >
            Zoomリンクを開く
          </a>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
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
            placeholder="セミナーに期待することや、質問があればご記入ください"
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

        <button type="submit" disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? '送信中...' : 'セミナーに申込む'}
        </button>
      </form>
    </div>
  );
}
