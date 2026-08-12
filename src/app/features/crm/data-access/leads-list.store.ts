import { HttpParams, httpResource } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { PagedResponse } from '../../../core/models/paged-response';
import {
  GetLeadsParameters,
  LeadSortField,
  SortDirection,
} from '../models/get-leads-parameters';
import { LeadListItem, LeadSourceType, LeadStatus } from '../models/lead.model';

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_PAGE: PagedResponse<LeadListItem> = {
  items: [], pageNumber: 1, pageSize: DEFAULT_PAGE_SIZE, totalCount: 0,
  totalPages: 0, hasPreviousPage: false, hasNextPage: false,
};

@Injectable()
export class LeadsListStore {
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly parametersSignal = signal<GetLeadsParameters>({
    pageNumber: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: '',
    status: '',
    sourceType: '',
    branchId: '',
    assignedAdvisorId: '',
    unassignedOnly: false,
    sortBy: 'createdAtUtc',
    sortDirection: 'desc',
  });

  readonly parameters = this.parametersSignal.asReadonly();

  private readonly resource = httpResource<PagedResponse<LeadListItem>>(() => {
    const parameters = this.parametersSignal();
    let params = new HttpParams()
      .set('pageNumber', parameters.pageNumber)
      .set('pageSize', parameters.pageSize)
      .set('search', parameters.search)
      .set('unassignedOnly', parameters.unassignedOnly)
      .set('sortBy', parameters.sortBy)
      .set('sortDirection', parameters.sortDirection);

    if (parameters.status) params = params.set('status', parameters.status);
    if (parameters.sourceType) params = params.set('sourceType', parameters.sourceType);
    if (parameters.branchId) params = params.set('branchId', parameters.branchId);
    if (parameters.assignedAdvisorId) params = params.set('assignedAdvisorId', parameters.assignedAdvisorId);

    return { url: `${this.apiConfig.baseUrl}/crm/leads`, method: 'GET', params };
  }, { defaultValue: EMPTY_PAGE });

  readonly page = this.resource.value;
  readonly leads = computed(() => [...this.page().items]);
  readonly isLoading = this.resource.isLoading;
  readonly error = this.resource.error;

  setPage(pageNumber: number, pageSize: number): void {
    this.parametersSignal.update((current) => ({ ...current, pageNumber, pageSize }));
  }

  setSearch(search: string): void {
    this.parametersSignal.update((current) => ({ ...current, search: search.trim(), pageNumber: 1 }));
  }

  setFilters(status: LeadStatus | '', sourceType: LeadSourceType | '', unassignedOnly: boolean,
    branchId = '', assignedAdvisorId = ''): void {
    this.parametersSignal.update((current) => ({
      ...current, status, sourceType, unassignedOnly, branchId: branchId.trim(),
      assignedAdvisorId: assignedAdvisorId.trim(), pageNumber: 1,
    }));
  }

  setSorting(sortBy: LeadSortField, sortDirection: SortDirection): void {
    this.parametersSignal.update((current) => ({ ...current, sortBy, sortDirection, pageNumber: 1 }));
  }

  reload(): void { this.resource.reload(); }
}
