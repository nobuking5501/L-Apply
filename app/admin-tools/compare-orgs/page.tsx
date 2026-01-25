'use client';

import { useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OrgData {
  organizations?: any;
  organization_secrets?: any;
  subscriptions?: any;
  events?: any[];
  eventsCount?: number;
}

export default function CompareOrgsPage() {
  const [org1Id] = useState('org_XOVcuVO7o6Op6idItDHsqiBgdBD3');
  const [org2Id] = useState('org_LRLxHcD2I6QC0ztGNAxSSwwCAhl1');
  const [org1Data, setOrg1Data] = useState<OrgData | null>(null);
  const [org2Data, setOrg2Data] = useState<OrgData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOrgData = async (orgId: string): Promise<OrgData> => {
    const data: OrgData = {};

    // Fetch organization document
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    data.organizations = orgDoc.exists() ? orgDoc.data() : null;

    // Fetch organization_secrets document
    const secretsDoc = await getDoc(doc(db, 'organization_secrets', orgId));
    data.organization_secrets = secretsDoc.exists() ? secretsDoc.data() : null;

    // Fetch subscriptions document
    const subscriptionsDoc = await getDoc(doc(db, 'subscriptions', orgId));
    data.subscriptions = subscriptionsDoc.exists() ? subscriptionsDoc.data() : null;

    // Fetch events
    const eventsQuery = query(
      collection(db, 'events'),
      where('organizationId', '==', orgId),
      where('isActive', '==', true)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    data.events = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    data.eventsCount = data.events.length;

    return data;
  };

  const handleCompare = async () => {
    setIsLoading(true);
    try {
      const [data1, data2] = await Promise.all([fetchOrgData(org1Id), fetchOrgData(org2Id)]);
      setOrg1Data(data1);
      setOrg2Data(data2);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('データの取得に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return '(なし)';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') {
      if (value.toDate && typeof value.toDate === 'function') {
        return value.toDate().toISOString();
      }
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '... (length: ' + value.length + ')';
    }
    return String(value);
  };

  const compareField = (field: string, val1: any, val2: any) => {
    const str1 = JSON.stringify(val1);
    const str2 = JSON.stringify(val2);
    const isDifferent = str1 !== str2;

    return (
      <tr key={field} style={{ backgroundColor: isDifferent ? '#fff3cd' : 'white' }}>
        <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>{field}</td>
        <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '12px' }}>
          {renderValue(val1)}
        </td>
        <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '12px' }}>
          {renderValue(val2)}
        </td>
        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
          {isDifferent ? '⚠️ 違い' : '✓ 同じ'}
        </td>
      </tr>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🔍 組織比較ツール</h1>
      <p>
        申込できる組織 <code>{org2Id}</code> と申込できない組織 <code>{org1Id}</code> の設定を比較します。
      </p>

      <button
        onClick={handleCompare}
        disabled={isLoading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isLoading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginTop: '20px',
        }}
      >
        {isLoading ? '読み込み中...' : '比較する'}
      </button>

      {org1Data && org2Data && (
        <div style={{ marginTop: '30px' }}>
          {/* Organizations Collection */}
          <h2>📄 organizations コレクション</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>フィールド</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org1Id} (申込不可)
                </th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org2Id} (申込可)
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>比較</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys({ ...org1Data.organizations, ...org2Data.organizations }).map((key) =>
                compareField(key, org1Data.organizations?.[key], org2Data.organizations?.[key])
              )}
            </tbody>
          </table>

          {/* Organization Secrets Collection */}
          <h2>🔐 organization_secrets コレクション</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>フィールド</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org1Id} (申込不可)
                </th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org2Id} (申込可)
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>比較</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys({ ...org1Data.organization_secrets, ...org2Data.organization_secrets }).map((key) =>
                compareField(
                  key,
                  org1Data.organization_secrets?.[key],
                  org2Data.organization_secrets?.[key]
                )
              )}
            </tbody>
          </table>

          {/* Subscriptions Collection */}
          <h2>💳 subscriptions コレクション</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>フィールド</th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org1Id} (申込不可)
                </th>
                <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>
                  {org2Id} (申込可)
                </th>
                <th style={{ padding: '10px', textAlign: 'center', border: '1px solid #ddd' }}>比較</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys({ ...org1Data.subscriptions, ...org2Data.subscriptions }).map((key) =>
                compareField(key, org1Data.subscriptions?.[key], org2Data.subscriptions?.[key])
              )}
            </tbody>
          </table>

          {/* Events */}
          <h2>📅 events コレクション</h2>
          <div style={{ marginBottom: '20px' }}>
            <p>
              <strong>{org1Id} (申込不可):</strong> {org1Data.eventsCount} 件のアクティブなイベント
            </p>
            <p>
              <strong>{org2Id} (申込可):</strong> {org2Data.eventsCount} 件のアクティブなイベント
            </p>
          </div>

          {org1Data.events && org1Data.events.length > 0 && (
            <>
              <h3>🔴 {org1Id} のイベント (申込不可)</h3>
              {org1Data.events.map((event: any) => (
                <details key={event.id} style={{ marginBottom: '10px' }}>
                  <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#f0f0f0' }}>
                    {event.title || '(タイトルなし)'} - {event.id}
                  </summary>
                  <pre
                    style={{
                      padding: '10px',
                      backgroundColor: '#fafafa',
                      border: '1px solid #ddd',
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </details>
              ))}
            </>
          )}

          {org2Data.events && org2Data.events.length > 0 && (
            <>
              <h3>✅ {org2Id} のイベント (申込可)</h3>
              {org2Data.events.map((event: any) => (
                <details key={event.id} style={{ marginBottom: '10px' }}>
                  <summary style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#f0f0f0' }}>
                    {event.title || '(タイトルなし)'} - {event.id}
                  </summary>
                  <pre
                    style={{
                      padding: '10px',
                      backgroundColor: '#fafafa',
                      border: '1px solid #ddd',
                      overflow: 'auto',
                    }}
                  >
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </details>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
