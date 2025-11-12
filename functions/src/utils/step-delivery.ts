import { Timestamp } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { StepDelivery } from '../types';
import { getAllSteps, getStepMessage, getStepDelayDays } from '../config/step-messages';

const TIMEZONE = 'Asia/Tokyo';

/**
 * ステップ配信スケジュールを作成
 *
 * @param applicationId 申込ID
 * @param userId LINE ユーザーID
 * @param seminarDate セミナー開催日時（Timestamp）
 * @param organizationId 組織ID
 * @returns ステップ配信のデータ配列
 */
export function createStepDeliverySchedule(
  applicationId: string,
  userId: string,
  seminarDate: Timestamp,
  organizationId: string
): Omit<StepDelivery, 'id'>[] {
  const seminarJsDate = seminarDate.toDate();
  const now = Timestamp.now();

  const deliveries: Omit<StepDelivery, 'id'>[] = [];

  // すべてのステップを作成
  for (const stepNumber of getAllSteps()) {
    const delayDays = getStepDelayDays(stepNumber);
    const message = getStepMessage(stepNumber);

    // セミナー日時 + 遅延日数で送信日時を計算
    const scheduledJsDate = addDays(seminarJsDate, delayDays);

    // JST の日時を UTC の Timestamp に変換
    const scheduledUtcDate = fromZonedTime(scheduledJsDate, TIMEZONE);
    const scheduledAt = Timestamp.fromDate(scheduledUtcDate);

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
