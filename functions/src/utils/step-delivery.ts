import { Timestamp } from 'firebase-admin/firestore';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { StepDelivery } from '../types';
import { getAllSteps, getStepMessage, getStepDelayDays } from '../config/step-messages';
import * as timezone from './timezone';

const TIMEZONE = 'Asia/Tokyo';

export interface StepMessageTemplate {
  stepNumber: number;
  delayDays: number;
  timeOfDay: string; // Format: "HH:mm"
  message: string;
  isActive: boolean;
}

/**
 * Get step message templates for an organization
 * @param db Firestore instance
 * @param organizationId Organization ID
 * @returns Array of step message templates
 */
export async function getStepMessageTemplates(
  db: FirebaseFirestore.Firestore,
  organizationId: string
): Promise<StepMessageTemplate[]> {
  try {
    const snapshot = await db
      .collection('step_message_templates')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .orderBy('stepNumber', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data()) as StepMessageTemplate[];
  } catch (error) {
    console.error('Error fetching step message templates:', error);
    return [];
  }
}

/**
 * ステップ配信スケジュールを作成（カスタムテンプレートを使用）
 *
 * @param db Firestore インスタンス
 * @param applicationId 申込ID
 * @param userId LINE ユーザーID
 * @param seminarDate セミナー開催日時（Timestamp）
 * @param organizationId 組織ID
 * @param plan プラン名（変数置換用）
 * @param templates カスタムテンプレート（オプション）
 * @returns ステップ配信のデータ配列
 */
export async function createStepDeliverySchedule(
  db: FirebaseFirestore.Firestore,
  applicationId: string,
  userId: string,
  seminarDate: Timestamp,
  organizationId: string,
  plan: string,
  templates?: StepMessageTemplate[]
): Promise<Omit<StepDelivery, 'id'>[]> {
  const now = Timestamp.now();
  const deliveries: Omit<StepDelivery, 'id'>[] = [];

  // カスタムテンプレートを取得（渡されていない場合）
  if (!templates || templates.length === 0) {
    templates = await getStepMessageTemplates(db, organizationId);
  }

  // カスタムテンプレートがある場合はそれを使用
  if (templates && templates.length > 0) {
    console.log(`Creating ${templates.length} custom step deliveries for organization: ${organizationId}`);

    for (const template of templates) {
      // セミナー日時をJSTに変換
      const seminarJsDate = seminarDate.toDate();
      const seminarJst = toZonedTime(seminarJsDate, TIMEZONE);

      // セミナー日時 + 遅延日数
      const targetDate = addDays(seminarJst, template.delayDays);
      const dayStart = startOfDay(targetDate);

      // 時刻を設定（例: "14:00"）
      const [hours, minutes] = template.timeOfDay.split(':').map(Number);
      const scheduledJst = setMinutes(setHours(dayStart, hours), minutes);

      // JSTをUTCに変換
      const scheduledUtc = fromZonedTime(scheduledJst, TIMEZONE);
      const scheduledAt = Timestamp.fromDate(scheduledUtc);

      // Replace variables in message
      const message = template.message
        .replace(/\{plan\}/g, plan)
        .replace(/\{time\}/g, timezone.formatTimeOnly(seminarDate))
        .replace(/\{datetime\}/g, timezone.formatDateTimeWithDayOfWeek(seminarDate));

      deliveries.push({
        applicationId,
        userId,
        stepNumber: template.stepNumber,
        scheduledAt,
        sentAt: null,
        status: 'pending',
        message,
        organizationId,
        createdAt: now,
      });
    }
  } else {
    // フォールバック: デフォルトの設定を使用
    console.log(`Using default step deliveries for organization: ${organizationId}`);

    for (const stepNumber of getAllSteps()) {
      const delayDays = getStepDelayDays(stepNumber);
      const message = getStepMessage(stepNumber);

      // シンプルにUTC時刻で日数を追加（タイムゾーン変換不要）
      const seminarJsDate = seminarDate.toDate();
      const scheduledJsDate = addDays(seminarJsDate, delayDays);
      const scheduledAt = Timestamp.fromDate(scheduledJsDate);

      deliveries.push({
        applicationId,
        userId,
        stepNumber,
        scheduledAt,
        sentAt: null,
        status: 'pending',
        message,
        organizationId,
        createdAt: now,
      });
    }
  }

  return deliveries;
}

/**
 * 送信予定のステップ配信を取得
 *
 * @param db Firestore インスタンス
 * @returns 送信予定のステップ配信リスト
 */
export async function getPendingStepDeliveries(
  db: FirebaseFirestore.Firestore
): Promise<StepDelivery[]> {
  const now = Timestamp.now();

  const snapshot = await db
    .collection('step_deliveries')
    .where('scheduledAt', '<=', now)
    .where('sentAt', '==', null)
    .where('status', '==', 'pending')
    .limit(100) // バッチサイズ制限
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as StepDelivery[];
}

/**
 * ステップ配信を送信中としてマーク（競合防止）
 *
 * @param db Firestore インスタンス
 * @param deliveryId ステップ配信ID
 */
export async function markStepDeliveryAsSending(
  db: FirebaseFirestore.Firestore,
  deliveryId: string
): Promise<void> {
  await db.collection('step_deliveries').doc(deliveryId).update({
    status: 'sending',
  });
}

/**
 * ステップ配信を送信済みとしてマーク
 *
 * @param db Firestore インスタンス
 * @param deliveryId ステップ配信ID
 */
export async function markStepDeliveryAsSent(
  db: FirebaseFirestore.Firestore,
  deliveryId: string
): Promise<void> {
  const now = Timestamp.now();

  await db.collection('step_deliveries').doc(deliveryId).update({
    sentAt: now,
    status: 'sent',
  });
}

/**
 * ステップ配信をスキップ済みとしてマーク
 *
 * @param db Firestore インスタンス
 * @param deliveryId ステップ配信ID
 */
export async function markStepDeliveryAsSkipped(
  db: FirebaseFirestore.Firestore,
  deliveryId: string
): Promise<void> {
  await db.collection('step_deliveries').doc(deliveryId).update({
    status: 'skipped',
  });
}

/**
 * ステップ配信をpendingに戻す（リトライ用）
 *
 * @param db Firestore インスタンス
 * @param deliveryId ステップ配信ID
 */
export async function markStepDeliveryAsPending(
  db: FirebaseFirestore.Firestore,
  deliveryId: string
): Promise<void> {
  await db.collection('step_deliveries').doc(deliveryId).update({
    status: 'pending',
  });
}

/**
 * 申込に紐づく全てのステップ配信をスキップ
 *
 * @param db Firestore インスタンス
 * @param applicationId 申込ID
 */
export async function skipAllStepDeliveriesForApplication(
  db: FirebaseFirestore.Firestore,
  applicationId: string
): Promise<void> {
  const snapshot = await db
    .collection('step_deliveries')
    .where('applicationId', '==', applicationId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'skipped' });
  });

  await batch.commit();
}

/**
 * ユーザーの全てのステップ配信をスキップ
 *
 * @param db Firestore インスタンス
 * @param userId LINE ユーザーID
 */
export async function skipAllStepDeliveriesForUser(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<void> {
  const snapshot = await db
    .collection('step_deliveries')
    .where('userId', '==', userId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: 'skipped' });
  });

  await batch.commit();
}
