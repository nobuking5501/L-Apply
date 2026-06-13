import { createHash } from 'crypto';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export interface ApiKeyContext {
  organizationId: string;
  keyId: string;
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validates X-API-Key (or Authorization: Bearer) header against Firestore.
 * Returns the associated organizationId on success, null on failure.
 */
export async function validateApiKey(request: Request): Promise<ApiKeyContext | null> {
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/, '');

  if (!apiKey || !apiKey.startsWith('lappy_')) {
    return null;
  }

  ensureAdminInitialized();
  const db = getAdminDb();
  const keyHash = hashApiKey(apiKey);

  const snapshot = await db
    .collection('organization_api_keys')
    .where('keyHash', '==', keyHash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const keyDoc = snapshot.docs[0];
  const keyData = keyDoc.data();

  if (!keyData.isActive) {
    return null;
  }

  // Record last usage time without blocking the request
  keyDoc.ref.update({ lastUsedAt: new Date() }).catch(() => {});

  return {
    organizationId: keyData.organizationId as string,
    keyId: keyDoc.id,
  };
}
