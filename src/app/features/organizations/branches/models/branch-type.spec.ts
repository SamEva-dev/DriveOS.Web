import { BranchType, branchTypeFromName, branchTypeLabelKey } from './branch-type';

describe('branch type mapping', () => {
  it('should map backend names to numeric API values', () => {
    expect(branchTypeFromName('Headquarters')).toBe(BranchType.Headquarters);

    expect(branchTypeFromName('DrivingSchoolAgency')).toBe(BranchType.DrivingSchoolAgency);

    expect(branchTypeFromName('VirtualBranch')).toBe(BranchType.VirtualBranch);
  });

  it('should return the matching translation key', () => {
    expect(branchTypeLabelKey('TrainingSite')).toBe('organizations.branches.types.trainingSite');
  });

  it('should preserve backend enum numeric values', () => {
    expect(BranchType.Headquarters).toBe(1);

    expect(BranchType.DrivingSchoolAgency).toBe(2);

    expect(BranchType.TrainingSite).toBe(3);

    expect(BranchType.AdministrativeOffice).toBe(4);

    expect(BranchType.ExaminationSupportSite).toBe(5);

    expect(BranchType.VirtualBranch).toBe(6);

    expect(BranchType.Other).toBe(99);
  });
});
