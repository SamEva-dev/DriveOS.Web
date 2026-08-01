import { BranchAssignmentTimelineItem } from '../models/branch-assignment-timeline-item';

import { BranchUserAssignment } from '../models/branch-user-assignment.model';

export function buildBranchAssignmentTimeline(
  assignment: BranchUserAssignment,
): readonly BranchAssignmentTimelineItem[] {
  const items: BranchAssignmentTimelineItem[] = [];

  items.push({
    type: 'created',

    titleKey: 'organizations.branchAssignments.timeline.created',

    descriptionKey: 'organizations.branchAssignments.timeline.createdDescription',

    date: assignment.createdAtUtc,

    actorUserId: assignment.createdByUserId,

    reason: null,
  });

  if (assignment.startsAtUtc !== assignment.createdAtUtc) {
    items.push({
      type: 'started',

      titleKey: 'organizations.branchAssignments.timeline.started',

      descriptionKey: 'organizations.branchAssignments.timeline.startedDescription',

      date: assignment.startsAtUtc,

      actorUserId: null,

      reason: null,
    });
  }

  if (assignment.suspendedAtUtc) {
    items.push({
      type: 'suspended',

      titleKey: 'organizations.branchAssignments.timeline.suspended',

      descriptionKey: 'organizations.branchAssignments.timeline.suspendedDescription',

      date: assignment.suspendedAtUtc,

      actorUserId: assignment.suspendedByUserId,

      reason: assignment.suspensionReason,
    });
  }

  if (assignment.effectiveEndAtUtc || assignment.endedAtUtc) {
    items.push({
      type: 'ended',

      titleKey: 'organizations.branchAssignments.timeline.ended',

      descriptionKey: 'organizations.branchAssignments.timeline.endedDescription',

      date: assignment.effectiveEndAtUtc ?? assignment.endedAtUtc!,

      actorUserId: assignment.endedByUserId,

      reason: assignment.endReason,
    });
  }

  if (
    assignment.lastModifiedAtUtc &&
    !items.some((item) => item.date === assignment.lastModifiedAtUtc)
  ) {
    items.push({
      type: 'modified',

      titleKey: 'organizations.branchAssignments.timeline.modified',

      descriptionKey: 'organizations.branchAssignments.timeline.modifiedDescription',

      date: assignment.lastModifiedAtUtc,

      actorUserId: assignment.lastModifiedByUserId,

      reason: null,
    });
  }

  return items.sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
}
