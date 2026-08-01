export type BranchSortField = 'name' | 'code' | 'city' | 'branchType' | 'status' | 'createdAtUtc';

export type BranchSortDirection = 'asc' | 'desc';

export interface GetBranchesParameters {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly search: string;
  readonly sortBy: BranchSortField;
  readonly sortDirection: BranchSortDirection;
}

export const DEFAULT_GET_BRANCHES_PARAMETERS: GetBranchesParameters = {
  pageNumber: 1,
  pageSize: 20,
  search: '',
  sortBy: 'name',
  sortDirection: 'asc',
};
