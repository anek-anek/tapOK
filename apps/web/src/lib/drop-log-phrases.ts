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
  updated: 'modified the drop',
  member_removed: 'ejected a crew',
  marked_in: 'tapped IN',
  marked_out: 'tapped OUT',
  marked_ongoing: 'pushed the drop LIVE',
  marked_completed: 'closed the drop',
  photo_added: 'posted a new shot to the roll',
  photo_removed: 'removed a shot from the roll',
  photo_featured: 'spotlighted a moment',
  photo_unfeatured: 'cleared the spotlight',
  invited_member: 'summoned a new crew',
  item_added: 'stashed new gear',
  item_removed: 'tossed some gear',
  item_assigned: 'assigned gear to a crew',
  items_randomly_assigned: 'distributed gear randomly',
  item_picked: 'picked up gear',
};

export function phraseForDropLogAction(action: string, changedFields?: Record<string, any>): string {
  let phrase = DROP_LOG_ACTION_PHRASES[action] ?? action.replace(/_/g, ' ');

  if (action === 'item_assigned' && changedFields?.assignedUserId === null) {
    phrase = 'unassigned gear';
  }

  if (changedFields?.itemName) {
    return `${phrase}: ${changedFields.itemName}`;
  }

  return phrase;
}
