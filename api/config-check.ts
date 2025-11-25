import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  const hasKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const keyLength = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').length;

  res.status(200).json({
    status: 'Firebase Configuration Check',
    environment: process.env.NODE_ENV || 'unknown',
    firebase: {
      projectId: {
        set: hasProjectId,
        value: hasProjectId ? process.env.FIREBASE_PROJECT_ID : 'NOT SET',
      },
      serviceAccountKey: {
        set: hasKey,
        length: keyLength,
        preview: hasKey ? (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').substring(0, 50) + '...' : 'NOT SET',
      },
    },
    message: hasProjectId && hasKey ? '✅ All configured!' : '❌ Missing environment variables',
  });
}
