// Test setup file

// Set environment variables for testing
process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_channel_access_token';
process.env.LINE_CHANNEL_SECRET = 'test_channel_secret';
process.env.LIFF_ID = 'test_liff_id';
process.env.APP_BASE_URL = 'https://test-app.web.app';

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => {
  const originalModule = jest.requireActual('firebase-admin/firestore');
  return {
    ...originalModule,
    getFirestore: jest.fn(() => ({
      collection: jest.fn(),
    })),
  };
});
