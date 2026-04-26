import * as path from 'path';
import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Pull Firebase public vars from the web app's env (NEXT_PUBLIC_* keys)
dotenv.config({ path: path.resolve(__dirname, '../../web/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../web/.env') });

/**
 * Warms up the Firebase Admin SDK's public-key cache and the remote DB connection
 * before any tests run. Without this, the first `verifyIdToken` call in the API
 * can take 20+ seconds (cold JWKS fetch from Google), causing the first registration
 * test to exceed its assertion timeout.
 */
export default async function globalSetup() {
  const API_URL = process.env.API_URL ?? 'http://localhost:3000';

  const projectId = process.env.E2E_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.E2E_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.E2E_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !clientEmail || !privateKey || !apiKey) {
    console.warn('[global-setup] Missing credentials — skipping warmup');
    return;
  }

  const app = admin.initializeApp(
    { credential: admin.credential.cert({ projectId, clientEmail, privateKey }) },
    `e2e-warmup-${Date.now()}`,
  );

  try {
    const email = `e2e-warmup-${Date.now()}@tapok.test`;
    const record = await admin.auth(app).createUser({ email, password: `Warmup!${Date.now()}` });
    const customToken = await admin.auth(app).createCustomToken(record.uid);

    // Exchange custom token for an ID token via Firebase REST API
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      },
    );

    if (signInRes.ok) {
      const { idToken } = (await signInRes.json()) as { idToken: string };

      // Hit the sync endpoint — this primes verifyIdToken's JWKS cache and
      // confirms the DB connection is alive before tests begin.
      await fetch(`${API_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}),
      }).catch(() => undefined);
    }

    await admin.auth(app).deleteUser(record.uid);

    // Clean up the DB row created by /users/sync
    const { Client } = await import('pg');
    const client = new Client({
      host: process.env.E2E_DB_HOST ?? 'localhost',
      port: Number(process.env.E2E_DB_PORT ?? 5432),
      database: process.env.E2E_DB_NAME,
      user: process.env.E2E_DB_USER,
      password: process.env.E2E_DB_PASSWORD,
    });
    await client.connect();
    await client.query('DELETE FROM "users" WHERE email = $1', [email]).catch(() => undefined);
    await client.end();
  } catch (err) {
    console.warn('[global-setup] Warmup failed (non-fatal):', err);
  } finally {
    await app.delete();
  }
}
