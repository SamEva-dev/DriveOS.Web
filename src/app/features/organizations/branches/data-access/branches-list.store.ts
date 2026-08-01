import { HttpParams, httpResource } from '@angular/common/http';

import { Injectable, computed, inject, signal } from '@angular/core';

import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';

import { PagedResponse } from '../../../../core/models/paged-response';

import { BranchListItem } from '../models/branch-list-item';

import {
  BranchSortDirection,
  BranchSortField,
  DEFAULT_GET_BRANCHES_PARAMETERS,
  GetBranchesParameters,
} from '../models/get-branches-parameters';

const EMPTY_PAGE: PagedResponse<BranchListItem> = {
  items: [],
  pageNumber: 1,
  pageSize: DEFAULT_GET_BRANCHES_PARAMETERS.pageSize,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Injectable()
export class BranchesListStore {
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  private readonly organizationIdSignal = signal<string | null>(null);

  private readonly parametersSignal = signal<GetBranchesParameters>({
    ...DEFAULT_GET_BRANCHES_PARAMETERS,
  });

  readonly organizationId = this.organizationIdSignal.asReadonly();

  readonly parameters = this.parametersSignal.asReadonly();

  private readonly resource = httpResource<PagedResponse<BranchListItem>>(
    () => {
      const organizationId = this.organizationIdSignal();

      if (!organizationId) {
        return undefined;
      }

      const parameters = this.parametersSignal();

      let httpParams = new HttpParams()
        .set('pageNumber', parameters.pageNumber)
        .set('pageSize', parameters.pageSize)
        .set('sortBy', parameters.sortBy)
        .set('sortDirection', parameters.sortDirection);

      const search = parameters.search.trim();

      if (search) {
        httpParams = httpParams.set('search', search);
      }

      return {
        url: [this.apiConfig.baseUrl, 'organizations', organizationId, 'branches'].join('/'),

        method: 'GET',

        params: httpParams,
      };
    },
    {
      defaultValue: EMPTY_PAGE,
    },
  );

  readonly page = this.resource.value;

  readonly branches = computed(() => [...this.page().items]);

  readonly totalCount = computed(() => this.page().totalCount);

  readonly isLoading = this.resource.isLoading;

  readonly error = this.resource.error;

  readonly hasError = computed(() => this.error() !== undefined);

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && this.branches().length === 0,
  );

  initialize(organizationId: string): void {
    if (this.organizationIdSignal() === organizationId) {
      return;
    }

    this.organizationIdSignal.set(organizationId);
  }

  setPage(pageNumber: number, pageSize: number): void {
    this.parametersSignal.update((current) => ({
      ...current,
      pageNumber,
      pageSize,
    }));
  }

  setSearch(search: string): void {
    this.parametersSignal.update((current) => ({
      ...current,
      search: search.trim(),
      pageNumber: 1,
    }));
  }

  setSorting(sortBy: BranchSortField, sortDirection: BranchSortDirection): void {
    this.parametersSignal.update((current) => ({
      ...current,
      sortBy,
      sortDirection,
      pageNumber: 1,
    }));
  }

  reload(): void {
    this.resource.reload();
  }
}
