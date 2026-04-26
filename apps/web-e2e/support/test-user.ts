export interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Generate a unique test user for a single test run.
 * Uses a timestamp + random suffix to avoid collisions between parallel invocations.
 */
export function generateTestUser(): TestUser {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `e2e+${suffix}@tapok.test`,
    password: `E2ePass!${suffix.slice(0, 8)}`,
  };
}
