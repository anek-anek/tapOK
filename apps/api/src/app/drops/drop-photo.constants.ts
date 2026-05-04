export const DROP_PHOTO_MAX_PER_USER = 2;
export const DROP_PHOTO_MIN_PER_DROP = 10;
export const DROP_PHOTO_HARD_CAP_PER_DROP = 30;

export function getDropPhotoMaxPerDrop(activeCrewCount: number): number {
  const safeCrewCount = Number.isFinite(activeCrewCount)
    ? Math.max(1, Math.floor(activeCrewCount))
    : 1;
  const dynamicCap = DROP_PHOTO_MAX_PER_USER * safeCrewCount;
  return Math.min(
    DROP_PHOTO_HARD_CAP_PER_DROP,
    Math.max(DROP_PHOTO_MIN_PER_DROP, dynamicCap),
  );
}
export const STALE_PHOTO_UPLOAD_TTL_MINUTES = 30;
export const STALE_AVATAR_UPLOAD_TTL_MINUTES = 30;
