export enum BranchAssignmentRole {
  Instructor = 1,

  PedagogicalManager = 2,

  AdministrativeManager = 3,

  Secretary = 4,

  Accountant = 5,

  FleetManager = 6,

  ExamCoordinator = 7,

  SalesAdvisor = 8,

  ComplianceOfficer = 9,

  TrainingCoordinator = 10,

  Receptionist = 11,

  SupportAgent = 12,

  Other = 99,
}

export type BranchAssignmentRoleName =
  | 'Instructor'
  | 'PedagogicalManager'
  | 'AdministrativeManager'
  | 'Secretary'
  | 'Accountant'
  | 'FleetManager'
  | 'ExamCoordinator'
  | 'SalesAdvisor'
  | 'ComplianceOfficer'
  | 'TrainingCoordinator'
  | 'Receptionist'
  | 'SupportAgent'
  | 'Other';

export interface BranchAssignmentRoleOption {
  readonly value: BranchAssignmentRole;

  readonly name: BranchAssignmentRoleName;

  readonly labelKey: string;
}

export const BRANCH_ASSIGNMENT_ROLE_OPTIONS: readonly BranchAssignmentRoleOption[] = [
  {
    value: BranchAssignmentRole.Instructor,

    name: 'Instructor',

    labelKey: 'organizations.branchAssignments.roles.instructor',
  },

  {
    value: BranchAssignmentRole.PedagogicalManager,

    name: 'PedagogicalManager',

    labelKey: 'organizations.branchAssignments.roles.pedagogicalManager',
  },

  {
    value: BranchAssignmentRole.AdministrativeManager,

    name: 'AdministrativeManager',

    labelKey: 'organizations.branchAssignments.roles.administrativeManager',
  },

  {
    value: BranchAssignmentRole.Secretary,

    name: 'Secretary',

    labelKey: 'organizations.branchAssignments.roles.secretary',
  },

  {
    value: BranchAssignmentRole.Accountant,

    name: 'Accountant',

    labelKey: 'organizations.branchAssignments.roles.accountant',
  },

  {
    value: BranchAssignmentRole.FleetManager,

    name: 'FleetManager',

    labelKey: 'organizations.branchAssignments.roles.fleetManager',
  },

  {
    value: BranchAssignmentRole.ExamCoordinator,

    name: 'ExamCoordinator',

    labelKey: 'organizations.branchAssignments.roles.examCoordinator',
  },

  {
    value: BranchAssignmentRole.SalesAdvisor,

    name: 'SalesAdvisor',

    labelKey: 'organizations.branchAssignments.roles.salesAdvisor',
  },

  {
    value: BranchAssignmentRole.ComplianceOfficer,

    name: 'ComplianceOfficer',

    labelKey: 'organizations.branchAssignments.roles.complianceOfficer',
  },

  {
    value: BranchAssignmentRole.TrainingCoordinator,

    name: 'TrainingCoordinator',

    labelKey: 'organizations.branchAssignments.roles.trainingCoordinator',
  },

  {
    value: BranchAssignmentRole.Receptionist,

    name: 'Receptionist',

    labelKey: 'organizations.branchAssignments.roles.receptionist',
  },

  {
    value: BranchAssignmentRole.SupportAgent,

    name: 'SupportAgent',

    labelKey: 'organizations.branchAssignments.roles.supportAgent',
  },

  {
    value: BranchAssignmentRole.Other,

    name: 'Other',

    labelKey: 'organizations.branchAssignments.roles.other',
  },
] as const;

export function branchAssignmentRoleLabelKey(role: BranchAssignmentRoleName): string {
  const option = BRANCH_ASSIGNMENT_ROLE_OPTIONS.find((item) => item.name === role);

  return option?.labelKey ?? 'organizations.branchAssignments.roles.unknown';
}
