import { HttpErrorResponse } from '@angular/common/http';

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { finalize, forkJoin, of } from 'rxjs';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../../core/auth/authorization.service';

import { ApiErrorService } from '../../../../../core/errors/api-error.service';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';

import { BranchStatusDialogComponent } from '../../components/branch-status-dialog/branch-status-dialog.component';

import { BranchStatusHistoryComponent } from '../../components/branch-status-history/branch-status-history.component';

import { BranchSummaryComponent } from '../../components/branch-summary/branch-summary.component';

import { BranchesApiService } from '../../data-access/branches-api.service';
import { OrganizationsApiService } from '../../../data-access/organizations-api.service';
import { BranchUserAssignmentsApiService } from '../../../branch-assignments/data-access/branch-user-assignments-api.service';
import { Organization } from '../../../models/organization.model';

import {
  BranchLifecycleActionDefinition,
  getBranchLifecycleActions,
} from '../../domain/branch-lifecycle';

import { BranchStatusHistoryItem } from '../../models/branch-status-history-item';

import { Branch } from '../../models/branch.model';
import { BRANCH_PERMISSIONS } from '../../domain/branch-permissions';
import { BRANCH_ASSIGNMENT_PERMISSIONS } from '../../../branch-assignments/domain/branch-assignment-permissions';
import { BRANCH_CONFIGURATION_OVERRIDE_PERMISSIONS } from '../../../branch-configuration-overrides/domain/branch-configuration-override-permissions';

