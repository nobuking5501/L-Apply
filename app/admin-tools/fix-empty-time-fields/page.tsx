'use client';

import { useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FixResult {
  eventId: string;
  title: string;
  organizationId: string;
  fixed: boolean;
  slotsFixed: number;
}

export default function FixEmptyTimeFieldsPage() {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<FixResult[]>([]);
  const [summary, setSummary] = useState<{
    totalEvents: number;
    eventsFixed: number;
    eventsWithNoIssues: number;
  } | null>(null);

  const handleFix = async () => {
    setIsFixing(true);
    setResults([]);
    setSummary(null);

    try {
      console.log('🔍 Starting fix for events with empty time fields...');

      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);

      let fixedCount = 0;
      let totalEvents = 0;
      const resultsList: FixResult[] = [];

      for (const eventDoc of eventsSnapshot.docs) {
        totalEvents++;
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;

        console.log(`\n📄 Checking event: ${eventId}`);
        console.log(`   Organization: ${eventData.organizationId}`);
        console.log(`   Title: ${eventData.title}`);

        // Check if slots array exists
        if (!eventData.slots || !Array.isArray(eventData.slots)) {
          console.log('   ⚠️  No slots array found, skipping...');
          resultsList.push({
            eventId,
            title: eventData.title || 'Untitled',
            organizationId: eventData.organizationId || 'Unknown',
            fixed: false,
            slotsFixed: 0,
          });
          continue;
        }

        // Check each slot for empty time field
        let needsUpdate = false;
        let slotsFixedCount = 0;
        const updatedSlots = eventData.slots.map((slot: any, index: number) => {
          if (slot.time === '' || slot.time === null || slot.time === undefined) {
            console.log(`   🔴 Slot ${index + 1} has empty time field`);
            console.log(`      Date: ${slot.date}`);
            console.log(`      Fixing with default time: 14:00`);
            needsUpdate = true;
            slotsFixedCount++;
            return {
              ...slot,
              time: '14:00', // Set default time to 2:00 PM
            };
          }
          return slot;
        });

        // Update the document if needed
        if (needsUpdate) {
          const eventRef = doc(db, 'events', eventId);
          await updateDoc(eventRef, {
            slots: updatedSlots,
            updatedAt: new Date(),
          });
          fixedCount++;
          console.log(`   ✅ Event updated successfully`);

          resultsList.push({
            eventId,
            title: eventData.title || 'Untitled',
            organizationId: eventData.organizationId || 'Unknown',
            fixed: true,
            slotsFixed: slotsFixedCount,
          });
        } else {
          console.log('   ✓  No issues found');
          resultsList.push({
            eventId,
            title: eventData.title || 'Untitled',
            organizationId: eventData.organizationId || 'Unknown',
            fixed: false,
            slotsFixed: 0,
          });
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log(`\n📊 Summary:`);
      console.log(`   Total events checked: ${totalEvents}`);
      console.log(`   Events fixed: ${fixedCount}`);
      console.log(`   Events with no issues: ${totalEvents - fixedCount}`);
      console.log('\n✅ Script completed successfully\n');

      setResults(resultsList);
      setSummary({
        totalEvents,
        eventsFixed: fixedCount,
        eventsWithNoIssues: totalEvents - fixedCount,
      });
    } catch (error) {
      console.error('❌ Error:', error);
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 Fix Empty Time Fields</h1>
      <p>このツールは、イベントの開催枠で時刻(time)フィールドが空のものを「14:00」に修正します。</p>

      <button
        onClick={handleFix}
        disabled={isFixing}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isFixing ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isFixing ? 'not-allowed' : 'pointer',
          marginTop: '20px',
        }}
      >
        {isFixing ? '修正中...' : '空の時刻フィールドを修正'}
      </button>

      {summary && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <h2>📊 実行結果</h2>
          <p>✓ 確認したイベント数: {summary.totalEvents}</p>
          <p style={{ color: 'green', fontWeight: 'bold' }}>✓ 修正したイベント数: {summary.eventsFixed}</p>
          <p>✓ 問題なかったイベント数: {summary.eventsWithNoIssues}</p>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>📋 詳細</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>イベントID</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>タイトル</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>組織ID</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>修正</th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>修正した枠数</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.eventId} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>{result.eventId}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{result.title}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', fontSize: '12px' }}>{result.organizationId}</td>
                  <td
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      textAlign: 'center',
                      color: result.fixed ? 'green' : 'gray',
                      fontWeight: result.fixed ? 'bold' : 'normal',
                    }}
                  >
                    {result.fixed ? '✓ 修正済み' : '-'}
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {result.slotsFixed > 0 ? result.slotsFixed : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
