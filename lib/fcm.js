import * as admin from 'firebase-admin';
import { query, execute } from '@/lib/db';
import { getPushIconUrl } from '@/lib/pushIcon';

// Initialize Firebase Admin if not already initialized
function initFCM() {
  if (admin.apps.length > 0) return true;

  try {
    // Expected format in .env: FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "...", ...}'
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountStr) {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT missing in .env');
      return false;
    }

    const serviceAccount = JSON.parse(serviceAccountStr);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('[FCM] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[FCM] Initialization failed:', error.message);
    return false;
  }
}

/**
 * Send a push notification to a user's mobile devices
 * @param {string} userId - Target user ID
 * @param {Object} payload - Notification payload { title, body, data }
 */
export async function sendPushToMobile(userId, { title, body, data = {} }) {
  if (!initFCM()) return;

  const tokens = await query('SELECT id, token FROM fcm_token WHERE userId = ?', [userId]);
  if (!tokens || tokens.length === 0) {
    return; // No devices registered for this user
  }

  const deviceTokens = tokens.map(t => t.token);
  console.log(`[FCM] Sending push to userId ${userId} with ${deviceTokens.length} tokens.`);

  const imageUrl = getPushIconUrl();

  const message = {
    notification: {
      title,
      body,
      imageUrl,
    },
    data: Object.fromEntries(
      Object.entries({ ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' })
        .map(([k, v]) => [k, v == null ? '' : String(v)])
    ),
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    tokens: deviceTokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          // Identify expired or invalid tokens
          if (resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered') {
            failedTokens.push(tokens[idx].id);
          }
        }
      });
      
      // Clean up invalid tokens from the database
      if (failedTokens.length > 0) {
        await execute(
          `DELETE FROM fcm_token WHERE id IN (${failedTokens.map(() => '?').join(',')})`,
          failedTokens
        );
        console.log(`[FCM] Cleaned up ${failedTokens.length} invalid tokens`);
      }
    }
  } catch (error) {
    console.error('[FCM] Error sending message:', error);
  }
}
