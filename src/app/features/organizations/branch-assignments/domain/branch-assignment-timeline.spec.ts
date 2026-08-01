import { buildBranchAssignmentTimeline } from './branch-assignment-timeline';

import { BranchUserAssignment } from '../models/branch-user-assignment.model';

describe('buildBranchAssignmentTimeline', () => {
  it('should build created and ended timeline items', () => {
    const assignment: BranchUserAssignment = {
      id: 'assignment-1',

      organizationId: 'organization-1',

      branchId: 'branch-1',

      userId: 'user-1',

      role: 'Instructor',

      assignmentType: 'Primary',

      status: 'Ended',

      startsAtUtc: '2026-07-30T10:00:00Z',

      plannedEndAtUtc: null,

      effectiveEndAtUtc: '2026-08-30T10:00:00Z',

      suspensionReason: null,

      suspendedAtUtc: null,

      suspendedByUserId: null,

      endReason: 'Fin de collaboration.',

      endedAtUtc: '2026-08-30T10:00:00Z',

      endedByUserId: 'admin-1',

      createdAtUtc: '2026-07-30T10:00:00Z',

      createdByUserId: 'admin-1',

      lastModifiedAtUtc: '2026-08-30T10:00:00Z',

      lastModifiedByUserId: 'admin-1',
    };

    const timeline = buildBranchAssignmentTimeline(assignment);

    expect(timeline.map((item) => item.type)).toEqual(['created', 'ended']);

    expect(timeline[1].reason).toBe('Fin de collaboration.');
  });

  it('should expose a current suspension', () => {
    const assignment: BranchUserAssignment = {
      id: 'assignment-1',

      organizationId: 'organization-1',

      branchId: 'branch-1',

      userId: 'user-1',

      role: 'Instructor',

      assignmentType: 'Primary',

      status: 'Suspended',

      startsAtUtc: '2026-07-30T10:00:00Z',

      plannedEndAtUtc: null,

      effectiveEndAtUtc: null,

      suspensionReason: 'Absence temporaire.',

      suspendedAtUtc: '2026-08-01T10:00:00Z',

      suspendedByUserId: 'admin-1',

      endReason: null,

      endedAtUtc: null,

      endedByUserId: null,

      createdAtUtc: '2026-07-30T10:00:00Z',

      createdByUserId: 'admin-1',

      lastModifiedAtUtc: '2026-08-01T10:00:00Z',

      lastModifiedByUserId: 'admin-1',
    };

    const timeline = buildBranchAssignmentTimeline(assignment);

    expect(timeline.map((item) => item.type)).toEqual(['created', 'suspended']);

    expect(timeline[1].reason).toBe('Absence temporaire.');
  });
});
