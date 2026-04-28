/**
 * Thin wrapper around Vercel Analytics custom events for TapOK onboarding.
 *
 * Pageviews are captured automatically by the <Analytics /> component in layout.tsx.
 * This file is for named funnel events that map to the onboarding success metrics.
 *
 * Vercel project: apps/web (the api project does not need analytics).
 */

import { track as vercelTrack } from '@vercel/analytics';

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_path_chief'
  | 'onboarding_path_crew'
  | 'drop_builder_viewed'
  | 'drop_field_completed'
  | 'drop_go_live_clicked'
  | 'drop_created'
  | 'drop_share_link_copied'
  | 'drop_send_to_crew_clicked'
  | 'drop_view_clicked'
  | 'crew_invite_viewed'
  | 'crew_tap_in_clicked'
  | 'crew_tapped_in'
  | 'crew_code_entry_viewed'
  | 'crew_code_submitted';

type EventPayload = Record<string, string | number | boolean | undefined>;

export function track(event: OnboardingEvent, payload?: EventPayload): void {
  vercelTrack(event, payload);
}
