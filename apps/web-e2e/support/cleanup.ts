import * as admin from 'firebase-admin';
import { Client } from 'pg';

type DbAuthProvider = 'password' | 'google';

let firebaseApp: admin.app.App | undefined;

function getFirebaseApp(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.E2E_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.E2E_FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.E2E_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing E2E Firebase Admin credentials. ' +
        'Set E2E_FIREBASE_PROJECT_ID, E2E_FIREBASE_CLIENT_EMAIL, E2E_FIREBASE_PRIVATE_KEY in .env.local',
    );
  }

  firebaseApp = admin.initializeApp(
    {
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    },
    `e2e-${Date.now()}`,
  );

  return firebaseApp;
}

async function deleteFirebaseUser(email: string): Promise<void> {
  const app = getFirebaseApp();
  try {
    const user = await admin.auth(app).getUserByEmail(email);
    await admin.auth(app).deleteUser(user.uid);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw err;
  }
}

async function deleteDbUser(email: string): Promise<void> {
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    database: process.env.E2E_DB_NAME,
    user: process.env.E2E_DB_USER,
    password: process.env.E2E_DB_PASSWORD,
  });

  await client.connect();
  try {
    await client.query('DELETE FROM "users" WHERE email = $1', [email]);
  } finally {
    await client.end();
  }
}

async function withDbClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    database: process.env.E2E_DB_NAME,
    user: process.env.E2E_DB_USER,
    password: process.env.E2E_DB_PASSWORD,
  });

  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/**
 * Delete a test user from both Firebase and the database.
 * Safe to call even if the user doesn't exist in one or both systems.
 */
export async function cleanupTestUser(email: string): Promise<void> {
  await Promise.all([deleteFirebaseUser(email), deleteDbUser(email)]);
}

/**
 * Create a Firebase-only user (no DB row) for testing the rejection journey.
 * Returns the UID so you can delete it in afterEach.
 */
export async function createFirebaseOnlyUser(
  email: string,
  password: string,
): Promise<string> {
  const app = getFirebaseApp();
  const record = await admin.auth(app).createUser({ email, password });
  return record.uid;
}

/**
 * Delete a Firebase user by UID. Used to clean up firebase-only users.
 */
export async function deleteFirebaseUserByUid(uid: string): Promise<void> {
  const app = getFirebaseApp();
  try {
    await admin.auth(app).deleteUser(uid);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== 'auth/user-not-found') throw err;
  }
}

export async function createUnlinkedVerifiedUser(
  email: string,
  password: string,
  profile: { firstName: string; lastName: string },
  options: { dbAuthProvider?: DbAuthProvider } = {},
): Promise<string> {
  const app = getFirebaseApp();
  const record = await admin.auth(app).createUser({
    email,
    password,
    emailVerified: true,
    displayName: `${profile.firstName} ${profile.lastName}`.trim(),
  });

  await withDbClient(async (client) => {
    await client.query(
      `
        INSERT INTO "users" (email, "authProvider", "firstName", "lastName", "isEmailVerified")
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        email,
        options.dbAuthProvider ?? 'password',
        profile.firstName,
        profile.lastName,
        true,
      ],
    );
  });

  return record.uid;
}
