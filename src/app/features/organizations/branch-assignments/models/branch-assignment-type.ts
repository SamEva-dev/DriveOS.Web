export enum BranchAssignmentType {
  Primary = 1,

  Secondary = 2,

  Temporary = 3,

  Replacement = 4,

  Shared = 5,

  Support = 6,

  Other = 99,
}

export type BranchAssignmentTypeName =
  'Primary' | 'Secondary' | 'Temporary' | 'Replacement' | 'Shared' | 'Support' | 'Other';

export interface BranchAssignmentTypeOption {
  readonly value: BranchAssignmentType;

  readonly name: BranchAssignmentTypeName;

  readonly labelKey: string;
}

export const BRANCH_ASSIGNMENT_TYPE_OPTIONS: readonly BranchAssignmentTypeOption[] = [
  {
    value: BranchAssignmentType.Primary,

    name: 'Primary',

    labelKey: 'organizations.branchAssignments.types.primary',
  },

  {
    value: BranchAssignmentType.Secondary,

    name: 'Secondary',

    labelKey: 'organizations.branchAssignments.types.secondary',
  },

  {
    value: BranchAssignmentType.Temporary,

    name: 'Temporary',

    labelKey: 'organizations.branchAssignments.types.temporary',
  },

  {
    value: BranchAssignmentType.Replacement,

    name: 'Replacement',

    labelKey: 'organizations.branchAssignments.types.replacement',
  },

  {
    value: BranchAssignmentType.Shared,

    name: 'Shared',

    labelKey: 'organizations.branchAssignments.types.shared',
  },

  {
    value: BranchAssignmentType.Support,

    name: 'Support',

    labelKey: 'organizations.branchAssignments.types.support',
  },

  {
    value: BranchAssignmentType.Other,

    name: 'Other',

    labelKey: 'organizations.branchAssignments.types.other',
  },
] as const;

export function branchAssignmentTypeLabelKey(assignmentType: BranchAssignmentTypeName): string {
  const option = BRANCH_ASSIGNMENT_TYPE_OPTIONS.find((item) => item.name === assignmentType);

  return option?.labelKey ?? 'organizations.branchAssignments.types.unknown';
}
