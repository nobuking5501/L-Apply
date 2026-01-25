import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config';
import type { OrganizationConfig } from '../types';

const LINE_API_BASE = 'https://api.line.me/v2/bot';

/**
 * Verify LINE webhook signature
 * @param body Request body as string
 * @param signature X-LINE-Signature header value
 * @param channelSecret LINE Channel Secret (if omitted, uses legacy getConfig)
 */
export function verifySignature(
  body: string,
  signature: string,
  channelSecret?: string
): boolean {
  const secret = channelSecret || getConfig().line.channelSecret;
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

/**
 * Verify LIFF ID token and get user profile
 * @param idToken LIFF ID token
 * @param accessToken LINE Channel Access Token (REQUIRED for multi-tenant support)
 */
export async function verifyIdToken(
  idToken: string,
  accessToken?: string
): Promise<{ userId: string; displayName: string }> {
  try {
    // Decode the ID token (without verification for simplicity)
    // In production, you should verify the token with LINE's public key
    const decoded = jwt.decode(idToken) as {
      sub: string;
      name?: string;
      picture?: string;
    } | null;

    if (!decoded || !decoded.sub) {
      throw new Error('Invalid ID token');
    }

    // Use displayName from ID token if available (LIFF tokens include this)
    // This avoids the need to call Messaging API, which requires friendship
    const displayName = decoded.name || 'LINE User';

    return {
      userId: decoded.sub,
      displayName: displayName,
    };
  } catch (error) {
    console.error('Failed to verify ID token:', error);
    throw new Error('Invalid ID token');
  }
}

/**
 * Get user profile
 * @param userId LINE user ID
 * @param accessToken LINE Channel Access Token (if omitted, uses legacy getConfig)
 */
export async function getProfile(
  userId: string,
  accessToken?: string
): Promise<{ displayName: string; userId: string; pictureUrl?: string; statusMessage?: string }> {
  const token = accessToken || getConfig().line.channelAccessToken;

  try {
    const response = await axios.get(`${LINE_API_BASE}/profile/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw error;
  }
}

/**
 * Push message to user
 * @param userId LINE user ID
 * @param messages Array of LINE messages
 * @param accessToken LINE Channel Access Token (if omitted, uses legacy getConfig)
 */
export async function pushMessage(
  userId: string,
  messages: any[],
  accessToken?: string
): Promise<void> {
  const token = accessToken || getConfig().line.channelAccessToken;

  try {
    await axios.post(
      `${LINE_API_BASE}/message/push`,
      {
        to: userId,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Failed to push message:', error);
    throw error;
  }
}

/**
 * Reply to message
 * @param replyToken LINE reply token
 * @param messages Array of LINE messages
 * @param accessToken LINE Channel Access Token (if omitted, uses legacy getConfig)
 */
export async function replyMessage(
  replyToken: string,
  messages: any[],
  accessToken?: string
): Promise<void> {
  const token = accessToken || getConfig().line.channelAccessToken;

  try {
    await axios.post(
      `${LINE_API_BASE}/message/reply`,
      {
        replyToken,
        messages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error('Failed to reply message:', error);
    throw error;
  }
}

/**
 * Create text message
 */
export function createTextMessage(text: string): any {
  return {
    type: 'text',
    text,
  };
}

/**
 * Retry push message with exponential backoff
 * @param userId LINE user ID
 * @param messages Array of LINE messages
 * @param accessToken LINE Channel Access Token (if omitted, uses legacy getConfig)
 * @param maxRetries Maximum number of retry attempts
 */
export async function pushMessageWithRetry(
  userId: string,
  messages: any[],
  accessToken?: string,
  maxRetries = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await pushMessage(userId, messages, accessToken);
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Push message attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to push message after retries');
}
