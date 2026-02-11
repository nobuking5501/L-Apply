import { Timestamp } from 'firebase-admin/firestore';
import {
  generateCompletionMessage,
  generateT24hReminderMessage,
  generateDayOfReminderMessage,
  generateCancellationMessage,
  generateNoReservationMessage,
  generateReservationConfirmationMessage,
  generateConsentUpdateMessage,
  generateUnknownCommandMessage,
} from '../utils/messages';

// Mock config
jest.mock('../config', () => ({
  getConfig: () => ({
    line: {
      channelAccessToken: 'test_token',
      channelSecret: 'test_secret',
    },
    liff: {
      id: 'test_liff_id',
    },
    app: {
      baseUrl: 'https://test-app.web.app',
    },
  }),
}));

describe('Message utilities', () => {
  const testTimestamp = Timestamp.fromDate(new Date('2025-11-01T10:00:00Z'));

  describe('generateCompletionMessage', () => {
    it('should generate completion message', () => {
      const message = generateCompletionMessage('ベーシックプラン', testTimestamp);

      expect(message).toContain('お申し込みありがとうございます');
      expect(message).toContain('ベーシックプラン');
      expect(message).toContain('リマインダーをお送りします');
    });

    it('should use custom template when provided', () => {
      const template = 'お申し込みありがとうございます！{plan} {datetime} 詳細: https://test-app.web.app';
      const message = generateCompletionMessage('ベーシックプラン', testTimestamp, template);

      expect(message).toContain('ベーシックプラン');
      expect(message).toContain('https://test-app.web.app');
    });
  });

  describe('generateT24hReminderMessage', () => {
    it('should generate T-24h reminder message', () => {
      const message = generateT24hReminderMessage('スタンダードプラン', testTimestamp);

      expect(message).toContain('明日');
      expect(message).toContain('スタンダードプラン');
      expect(message).toContain('キャンセル');
    });
  });

  describe('generateDayOfReminderMessage', () => {
    it('should generate day-of reminder message', () => {
      const message = generateDayOfReminderMessage('プレミアムプラン', testTimestamp);

      expect(message).toContain('本日');
      expect(message).toContain('プレミアムプラン');
      expect(message).toContain('5分前');
    });
  });

  describe('generateCancellationMessage', () => {
    it('should generate cancellation message', () => {
      const message = generateCancellationMessage(testTimestamp);

      expect(message).toContain('キャンセルしました');
    });
  });

  describe('generateNoReservationMessage', () => {
    it('should generate no reservation message', () => {
      const message = generateNoReservationMessage();

      expect(message).toContain('予約は登録されていません');
    });
  });

  describe('generateReservationConfirmationMessage', () => {
    it('should generate reservation confirmation message', () => {
      const message = generateReservationConfirmationMessage('ベーシックプラン', testTimestamp);

      expect(message).toContain('現在の予約状況');
      expect(message).toContain('ベーシックプラン');
    });
  });

  describe('generateConsentUpdateMessage', () => {
    it('should generate consent enabled message', () => {
      const message = generateConsentUpdateMessage(true);

      expect(message).toContain('通知を再開');
    });

    it('should generate consent disabled message', () => {
      const message = generateConsentUpdateMessage(false);

      expect(message).toContain('通知を停止');
    });
  });

  describe('generateUnknownCommandMessage', () => {
    it('should generate unknown command message', () => {
      const message = generateUnknownCommandMessage();

      expect(message).toContain('ご利用可能なコマンド');
      expect(message).toContain('予約確認');
      expect(message).toContain('キャンセル');
    });
  });
});
