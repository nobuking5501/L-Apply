import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { messagePattern } = await request.json();

    if (!messagePattern) {
      return NextResponse.json(
        { error: 'messagePattern is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const snapshot = await db.collection('auto_reply_messages').get();

    if (snapshot.empty) {
      return NextResponse.json(
        { message: '自動返信メッセージが見つかりません', deleted: 0 },
        { status: 200 }
      );
    }

    const toDelete: string[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.message && data.message.includes(messagePattern)) {
        toDelete.push(doc.id);
        console.log(`Found matching message to delete: ${doc.id}`);
        console.log(`  Trigger: ${data.trigger}`);
        console.log(`  Message: ${data.message.substring(0, 100)}...`);
      }
    });

    // Delete all matching documents
    for (const docId of toDelete) {
      await db.collection('auto_reply_messages').doc(docId).delete();
      console.log(`Deleted: ${docId}`);
    }

    return NextResponse.json({
      message: `${toDelete.length}件の自動返信を削除しました`,
      deleted: toDelete.length,
      deletedIds: toDelete,
    });
  } catch (error) {
    console.error('Error deleting auto reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete auto reply', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to list all auto-replies (for debugging)
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('auto_reply_messages').get();

    const replies = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        trigger: data.trigger,
        messagePreview: data.message?.substring(0, 100) + '...',
        isActive: data.isActive,
        organizationId: data.organizationId,
      };
    });

    return NextResponse.json({
      total: replies.length,
      replies,
    });
  } catch (error) {
    console.error('Error fetching auto replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto replies', details: String(error) },
      { status: 500 }
    );
  }
}
