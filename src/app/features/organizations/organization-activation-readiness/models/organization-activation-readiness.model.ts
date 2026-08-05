export type OrganizationActivationRequirementSeverity =
  | 'Information'
  | 'Warning'
  | 'Blocking';

export interface OrganizationActivationRequirement {
  code: string;
  isSatisfied: boolean;
  severity: OrganizationActivationRequirementSeverity;
  messageKey: string;
  parameters: Readonly<Record<string, unknown>>;
}

export interface OrganizationActivationReadiness {
  organizationId: string;
  isReady: boolean;
  requirements: readonly OrganizationActivationRequirement[];
  blockingRequirements: readonly OrganizationActivationRequirement[];
}
