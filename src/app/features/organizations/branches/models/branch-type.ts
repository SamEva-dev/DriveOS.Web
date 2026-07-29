export enum BranchType {
  Headquarters = 1,
  DrivingSchoolAgency = 2,
  TrainingSite = 3,
  AdministrativeOffice = 4,
  ExaminationSupportSite = 5,
  VirtualBranch = 6,
  Other = 99,
}

export type BranchTypeName =
  | 'Headquarters'
  | 'DrivingSchoolAgency'
  | 'TrainingSite'
  | 'AdministrativeOffice'
  | 'ExaminationSupportSite'
  | 'VirtualBranch'
  | 'Other';

export interface BranchTypeOption {
  readonly value: BranchType;
  readonly name: BranchTypeName;
  readonly labelKey: string;
}

export const BRANCH_TYPE_OPTIONS:
  readonly BranchTypeOption[] = [
  {
    value: BranchType.Headquarters,
    name: 'Headquarters',
    labelKey:
      'organizations.branches.types.headquarters',
  },
  {
    value:
      BranchType.DrivingSchoolAgency,
    name: 'DrivingSchoolAgency',
    labelKey:
      'organizations.branches.types.drivingSchoolAgency',
  },
  {
    value: BranchType.TrainingSite,
    name: 'TrainingSite',
    labelKey:
      'organizations.branches.types.trainingSite',
  },
  {
    value:
      BranchType.AdministrativeOffice,
    name: 'AdministrativeOffice',
    labelKey:
      'organizations.branches.types.administrativeOffice',
  },
  {
    value:
      BranchType.ExaminationSupportSite,
    name: 'ExaminationSupportSite',
    labelKey:
      'organizations.branches.types.examinationSupportSite',
  },
  {
    value: BranchType.VirtualBranch,
    name: 'VirtualBranch',
    labelKey:
      'organizations.branches.types.virtualBranch',
  },
  {
    value: BranchType.Other,
    name: 'Other',
    labelKey:
      'organizations.branches.types.other',
  },
] as const;

export function branchTypeFromName(
  branchTypeName: BranchTypeName,
): BranchType {
  const option =
    BRANCH_TYPE_OPTIONS.find(
      item =>
        item.name === branchTypeName,
    );

  return (
    option?.value ??
    BranchType.Other
  );
}

export function branchTypeLabelKey(
  branchTypeName: BranchTypeName,
): string {
  const option =
    BRANCH_TYPE_OPTIONS.find(
      item =>
        item.name === branchTypeName,
    );

  return (
    option?.labelKey ??
    'organizations.branches.types.unknown'
  );
}
