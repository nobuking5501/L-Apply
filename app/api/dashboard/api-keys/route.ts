import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminDb, ensureAdminInitialized } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function verifyAuthToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const idToken = authHeader.split('Bearer ')[1];
    ensureAdminInitialized();
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return null;

    const userData = userDoc.data() as {
      organizationId: string;
      role: string;
      [key: string]: any;
    };
    return { uid: decodedToken.uid, ...userData };
  } catch {
    return null;
  }
}

function generateApiKey(): { key: string; hash: string; prefix: string } {
  const random = randomBytes(16).toString('hex'); // 32 hex chars
  const key = `lappy_${random}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 14); // "lappy_" + first 8 chars
  return { key, hash, prefix };
}

/** GET /api/dashboard/api-keys — list active keys for the org */
export async function GET(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminDb();
  const snapshot = await db
    .collection('organization_api_keys')
    .where('organizationId', '==', user.organizationId)
    .get();

  const keys = snapshot.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name as string,
        prefix: d.prefix as string,
        isActive: d.isActive as boolean,
        createdAt: (d.createdAt?.toDate?.() as Date | undefined)?.toISOString() ?? null,
        lastUsedAt: (d.lastUsedAt?.toDate?.() as Date | undefined)?.toISOString() ?? null,
      };
    })
    .filter((k) => k.isActive)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  return NextResponse.json({ success: true, keys });
}

/** POST /api/dashboard/api-keys — generate a new API key */
export async function POST(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    // use default name
  }

  const name = (body.name ?? '').trim() || 'APIキー';

  const db = getAdminDb();

  // Max 5 active keys per organization
  const existing = await db
    .collection('organization_api_keys')
    .where('organizationId', '==', user.organizationId)
    .where('isActive', '==', true)
    .get();

  if (existing.size >= 5) {
    return NextResponse.json(
      { error: '有効なAPIキーは最大5つまでです。不要なキーを削除してください。' },
      { status: 409 }
    );
  }

  const { key, hash, prefix } = generateApiKey();

  await db.collection('organization_api_keys').add({
    organizationId: user.organizationId,
    name,
    keyHash: hash,
    prefix,
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: null,
    createdBy: user.uid,
  });

  // The plain-text key is returned exactly once and never stored
  return NextResponse.json({ success: true, key, prefix, name }, { status: 201 });
}

/** DELETE /api/dashboard/api-keys?id=xxx — revoke a key */
export async function DELETE(request: NextRequest) {
  const user = await verifyAuthToken(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const keyId = new URL(request.url).searchParams.get('id');
  if (!keyId) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
  }

  const db = getAdminDb();
  const keyDoc = await db.collection('organization_api_keys').doc(keyId).get();

  if (!keyDoc.exists || keyDoc.data()?.organizationId !== user.organizationId) {
    return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  }

  await keyDoc.ref.update({ isActive: false });

  return NextResponse.json({ success: true });
}
