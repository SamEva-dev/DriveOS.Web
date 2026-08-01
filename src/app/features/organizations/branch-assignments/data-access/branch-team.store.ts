import { Injectable, computed, inject, signal } from '@angular/core';

import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/errors/api-error.service';

import { PagedResponse } from '../../../../core/models/paged-response';

import { BranchUserAssignment } from '../models/branch-user-assignment.model';

import { BranchAssignmentLifecycleAction } from '../models/branch-assignment-lifecycle-action';

import { GetBranchUserAssignmentsParameters } from '../models/get-branch-user-assignments-parameters';

import { BranchUserAssignmentsApiService } from './branch-user-assignments-api.service';

const EMPTY_PAGE: PagedResponse<BranchUserAssignment> = {
  items: [],
  pageNumber: 1,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Injectable()
export class BranchTeamStore {
  private readonly api = inject(BranchUserAssignmentsApiService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly pageState = signal<PagedResponse<BranchUserAssignment>>(EMPTY_PAGE);

  private readonly loadingState = signal(false);

  private readonly actionLoadingState = signal(false);

  private readonly errorMessagesState = signal<readonly string[]>([]);

  private organizationId = '';

  private branchId = '';

  private parameters: GetBranchUserAssignmentsParameters = {
    pageNumber: 1,

    pageSize: 20,

    search: '',

    status: null,

    role: null,

    assignmentType: null,

    sortBy: 'createdAtUtc',

    sortDirection: 'desc',
  };

  readonly page = this.pageState.asReadonly();

  readonly loading = this.loadingState.asReadonly();

  readonly actionLoading = this.actionLoadingState.asReadonly();

  readonly errorMessages = this.errorMessagesState.asReadonly();

  readonly assignments = computed(() => this.pageState().items);

  readonly hasItems = computed(() => this.pageState().items.length > 0);

  initialize(organizationId: string, branchId: string): void {
    this.organizationId = organizationId;

    this.branchId = branchId;

    this.load();
  }

  setFilters(filters: Partial<GetBranchUserAssignmentsParameters>): void {
    this.parameters = {
      ...this.parameters,
      ...filters,
      pageNumber: filters.pageNumber ?? 1,
    };

    this.load();
  }

  changePage(pageNumber: number, pageSize: number): void {
    this.parameters = {
      ...this.parameters,
      pageNumber,
      pageSize,
    };

    this.load();
  }

  reload(): void {
    this.load();
  }

  executeAction(
    assignmentId: string,
    action: BranchAssignmentLifecycleAction,
    reason: string,
    onSuccess: () => void,
    onFailure?: (messages: readonly string[]) => void,
  ): void {
    this.actionLoadingState.set(true);

    this.errorMessagesState.set([]);

    const request = {
      reason,
    };

    const operation =
      action === 'suspend'
        ? this.api.suspend(this.organizationId, assignmentId, request)
        : action === 'reactivate'
          ? this.api.reactivate(this.organizationId, assignmentId, request)
          : this.api.end(this.organizationId, assignmentId, request);

    operation
      .pipe(
        finalize(() => {
          this.actionLoadingState.set(false);
        }),
      )
      .subscribe({
        next: () => {
          onSuccess();
          this.load();
        },

        error: (error) => {
          const messages = this.apiErrorService.getMessages(error);

          this.errorMessagesState.set(messages);

          onFailure?.(messages);
        },
      });
  }

  private load(): void {
    if (!this.organizationId || !this.branchId) {
      return;
    }

    this.loadingState.set(true);

    this.errorMessagesState.set([]);

    this.api
      .getByBranch(this.organizationId, this.branchId, this.parameters)
      .pipe(
        finalize(() => {
          this.loadingState.set(false);
        }),
      )
      .subscribe({
        next: (page) => {
          this.pageState.set(page);
        },

        error: (error) => {
          this.pageState.set(EMPTY_PAGE);

          this.errorMessagesState.set(this.apiErrorService.getMessages(error));
        },
      });
  }
}
