/**
 * Action labels for the Drop Log (per-drop view and global activity feed).
 * Keep in sync with the "Drop Log" list on a drop detail page.
 */
const DROP_LOG_ACTION_PHRASES: Record<string, string> = {
  created: 'initiated the drop',
  joined: 'boarded the crew',
  join_requested: 'sent a join request',
  join_request_approved: 'cleared a join request',
  join_request_rejected: 'denied a join request',
  left: 'abandoned ship',
  updated: 'modified the plan',
  member_removed: 'ejected a crew member',
  marked_in: 'tapped IN',
  marked_out: 'tapped OUT',
  marked_ongoing: 'pushed the drop LIVE',
  marked_completed: 'closed the mission',
  photo_added: 'posted a new shot to the roll',
  photo_removed: 'removed a shot from the roll',
  photo_featured: 'spotlighted a moment',
  photo_unfeatured: 'cleared the spotlight',
};

export function phraseForDropLogAction(action: string): string {
  return DROP_LOG_ACTION_PHRASES[action] ?? action.replace(/_/g, ' ');
}
