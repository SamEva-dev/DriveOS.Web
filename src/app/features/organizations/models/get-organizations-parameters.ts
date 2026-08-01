export type OrganizationSortField = 'legalName' | 'countryCode' | 'type' | 'status' | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export interface GetOrganizationsParameters {
  pageNumber: number;
  pageSize: number;
  search: string;
  sortBy: OrganizationSortField;
  sortDirection: SortDirection;
}
