import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let adminAuth: Auth;

function getFirebaseAdmin() {
  if (!app) {
    if (getApps().length === 0) {
      // In production, use a service account JSON. In dev/mock, use project ID only.
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          app = initializeApp({
            credential: cert(serviceAccount),
          });
        } catch {
          // Fallback to project ID if JSON parse fails
          app = initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ambassador-portal-51cf9',
          });
        }
      } else {
        // Dev mode: initialize with project ID only (uses Application Default Credentials if available)
        app = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ambassador-portal-51cf9',
        });
      }
    } else {
      app = getApps()[0];
    }
    adminAuth = getAuth(app);
  }
  return { app, adminAuth };
}

export { getFirebaseAdmin };
