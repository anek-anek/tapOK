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
  item_renamed: 'renamed gear',
  item_assigned: 'assigned gear to a crew',
  items_randomly_assigned: 'distributed gear randomly',
  item_picked: 'picked up gear',
  item_unpicked: 'released gear',
  item_confirmed: 'confirmed gear arrival',
  amot_declared: 'declared amot cost',
  amot_cleared: 'cleared amot cost',
  amot_opted_out: 'opted out of amot',
  amot_opted_in: 'opted back into amot',
  amot_rule_out: 'ruled out a crew from amot',
  amot_rule_in: 'ruled in a crew back to amot',
  amot_marked_paid: 'marked an amot payment',
  amot_marked_unpaid: 'reverted an amot payment',
  amot_proof_submitted: 'uploaded proof of amot payment',
  amot_confirmed_paid: 'confirmed a crew amot payment',
};

export function phraseForDropLogAction(action: string, changedFields?: Record<string, any>): string {
  let phrase = DROP_LOG_ACTION_PHRASES[action] ?? action.replace(/_/g, ' ');

  if (action === 'item_assigned' && changedFields?.assignedUserId === null) {
    phrase = 'unassigned gear';
  }

  let suffix = '';
  const itemName = changedFields?.itemName || '';
  const targetName = changedFields?.targetName || '';

  switch (action) {
    case 'amot_declared': {
      const nameStr = itemName ? `${itemName} ` : '';
      const cost = Number(changedFields?.amotCost || 0).toLocaleString();
      suffix = `: ${nameStr}(₱${cost})`;
      break;
    }
    case 'amot_cleared':
      suffix = itemName ? `: ${itemName}` : '';
      break;
    case 'amot_rule_out':
    case 'amot_rule_in':
    case 'amot_marked_paid':
    case 'amot_marked_unpaid':
    case 'amot_confirmed_paid':
      if (targetName) {
        phrase = phrase.replace('a crew', targetName).replace('an amot payment', `payment for ${targetName}`);
      }
      if (changedFields?.amount) {
        const amt = Number(changedFields.amount).toLocaleString();
        suffix = ` (₱${amt})`;
        
        if (!changedFields.isFullyPaid && changedFields.totalOwed) {
          const remaining = Math.max(0, changedFields.totalOwed - (changedFields.totalPaid || 0));
          suffix += `. Remaining: ₱${remaining.toLocaleString()}`;
        }
      }
      if (itemName) {
        suffix += `: ${itemName}`;
      }
      break;
    default:
      if (itemName) {
        suffix = `: ${itemName}`;
      }
      break;
  }

  return `${phrase}${suffix}`;
}
