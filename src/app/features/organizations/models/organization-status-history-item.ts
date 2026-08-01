import { OrganizationStatus } from './organization-status';

export interface OrganizationStatusHistoryItem {
  id: string;
  previousStatus: OrganizationStatus;
  newStatus: OrganizationStatus;
  reason: string;
  changedByUserId: string;
  changedAtUtc: string;
}
