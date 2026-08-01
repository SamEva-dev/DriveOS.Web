export const ORGANIZATION_STATUSES = [
  'Draft',
  'PendingActivation',
  'Active',
  'Restricted',
  'Suspended',
  'Closed',
  'Archived',
] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export function isOrganizationStatus(value: string): value is OrganizationStatus {
  return ORGANIZATION_STATUSES.includes(value as OrganizationStatus);
}
