import { Timestamp } from 'firebase-admin/firestore';
import {
  toJapanTimeString,
  parseISOToTimestamp,
  calculateT24hReminder,
  calculateDayOfReminder,
  formatTimeOnly,
  formatDateJapanese,
} from '../utils/timezone';

describe('Timezone utilities', () => {
  describe('toJapanTimeString', () => {
    it('should format timestamp to Japan time string', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-11-01T10:30:00Z'));
      const result = toJapanTimeString(timestamp, 'yyyy/MM/dd HH:mm');

      // 2025-11-01T10:30:00Z = 2025-11-01T19:30:00+09:00
      expect(result).toBe('2025/11/01 19:30');
    });
  });

  describe('parseISOToTimestamp', () => {
    it('should parse ISO string to Timestamp', () => {
      const isoString = '2025-11-01T10:30:00';
      const timestamp = parseISOToTimestamp(isoString);

      expect(timestamp).toBeInstanceOf(Timestamp);
      expect(timestamp.toDate().toISOString()).toContain('2025-11-01');
    });

    it('should throw error for invalid ISO string', () => {
      expect(() => parseISOToTimestamp('invalid')).toThrow('Invalid date string');
    });
  });

  describe('calculateT24hReminder', () => {
    it('should calculate 24 hours before slot time', () => {
      const slotAt = Timestamp.fromDate(new Date('2025-11-02T10:00:00Z'));
      const reminder = calculateT24hReminder(slotAt);

      const expectedDate = new Date('2025-11-01T10:00:00Z');
      expect(reminder.toDate().getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('calculateDayOfReminder', () => {
    it('should calculate 8 AM on the same day', () => {
      // Slot at 14:00 JST (05:00 UTC)
      const slotAt = Timestamp.fromDate(new Date('2025-11-01T05:00:00Z'));
      const reminder = calculateDayOfReminder(slotAt);

      // Expected: 8 AM JST on 2025-11-01
      const result = toJapanTimeString(reminder, 'yyyy/MM/dd HH:mm');
      expect(result).toBe('2025/11/01 08:00');
    });
  });

  describe('formatTimeOnly', () => {
    it('should format time only', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-11-01T01:30:00Z'));
      const result = formatTimeOnly(timestamp);

      // 2025-11-01T01:30:00Z = 2025-11-01T10:30:00+09:00
      expect(result).toBe('10:30');
    });
  });

  describe('formatDateJapanese', () => {
    it('should format date in Japanese', () => {
      const timestamp = Timestamp.fromDate(new Date('2025-11-01T00:00:00Z'));
      const result = formatDateJapanese(timestamp);

      expect(result).toContain('2025年');
      expect(result).toContain('月');
      expect(result).toContain('日');
    });
  });
});
