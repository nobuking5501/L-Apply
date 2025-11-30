import { Timestamp } from 'firebase-admin/firestore';
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'Asia/Tokyo';

export interface ReminderTemplate {
  reminderType: string;
  delayDays: number;
  timeOfDay: string; // Format: "HH:mm"
  message: string;
  isActive: boolean;
}

/**
 * Calculate reminder scheduled time based on template settings
 * @param slotAt Seminar date/time
 * @param template Reminder template with delay and time settings
 * @returns Scheduled time as Timestamp
 */
export function calculateReminderTime(
  slotAt: Timestamp,
  delayDays: number,
  timeOfDay: string
): Timestamp {
  const slotDate = slotAt.toDate();
  const zonedSlotDate = toZonedTime(slotDate, TIMEZONE);

  // Get the target date by subtracting delay days
  const targetDate = addDays(zonedSlotDate, -Math.abs(delayDays));
  const dayStart = startOfDay(targetDate);

  // Parse time string (HH:mm)
  const [hours, minutes] = timeOfDay.split(':').map(Number);

  // Set the time
  const reminderDate = setMinutes(setHours(dayStart, hours), minutes);

  // Convert back to UTC
  const utcDate = fromZonedTime(reminderDate, TIMEZONE);

  return Timestamp.fromDate(utcDate);
}

/**
 * Get reminder templates for an organization
 * @param db Firestore instance
 * @param organizationId Organization ID
 * @returns Array of reminder templates
 */
export async function getReminderTemplates(
  db: FirebaseFirestore.Firestore,
  organizationId: string
): Promise<ReminderTemplate[]> {
  try {
    const snapshot = await db
      .collection('reminder_message_templates')
      .where('organizationId', '==', organizationId)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map((doc) => doc.data()) as ReminderTemplate[];
  } catch (error) {
    console.error('Error fetching reminder templates:', error);
    return [];
  }
}
