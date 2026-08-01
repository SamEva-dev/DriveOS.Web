export type BranchAssignmentTimelineItemType =
  'created' | 'started' | 'suspended' | 'reactivated' | 'ended' | 'modified';

export interface BranchAssignmentTimelineItem {
  readonly type: BranchAssignmentTimelineItemType;

  readonly titleKey: string;

  readonly descriptionKey: string | null;

  readonly date: string;

  readonly actorUserId: string | null;

  readonly reason: string | null;
}
