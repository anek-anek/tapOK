import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { generateTestUser } from '../support/test-user';
import {
  cleanupTestUser,
  createFirebaseOnlyUser,
  deleteFirebaseUserByUid,
} from '../support/cleanup';

// Give every test describe-block a fresh browser context (no shared cookies,
// localStorage, or IndexedDB between tests). This is the Playwright-idiomatic
// way to avoid stale Firebase auth state racing with the auth flow under test.
test.use({ storageState: { cookies: [], origins: [] } });

// ── Page-object helpers ────────────────────────────────────────────────────

async function fillRegisterForm(
  page: Page,
  user: { firstName: string; lastName: string; email: string; password: string },
) {
  await page.getByPlaceholder('Sean').fill(user.firstName);
  await page.getByPlaceholder('Aguilar').fill(user.lastName);
  await page.getByPlaceholder('you@example.com').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill(user.password);
  await page.getByPlaceholder('Repeat your password').fill(user.password);
}

async function fillLoginForm(
  page: Page,
  user: { email: string; password: string },
) {
  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill(user.password);
}

/**
 * Clear all browser-side auth state mid-test (sign-out path).
 * Cookies are cleared via the context API; IndexedDB is deleted by name
 * instead of using indexedDB.databases() which hangs in some Chromium builds.
 */
async function clearAuthState(context: BrowserContext, page: Page) {
  await context.clearCookies();
  // Must be on the origin before we can touch its storage
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Firebase JS SDK stores auth tokens in this named IndexedDB database
    indexedDB.deleteDatabase('firebaseLocalStorageDb');
  });
  // Brief pause for the IDB delete to flush before the next navigation
  await page.waitForTimeout(300);
}

// ── Journey 1: Happy-path register → sign out → login ─────────────────────

test.describe('Happy-path auth journey', () => {
  const user = generateTestUser();

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
  });

  test('register, sign out, and log back in', async ({ page, context }) => {
    // ── 1. Register ──
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();

    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: 'Tap In' }).click();

    // Successful registration redirects away from /register (default redirectTo is "/")
    await expect(page).not.toHaveURL('/register', { timeout: 20_000 });

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    expect(sessionCookie?.value).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);

    // ── 2. Sign out ──
    await clearAuthState(context, page);

    // A protected route should now redirect to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/, { timeout: 10_000 });

    // ── 3. Log back in ──
    await fillLoginForm(page, user);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL('/dashboard', { timeout: 20_000 });

    const cookiesAfterLogin = await context.cookies();
    const sessionAfterLogin = cookiesAfterLogin.find((c) => c.name === '__session');
    expect(sessionAfterLogin?.value).toBeTruthy();
    expect(sessionAfterLogin?.httpOnly).toBe(true);
  });
});

// ── Journey 2: Firebase-only user (no DB row) is rejected on login ─────────

test.describe('Rejection journey — Firebase-only account', () => {
  const user = generateTestUser();
  let firebaseUid: string;

  test.beforeAll(async () => {
    firebaseUid = await createFirebaseOnlyUser(user.email, user.password);
  });

  test.afterAll(async () => {
    await deleteFirebaseUserByUid(firebaseUid);
  });

  test('login with Firebase-only account shows sign-up-first error', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    await fillLoginForm(page, user);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    // App stays on /login and shows the rejection message
    await expect(page).toHaveURL('/login', { timeout: 20_000 });
    await expect(
      page.getByText(/No TapOK account found|Please sign up first/i),
    ).toBeVisible({ timeout: 15_000 });

    // No session cookie should have been set
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    expect(sessionCookie?.value ?? '').toBeFalsy();
  });
});

// ── Journey 3: Route-protection sanity check ──────────────────────────────

test.describe('Route-protection sanity check', () => {
  const user = generateTestUser();

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
  });

  test('unauthenticated user is redirected to login with redirectTo, then returns after login', async ({
    page,
  }) => {
    // ── 1. Hit a protected route while logged out ──
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/, { timeout: 10_000 });

    // ── 2. Register a fresh account with the intended redirectTo preserved ──
    await page.goto('/register?redirectTo=%2Fdashboard');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: 'Tap In' }).click();

    // Registration should land directly on /dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 20_000 });
  });
});
