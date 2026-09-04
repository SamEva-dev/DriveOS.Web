import { computed, inject, Injectable, signal } from '@angular/core';

import { HttpParams, httpResource } from '@angular/common/http';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';

import { PagedResponse } from '../../../core/models/paged-response';

import {
  GetOrganizationsParameters,
  OrganizationSortField,
  SortDirection,
} from '../models/get-organizations-parameters';

import { OrganizationListItem } from '../models/organization-list-item';

const DEFAULT_PAGE_SIZE = 20;

const EMPTY_PAGE: PagedResponse<OrganizationListItem> = {
  items: [],
  pageNumber: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Injectable()
export class OrganizationsListStore {
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  private readonly parametersSignal = signal<GetOrganizationsParameters>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: '',
    sortBy: 'legalName',
    sortDirection: 'asc',
  });

  readonly parameters = this.parametersSignal.asReadonly();

  private readonly resource = httpResource<PagedResponse<OrganizationListItem>>(
    () => {
      const parameters = this.parametersSignal();

      const httpParams = new HttpParams()
        .set('pageNumber', parameters.pageNumber)
        .set('pageSize', parameters.pageSize)
        .set('search', parameters.search)
        .set('sortBy', parameters.sortBy)
        .set('sortDirection', parameters.sortDirection);

      return {
        url: `${this.apiConfig.baseUrl}/organizations`,
        method: 'GET',
        params: httpParams,
      };
    },
    {
      defaultValue: EMPTY_PAGE,
    },
  );

  readonly error = this.resource.error;

  // httpResource.value() throws ResourceValueError while the resource is in
  // an error state. Never let a temporary API outage break template rendering.
  readonly page = computed(() => (this.error() ? EMPTY_PAGE : this.resource.value()));

  readonly organizations = computed(() => [...this.page().items]);

  readonly totalCount = computed(() => this.page().totalCount);

  readonly isLoading = this.resource.isLoading;

  readonly hasError = computed(() => this.error() !== undefined);

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && this.organizations().length === 0,
  );

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

  setSorting(sortBy: OrganizationSortField, sortDirection: SortDirection): void {
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
