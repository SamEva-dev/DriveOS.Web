import { HttpErrorResponse } from '@angular/common/http';

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { forkJoin } from 'rxjs';

import { ApiErrorService } from '../../../../core/errors/api-error.service';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';

import { OrganizationStatusDialogComponent } from '../../components/organization-status-dialog/organization-status-dialog.component';

import { OrganizationStatusHistoryComponent } from '../../components/organization-status-history/organization-status-history.component';

import { OrganizationSummaryComponent } from '../../components/organization-summary/organization-summary.component';

import { OrganizationsApiService } from '../../data-access/organizations-api.service';

import { OrganizationStatusAction } from '../../models/organization-status-action';

import { OrganizationStatusHistoryItem } from '../../models/organization-status-history-item';

import { OrganizationStatus } from '../../models/organization-status';

import { Organization } from '../../models/organization.model';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ORGANIZATION_SUBSCRIPTION_PERMISSIONS } from '../../organization-subscriptions/domain/organization-subscription-permissions';
import { ORGANIZATION_CONFIGURATION_PERMISSIONS } from '../../organization-configurations/domain/organization-configuration-permissions';
import {
  OrganizationLifecycleActionDefinition,
  getOrganizationLifecycleActions,
} from '../../domain/organization-lifecycle';

@Component({
  selector: 'driveos-organization-detail-page',
  standalone: true,
  imports: [
    TranslatePipe,
    OrganizationSummaryComponent,
    OrganizationStatusDialogComponent,
    OrganizationStatusHistoryComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    RouterLink,
  ],
  templateUrl: './organization-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly authorization = inject(AuthorizationService);

  private readonly organizationsApi = inject(OrganizationsApiService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly translate = inject(TranslateService);

  private readonly toastService = inject(DriveOsToastService);

  private readonly destroyRef = inject(DestroyRef);

  readonly organization = signal<Organization | null>(null);

  readonly statusHistory = signal<readonly OrganizationStatusHistoryItem[]>([]);

  readonly isLoading = signal(true);

  readonly isHistoryLoading = signal(false);

  readonly isChangingStatus = signal(false);

  readonly selectedAction = signal<OrganizationStatusAction | null>(null);

  private readonly organizationId: string | null;

  constructor() {
    this.organizationId = this.route.snapshot.paramMap.get('organizationId');

    if (!this.organizationId) {
      this.isLoading.set(false);

      void this.router.navigate(['/organizations']);

      return;
    }

    this.loadPage();
  }
  readonly availableActions = computed<readonly OrganizationLifecycleActionDefinition[]>(() => {
    const organization = this.organization();

    if (!organization) {
      return [];
    }

    return getOrganizationLifecycleActions(organization.status).filter((action) =>
      this.authorization.hasPermission(action.permission),
    );
  });

  readonly canReadSubscription = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_SUBSCRIPTION_PERMISSIONS.read),
  );

  readonly subscriptionLink = computed(() =>
    this.organizationId
      ? ['/organizations', this.organizationId, 'subscription']
      : ['/organizations'],
  );

  readonly canReadConfigurations = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_CONFIGURATION_PERMISSIONS.read),
  );

  readonly configurationsLink = computed(() =>
    this.organizationId
      ? ['/organizations', this.organizationId, 'configurations']
      : ['/organizations'],
  );

  openStatusDialog(action: OrganizationLifecycleActionDefinition): void {
    const organization = this.organization();

    if (!organization) {
      return;
    }

    const allowed = getOrganizationLifecycleActions(organization.status).some(
      (candidate) => candidate.code === action.code,
    );

    if (!allowed || !this.authorization.hasPermission(action.permission)) {
      return;
    }

    this.selectedAction.set(action);
  }

  closeStatusDialog(): void {
    if (!this.isChangingStatus()) {
      this.selectedAction.set(null);
    }
  }

  confirmStatusChange(reason: string): void {
    const action = this.selectedAction();

    if (!action || !this.organizationId || this.isChangingStatus()) {
      return;
    }

    this.isChangingStatus.set(true);

    this.organizationsApi
      .changeStatus(this.organizationId, action.code, {
        reason,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isChangingStatus.set(false);
          this.selectedAction.set(null);

          this.toastService.success(
            this.translate.instant('organizations.lifecycle.changeSuccess'),
          );

          this.reloadAfterStatusChange();
        },

        error: (error: HttpErrorResponse) => {
          this.isChangingStatus.set(false);

          const messages = this.apiErrorService.getMessages(error);

          for (const message of messages) {
            this.toastService.error(this.translate.instant('errors.title'), message);
          }
        },
      });
  }

  goBack(): void {
    void this.router.navigate(['/organizations']);
  }

  private loadPage(): void {
    if (!this.organizationId) {
      return;
    }

    this.isLoading.set(true);

    forkJoin({
      organization: this.organizationsApi.getById(this.organizationId),

      history: this.organizationsApi.getStatusHistory(this.organizationId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.organization.set(result.organization);

          this.statusHistory.set(result.history);

          this.isLoading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);

          this.showErrors(error);

          void this.router.navigate(['/organizations']);
        },
      });
  }

  private reloadAfterStatusChange(): void {
    if (!this.organizationId) {
      return;
    }

    this.isHistoryLoading.set(true);

    forkJoin({
      organization: this.organizationsApi.getById(this.organizationId),

      history: this.organizationsApi.getStatusHistory(this.organizationId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.organization.set(result.organization);

          this.statusHistory.set(result.history);

          this.isHistoryLoading.set(false);
        },

        error: (error: HttpErrorResponse) => {
          this.isHistoryLoading.set(false);

          this.showErrors(error);

          this.toastService.warning(
            this.translate.instant('organizations.lifecycle.refreshWarning.title'),
            this.translate.instant('organizations.lifecycle.refreshWarning.description'),
          );
        },
      });
  }
  readonly branchesLink = computed(() => {
    const organization = this.organization();

    return organization ? ['/organizations', organization.id, 'branches'] : ['/organizations'];
  });

  private showErrors(error: HttpErrorResponse): void {
    const messages = this.apiErrorService.getMessages(error);

    for (const message of messages) {
      this.toastService.error(this.translate.instant('errors.title'), message);
    }
  }
}
