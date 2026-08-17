import { LeadSourceType, LeadStatus } from './lead.model';

export type LeadSortField =
  'createdAtUtc' | 'lastName' | 'firstName' | 'status' | 'sourceType' | 'licenseCategory';

export type SortDirection = 'asc' | 'desc';

export interface GetLeadsParameters {
  pageNumber: number;
  pageSize: number;
  search: string;
  status: LeadStatus | '';
  sourceType: LeadSourceType | '';
  branchId: string;
  assignedAdvisorId: string;
  unassignedOnly: boolean;
  sortBy: LeadSortField;
  sortDirection: SortDirection;
}
