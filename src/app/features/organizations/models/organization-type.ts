export enum OrganizationType {
  DrivingSchool = 1,
  DrivingSchoolNetwork = 2,
  TrainingCenter = 3,
  IndependentInstructorBusiness = 4,
  VehicleProvider = 5,
  FundingOrganization = 6,
  PartnerOrganization = 7,
  PlatformOperator = 8,
}

export interface OrganizationTypeOption {
  value: OrganizationType;
  labelKey: string;
}

export const ORGANIZATION_TYPE_OPTIONS: readonly OrganizationTypeOption[] = [
  {
    value: OrganizationType.DrivingSchool,
    labelKey: 'organizations.types.drivingSchool',
  },
  {
    value: OrganizationType.DrivingSchoolNetwork,
    labelKey: 'organizations.types.drivingSchoolNetwork',
  },
  {
    value: OrganizationType.TrainingCenter,
    labelKey: 'organizations.types.trainingCenter',
  },
  {
    value: OrganizationType.IndependentInstructorBusiness,
    labelKey: 'organizations.types.independentInstructorBusiness',
  },
  {
    value: OrganizationType.VehicleProvider,
    labelKey: 'organizations.types.vehicleProvider',
  },
  {
    value: OrganizationType.FundingOrganization,
    labelKey: 'organizations.types.fundingOrganization',
  },
  {
    value: OrganizationType.PartnerOrganization,
    labelKey: 'organizations.types.partnerOrganization',
  },
  {
    value: OrganizationType.PlatformOperator,
    labelKey: 'organizations.types.platformOperator',
  },
] as const;
