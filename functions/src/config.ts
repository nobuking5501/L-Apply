import { Config, GlobalConfig, OrganizationConfig } from './types';
import { getDb } from './utils/firestore';
import { ensureFirebaseInitialized } from './utils/firebase-init';

// Load global config from environment variables
export function getGlobalConfig(): GlobalConfig {
  const baseUrl = process.env.APP_BASE_URL || 'https://l-apply.web.app';

  return {
    app: {
      baseUrl,
    },
  };
}

// Load organization-specific config from Firestore
export async function getOrganizationConfig(
  organizationId: string
): Promise<OrganizationConfig> {
  // Ensure Firebase is initialized before accessing Firestore
  ensureFirebaseInitialized();

  const db = getDb();
  const orgDoc = await db.collection('organizations').doc(organizationId).get();

  if (!orgDoc.exists) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  const orgData = orgDoc.data();

  if (!orgData) {
    throw new Error(`Organization data is empty: ${organizationId}`);
  }

  // Support both old structure (settings.branding) and new structure (root level)
  const settings = orgData.settings || {};
  const branding = settings.branding || {};

  const channelAccessToken = orgData.lineChannelAccessToken || branding.lineChannelAccessToken || '';
  const channelSecret = orgData.lineChannelSecret || branding.lineChannelSecret || '';
  const liffId = orgData.liffId || branding.liffId || '';

  if (!channelAccessToken || !channelSecret) {
    throw new Error(
      `LINE credentials not configured for organization: ${organizationId}`
    );
  }

  return {
    organizationId,
    line: {
      channelAccessToken,
      channelSecret,
    },
    liff: {
      id: liffId,
    },
  };
}

// Legacy function (deprecated, kept for backward compatibility)
// DO NOT USE in new code - use getOrganizationConfig instead
export function getConfig(): Config {
  const baseUrl = process.env.APP_BASE_URL || 'https://l-apply.web.app';

  console.warn(
    'getConfig() is deprecated. Use getOrganizationConfig(organizationId) instead.'
  );

  return {
    line: {
      channelAccessToken: '',
      channelSecret: '',
    },
    liff: {
      id: '',
    },
    app: {
      baseUrl,
      organizationId: '',
    },
  };
}
