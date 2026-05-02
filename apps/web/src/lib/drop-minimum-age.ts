import axios from 'axios';

function getCalendarAgeFromIsoDate(birthdayIso: string, ref: Date = new Date()): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdayIso.trim());
  if (!m) return NaN;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  let age = ref.getFullYear() - y;
  if (ref.getMonth() + 1 < month || (ref.getMonth() + 1 === month && ref.getDate() < day)) {
    age--;
  }
  return age;
}

export type DropAgeEligibility = { ok: true } | { ok: false; message: string };

/** Client-side gate before POST /drops/:id/join when the drop has a minimum age (matches API rules). */
export function evaluateDropMinimumAgeEligibility(
  birthdayIso: string | undefined,
  minimumAge: number | null | undefined,
): DropAgeEligibility {
  if (minimumAge == null || minimumAge < 1) return { ok: true };
  if (!birthdayIso?.trim()) {
    return {
      ok: false,
      message: 'Add your birthday in your profile to join this drop.',
    };
  }
  const age = getCalendarAgeFromIsoDate(birthdayIso);
  if (Number.isNaN(age)) {
    return {
      ok: false,
      message: 'Add your birthday in your profile to join this drop.',
    };
  }
  if (age < minimumAge) {
    return {
      ok: false,
      message: `You must be at least ${minimumAge} years old to join this drop.`,
    };
  }
  return { ok: true };
}

export function getJoinDropErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const raw = err.response?.data?.message;
    const msg = Array.isArray(raw) ? raw[0] : raw;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Failed to join drop';
}