@Component({
  selector: 'driveos-branch-detail-page',

  standalone: true,

  imports: [
    TranslatePipe,
    RouterLink,
    BranchSummaryComponent,
    BranchStatusDialogComponent,
    BranchStatusHistoryComponent,

    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],

  templateUrl: './branch-detail.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchDetailPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly branchesApi = inject(BranchesApiService);

  private readonly organizationsApi = inject(OrganizationsApiService);

  private readonly branchAssignmentsApi = inject(BranchUserAssignmentsApiService);

  private readonly authorization = inject(AuthorizationService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly translate = inject(TranslateService);

  private readonly toastService = inject(DriveOsToastService);

  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  readonly branch = signal<Branch | null>(null);

  readonly organization = signal<Organization | null>(null);

  readonly hasPrimaryAdministrativeManager = signal(false);

  readonly statusHistory = signal<readonly BranchStatusHistoryItem[]>([]);

  readonly isLoading = signal(true);

  readonly isHistoryLoading = signal(false);

  readonly historyLoadError = signal(false);

  readonly isChangingStatus = signal(false);

  readonly isSettingPrimary = signal(false);

  readonly loadError = signal(false);

  readonly selectedAction = signal<BranchLifecycleActionDefinition | null>(null);

  readonly canReadHistory = computed(() =>
    this.authorization.hasPermission(BRANCH_PERMISSIONS.statusHistoryRead),
  );

  readonly canSetPrimary = computed(() => {
    const branch = this.branch();

    return Boolean(
      branch &&
      !branch.isPrimary &&
      branch.status !== 'Closed' &&
      this.authorization.hasPermission(BRANCH_PERMISSIONS.setPrimary),
    );
  });

  readonly branchActivationReady = computed(() => {
    const branch = this.branch();
    const organization = this.organization();

    return Boolean(
      branch?.status === 'Draft' &&
      organization?.status === 'Active' &&
      this.hasPrimaryAdministrativeManager(),
    );
  });

  readonly branchActivationNextStep = computed<'organization' | 'manager' | null>(() => {
    const branch = this.branch();
    const organization = this.organization();

    if (!branch || branch.status !== 'Draft' || !organization) {
      return null;
    }

    if (organization.status !== 'Active') {
      return 'organization';
    }

    if (!this.hasPrimaryAdministrativeManager()) {
      return 'manager';
    }

    return null;
  });

  readonly availableActions = computed<readonly BranchLifecycleActionDefinition[]>(() => {
    const branch = this.branch();

    if (!branch) {
      return [];
    }

    return getBranchLifecycleActions(branch.status).filter((action) => {
      if (!this.authorization.hasPermission(action.permission)) {
        return false;
      }

      if (action.code === 'activate') {
        return this.branchActivationReady();
      }

      return true;
    });
  });

  readonly teamLink = computed(() => [
    '/organizations',
    this.organizationId,
    'branches',
    this.branchId,
    'team',
  ]);

  readonly configurationOverridesLink = computed(() => [
    '/organizations',
    this.organizationId,
    'branches',
    this.branchId,
    'configuration-overrides',
  ]);

  readonly canReadConfigurationOverrides = computed(() =>
    this.authorization.hasPermission(BRANCH_CONFIGURATION_OVERRIDE_PERMISSIONS.read),
  );

  readonly canManageTeam = computed(() =>
    this.authorization.hasPermission(BRANCH_ASSIGNMENT_PERMISSIONS.read),
  );

  constructor() {
    this.loadBranch();
  }

  loadBranch(): void {
    if (!this.organizationId || !this.branchId) {
      this.isLoading.set(false);
      this.loadError.set(true);

      return;
    }

    this.isLoading.set(true);
    this.loadError.set(false);

    forkJoin({
      branch: this.branchesApi.getById(this.organizationId, this.branchId),
      organization: this.organizationsApi.getById(this.organizationId),
      primaryManagers: this.authorization.hasPermission(BRANCH_ASSIGNMENT_PERMISSIONS.read)
        ? this.branchAssignmentsApi.getByBranch(this.organizationId, this.branchId, {
            pageNumber: 1,
            pageSize: 10,
            search: '',
            status: 'Active',
            role: 'AdministrativeManager',
            assignmentType: 'Primary',
            sortBy: 'startsAtUtc',
            sortDirection: 'desc',
          })
        : of(null),
    })
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ branch, organization, primaryManagers }) => {
          this.branch.set(branch);
          this.organization.set(organization);
          this.hasPrimaryAdministrativeManager.set(
            primaryManagers === null ? false : primaryManagers.items.length > 0,
          );

          if (this.canReadHistory()) {
            this.loadStatusHistory();
          }
        },

        error: (error: HttpErrorResponse) => {
          this.loadError.set(true);
          this.showErrors(error);
        },
      });
  }

  loadStatusHistory(): void {
    if (!this.organizationId || !this.branchId || !this.canReadHistory()) {
      return;
    }

    this.historyLoadError.set(false);
    this.isHistoryLoading.set(true);

    this.branchesApi
      .getStatusHistory(this.organizationId, this.branchId)
      .pipe(
        finalize(() => this.isHistoryLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (history) => this.statusHistory.set(history),

        error: (error: HttpErrorResponse) => {
          this.historyLoadError.set(true);

          this.showErrors(error);
        },
      });
  }

  openStatusDialog(action: BranchLifecycleActionDefinition): void {
    const branch = this.branch();

    if (!branch) {
      return;
    }

    const isAllowed = getBranchLifecycleActions(branch.status).some(
      (candidate) => candidate.code === action.code,
    );

    if (!isAllowed || !this.authorization.hasPermission(action.permission)) {
      return;
    }

    this.selectedAction.set(action);
  }

  closeStatusDialog(): void {
    if (this.isChangingStatus()) {
      return;
    }

    this.selectedAction.set(null);
  }

  confirmStatusChange(reason: string): void {
    const action = this.selectedAction();

    if (!action || this.isChangingStatus()) {
      return;
    }

    this.isChangingStatus.set(true);

    this.branchesApi
      .changeStatus(this.organizationId, this.branchId, action.code, {
        reason,
      })
      .pipe(
        finalize(() => this.isChangingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.selectedAction.set(null);

          this.toastService.success(
            this.translate.instant('organizations.branches.lifecycle.changeSuccess'),
          );

          this.reloadAfterMutation();
        },

        error: (error: HttpErrorResponse) => {
          this.showErrors(error);
        },
      });
  }

  setPrimary(): void {
    if (!this.canSetPrimary() || this.isSettingPrimary()) {
      return;
    }

    this.isSettingPrimary.set(true);

    this.branchesApi
      .setPrimary(this.organizationId, this.branchId)
      .pipe(
        finalize(() => this.isSettingPrimary.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success(
            this.translate.instant('organizations.branches.notifications.primarySet'),
          );

          this.reloadBranchOnly();
        },

        error: (error: HttpErrorResponse) => {
          this.showErrors(error);
        },
      });
  }

  goBack(): void {
    void this.router.navigate(['/organizations', this.organizationId, 'branches']);
  }

  private reloadAfterMutation(): void {
    this.reloadBranchOnly();

    if (this.canReadHistory()) {
      this.loadStatusHistory();
    }
  }

  private reloadBranchOnly(): void {
    forkJoin({
      branch: this.branchesApi.getById(this.organizationId, this.branchId),
      organization: this.organizationsApi.getById(this.organizationId),
      primaryManagers: this.authorization.hasPermission(BRANCH_ASSIGNMENT_PERMISSIONS.read)
        ? this.branchAssignmentsApi.getByBranch(this.organizationId, this.branchId, {
            pageNumber: 1,
            pageSize: 10,
            search: '',
            status: 'Active',
            role: 'AdministrativeManager',
            assignmentType: 'Primary',
            sortBy: 'startsAtUtc',
            sortDirection: 'desc',
          })
        : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ branch, organization, primaryManagers }) => {
          this.branch.set(branch);
          this.organization.set(organization);
          this.hasPrimaryAdministrativeManager.set(
            primaryManagers === null ? false : primaryManagers.items.length > 0,
          );
        },

        error: (error: HttpErrorResponse) => {
          this.showErrors(error);

          this.toastService.warning(
            this.translate.instant('organizations.branches.notifications.refreshWarningTitle'),
            this.translate.instant(
              'organizations.branches.notifications.refreshWarningDescription',
            ),
          );
        },
      });
  }

  private showErrors(error: HttpErrorResponse): void {
    const messages = this.apiErrorService.getMessages(error);

    for (const message of messages) {
      this.toastService.error(this.translate.instant('errors.title'), message);
    }
  }
}
