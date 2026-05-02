import { test, expect, type Page } from '@playwright/test';
import { generateTestUser } from '../support/test-user';
import {
  cleanupTestUser,
  createFirebaseOnlyUser,
  createUnlinkedVerifiedUser,
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
  await page.getByPlaceholder('Enter your first name').fill(user.firstName);
  await page.getByPlaceholder('Enter your last name').fill(user.lastName);
  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Create a password').fill(user.password);
  await page.getByPlaceholder('Confirm your password').fill(user.password);
}

async function fillLoginForm(
  page: Page,
  user: { email: string; password: string },
) {
  await page.getByPlaceholder('Enter your email').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill(user.password);
}

async function skipOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
  await page.getByRole('button', { name: /skip for now/i }).click();
}

async function logoutFromNavbar(page: Page) {
  await page.getByRole('button', { name: /account menu/i }).click();
  await page.getByRole('button', { name: /log out/i }).click();
}

// ── Journey 1: Happy-path register → sign out → login ─────────────────────

test.describe('Happy-path auth journey', () => {
  const user = generateTestUser();

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
  });

  test('register, sign out, and log back in', async ({ page, context }) => {
    // ── 1. Register ──
    await page.goto('/register?redirectTo=%2Fdrops');
    await expect(page.getByRole('heading', { name: /tap in/i })).toBeVisible();

    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: /^tap in$/i }).click();

    await skipOnboarding(page);
    await expect(page).toHaveURL('/drops', { timeout: 20_000 });

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    expect(sessionCookie?.value).toBeTruthy();
    expect(sessionCookie?.httpOnly).toBe(true);

    // ── 2. Sign out ──
    await logoutFromNavbar(page);
    await expect(page).toHaveURL('/login', { timeout: 20_000 });

    // A protected route should now redirect to /login
    await page.goto('/drops');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdrops/, { timeout: 10_000 });

    // ── 3. Log back in ──
    await fillLoginForm(page, user);
    await page.getByRole('button', { name: /tap back in/i }).click();

    await expect(page).toHaveURL('/drops', { timeout: 20_000 });

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
    await page.getByRole('button', { name: /tap back in/i }).click();

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

// ── Journey 3: Verified email auto-links an existing TapOK account ────────

test.describe('Auto-link journey — existing DB user', () => {
  const user = generateTestUser();
  let firebaseUid: string;

  test.beforeAll(async () => {
    firebaseUid = await createUnlinkedVerifiedUser(user.email, user.password, {
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
    await deleteFirebaseUserByUid(firebaseUid);
  });

  test('login auto-links verified email and respects redirectTo', async ({ page, context }) => {
    await page.goto('/login?redirectTo=%2Factivity');
    await fillLoginForm(page, user);
    await page.getByRole('button', { name: /tap back in/i }).click();

    await expect(page).toHaveURL('/activity', { timeout: 20_000 });

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === '__session');
    expect(sessionCookie?.value).toBeTruthy();
  });
});

// ── Journey 4: Route-protection redirect survives onboarding ───────────────

test.describe('Route-protection sanity check', () => {
  const user = generateTestUser();

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
  });

  test('unauthenticated user is redirected to login with redirectTo, then returns after login', async ({
    page,
  }) => {
    // ── 1. Hit a protected route while logged out ──
    await page.goto('/activity');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Factivity/, { timeout: 10_000 });

    // ── 2. Register a fresh account with the intended redirectTo preserved ──
    await page.goto('/register?redirectTo=%2Factivity');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: /^tap in$/i }).click();

    await expect(page).toHaveURL(/\/onboarding\?/, { timeout: 20_000 });
    await page.getByRole('button', { name: /skip for now/i }).click();

    // Registration should resume the original protected route after onboarding
    await expect(page).toHaveURL('/activity', { timeout: 20_000 });
  });
});

// ── Journey 5: Failed signup cleanup allows retry with same email ──────────

test.describe('Recovery journey — failed signup session finalization', () => {
  const user = generateTestUser();

  test.afterAll(async () => {
    await cleanupTestUser(user.email);
  });

  test('signup failure clears partial auth and allows retry', async ({ page, context }) => {
    let sessionAttempts = 0;
    await page.route('**/api/auth/session', async (route) => {
      sessionAttempts += 1;
      if (sessionAttempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: 'API_UNAVAILABLE',
            message: 'Cannot reach the backend API.',
            code: 'API_UNAVAILABLE',
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/register?redirectTo=%2Fdrops');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: /^tap in$/i }).click();

    await expect(page).toHaveURL(/\/register/, { timeout: 20_000 });
    const cookiesAfterFailure = await context.cookies();
    const failedSessionCookie = cookiesAfterFailure.find((c) => c.name === '__session');
    expect(failedSessionCookie?.value ?? '').toBeFalsy();

    await page.goto('/register?redirectTo=%2Fdrops');
    await fillRegisterForm(page, user);
    await page.getByRole('button', { name: /^tap in$/i }).click();

    await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });
  });
});
