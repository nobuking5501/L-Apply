import { Timestamp } from 'firebase-admin/firestore';
import { toJapanTimeString, formatTimeOnly, formatDateTimeWithDayOfWeek } from './timezone';
import { getConfig } from '../config';

/**
 * Generate application completion message
 * If template is provided, use it with variable substitution
 * Otherwise, use default message
 */
export function generateCompletionMessage(
  plan: string,
  slotAt: Timestamp,
  template?: string | null
): string {
  const slotStr = formatDateTimeWithDayOfWeek(slotAt);
  const timeStr = formatTimeOnly(slotAt);

  if (template) {
    // Replace variables in template
    return template
      .replace(/\{plan\}/g, plan)
      .replace(/\{datetime\}/g, slotStr)
      .replace(/\{time\}/g, timeStr);
  }

  // Default message
  return `✅ お申し込みありがとうございます！

【セミナー情報】
${plan}
📅 ${slotStr}

【参加方法】
以下のZoomリンクからご参加ください。

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

※前日と当日にリマインダーをお送りします。

ご不明点はこのトークに返信してください。`;
}

/**
 * Generate T-24h reminder message
 */
export function generateT24hReminderMessage(plan: string, slotAt: Timestamp): string {
  const timeStr = formatTimeOnly(slotAt);

  return `⏰ 【リマインダー】明日${timeStr}から開始です

${plan}

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

ご都合が悪い場合は「キャンセル」と返信ください。`;
}

/**
 * Generate day-of reminder message
 */
export function generateDayOfReminderMessage(plan: string, slotAt: Timestamp): string {
  const timeStr = formatTimeOnly(slotAt);

  return `🔔 【本日開催】${timeStr}スタートです

${plan}

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

5分前にはZoomに接続してご準備をお願いします！`;
}

/**
 * Generate cancellation confirmation message
 */
export function generateCancellationMessage(slotAt: Timestamp): string {
  const slotStr = formatDateTimeWithDayOfWeek(slotAt);

  return `ご予約をキャンセルしました。

キャンセル対象：${slotStr}

またのご利用をお待ちしております。`;
}

/**
 * Generate no reservation message
 */
export function generateNoReservationMessage(): string {
  return '現在、予約は登録されていません。';
}

/**
 * Generate reservation confirmation message
 */
export function generateReservationConfirmationMessage(plan: string, slotAt: Timestamp): string {
  const slotStr = formatDateTimeWithDayOfWeek(slotAt);

  return `📋 現在の予約状況

【セミナー情報】
${plan}
📅 ${slotStr}

🔗 Zoomリンク
https://us06web.zoom.us/j/87121074742?pwd=fkDi1VODGlqbs7jmseQFoI7FXhqqdd.1

ミーティングID: 871 2107 4742
パスコード: 300798

キャンセルをご希望の場合は「キャンセル」と返信してください。`;
}

/**
 * Generate consent update message
 */
export function generateConsentUpdateMessage(enabled: boolean): string {
  if (enabled) {
    return '通知を再開しました。今後、予約のリマインダーが送信されます。';
  } else {
    return '通知を停止しました。今後、自動リマインダーは送信されません。\n\n再開をご希望の場合は「再開」または「停止解除」と返信してください。';
  }
}

/**
 * Generate unknown command message
 */
export function generateUnknownCommandMessage(): string {
  return `ご利用可能なコマンド：
・「予約確認」- 現在の予約を確認
・「キャンセル」- 予約をキャンセル
・「配信停止」- 通知を停止
・「再開」または「停止解除」- 通知を再開`;
}
