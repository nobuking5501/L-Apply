const admin = require('firebase-admin');

// Use application default credentials (from Firebase CLI)
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'l-apply',
  });
}

const db = admin.firestore();

async function checkReminders() {
  console.log('=== Checking Reminders ===\n');

  try {
    // Get all reminders
    const snapshot = await db.collection('reminders').limit(10).get();
    console.log(`Total reminders (showing first 10): ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('❌ No reminders found\n');
      return;
    }

    // Show reminder details
    snapshot.forEach((doc) => {
      const data = doc.data();
      const scheduledAt = data.scheduledAt?.toDate();
      const sentAt = data.sentAt?.toDate();

      console.log(`📄 ID: ${doc.id}`);
      console.log(`   User: ${data.userId}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Scheduled: ${scheduledAt ? scheduledAt.toISOString() : 'null'}`);
      console.log(`   Sent: ${sentAt ? sentAt.toISOString() : 'null'}`);
      console.log(`   Canceled: ${data.canceled}`);
      console.log(`   Message: ${data.message.substring(0, 50)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  process.exit(0);
}

checkReminders();
