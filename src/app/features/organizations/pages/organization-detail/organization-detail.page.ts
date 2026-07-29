import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  TranslatePipe,
  TranslateService,
} from '@ngx-translate/core';

import {
  forkJoin,
} from 'rxjs';

import {
  ApiErrorService,
} from '../../../../core/errors/api-error.service';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';

import {
  OrganizationStatusDialogComponent,
} from '../../components/organization-status-dialog/organization-status-dialog.component';

import {
  OrganizationStatusHistoryComponent,
} from '../../components/organization-status-history/organization-status-history.component';

import {
  OrganizationSummaryComponent,
} from '../../components/organization-summary/organization-summary.component';

import {
  OrganizationsApiService,
} from '../../data-access/organizations-api.service';

import {
  OrganizationStatusAction,
} from '../../models/organization-status-action';

import {
  OrganizationStatusHistoryItem,
} from '../../models/organization-status-history-item';

import {
  OrganizationStatus,
} from '../../models/organization-status';

import {
  Organization,
} from '../../models/organization.model';

@Component({
  selector:
    'driveos-organization-detail-page',
  standalone: true,
  imports: [
    TranslatePipe,
    OrganizationSummaryComponent,
    OrganizationStatusDialogComponent,
    OrganizationStatusHistoryComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl:
    './organization-detail.page.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OrganizationDetailPage {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly organizationsApi =
    inject(OrganizationsApiService);

  private readonly apiErrorService =
    inject(ApiErrorService);

  private readonly translate =
    inject(TranslateService);

  private readonly toastService =
    inject(DriveOsToastService);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly organization =
    signal<Organization | null>(null);

  readonly statusHistory =
    signal<
      readonly OrganizationStatusHistoryItem[]
    >([]);

  readonly isLoading =
    signal(true);

  readonly isHistoryLoading =
    signal(false);

  readonly isChangingStatus =
    signal(false);

  readonly selectedAction =
    signal<OrganizationStatusAction | null>(
      null,
    );

  private readonly organizationId:
    string | null;

  constructor() {
    this.organizationId =
      this.route.snapshot.paramMap.get(
        'organizationId',
      );

    if (!this.organizationId) {
      this.isLoading.set(false);

      void this.router.navigate([
        '/organizations',
      ]);

      return;
    }

    this.loadPage();
  }

  readonly allActions:
    readonly OrganizationStatusAction[] = [
    {
      code: 'submitForActivation',
      labelKey:
        'organizations.lifecycle.actions.submitForActivation.label',
      titleKey:
        'organizations.lifecycle.actions.submitForActivation.title',
      descriptionKey:
        'organizations.lifecycle.actions.submitForActivation.description',
      icon: 'ph-bold ph-paper-plane-tilt',
      buttonVariant: 'primary',
    },
    {
      code: 'activate',
      labelKey:
        'organizations.lifecycle.actions.activate.label',
      titleKey:
        'organizations.lifecycle.actions.activate.title',
      descriptionKey:
        'organizations.lifecycle.actions.activate.description',
      icon: 'ph-bold ph-check-circle',
      buttonVariant: 'primary',
    },
    {
      code: 'restrict',
      labelKey:
        'organizations.lifecycle.actions.restrict.label',
      titleKey:
        'organizations.lifecycle.actions.restrict.title',
      descriptionKey:
        'organizations.lifecycle.actions.restrict.description',
      icon: 'ph-bold ph-warning',
      buttonVariant: 'outline',
    },
    {
      code: 'suspend',
      labelKey:
        'organizations.lifecycle.actions.suspend.label',
      titleKey:
        'organizations.lifecycle.actions.suspend.title',
      descriptionKey:
        'organizations.lifecycle.actions.suspend.description',
      icon: 'ph-bold ph-pause-circle',
      buttonVariant: 'danger',
    },
    {
      code: 'reactivate',
      labelKey:
        'organizations.lifecycle.actions.reactivate.label',
      titleKey:
        'organizations.lifecycle.actions.reactivate.title',
      descriptionKey:
        'organizations.lifecycle.actions.reactivate.description',
      icon: 'ph-bold ph-arrow-counter-clockwise',
      buttonVariant: 'primary',
    },
    {
      code: 'close',
      labelKey:
        'organizations.lifecycle.actions.close.label',
      titleKey:
        'organizations.lifecycle.actions.close.title',
      descriptionKey:
        'organizations.lifecycle.actions.close.description',
      icon: 'ph-bold ph-lock-key',
      buttonVariant: 'danger',
    },
  ];

  availableActions(
    status: OrganizationStatus,
  ): readonly OrganizationStatusAction[] {
    const allowedCodes:
      Readonly<
        Partial<
          Record<
            OrganizationStatus,
            readonly OrganizationStatusAction['code'][]
          >
        >
      > = {
      Draft: [
        'submitForActivation',
      ],

      PendingActivation: [
        'activate',
      ],

      Active: [
        'restrict',
        'suspend',
        'close',
      ],

      Restricted: [
        'reactivate',
        'suspend',
        'close',
      ],

      Suspended: [
        'reactivate',
        'close',
      ],

      Closed: [],
      Archived: [],
    };

    const codes =
      allowedCodes[status] ?? [];

    return this.allActions.filter(
      action =>
        codes.includes(action.code),
    );
  }

  openStatusDialog(
    action: OrganizationStatusAction,
  ): void {
    this.selectedAction.set(action);
  }

  closeStatusDialog(): void {
    if (!this.isChangingStatus()) {
      this.selectedAction.set(null);
    }
  }

  confirmStatusChange(
    reason: string,
  ): void {
    const action =
      this.selectedAction();

    if (
      !action ||
      !this.organizationId ||
      this.isChangingStatus()
    ) {
      return;
    }

    this.isChangingStatus.set(true);

    this.organizationsApi
      .changeStatus(
        this.organizationId,
        action.code,
        {
          reason,
        },
      )
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: () => {
          this.isChangingStatus.set(false);
          this.selectedAction.set(null);

          this.toastService.success(
            this.translate.instant(
              'organizations.lifecycle.changeSuccess',
            ),
          );

          this.reloadAfterStatusChange();
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.isChangingStatus.set(false);

          const messages =
            this.apiErrorService.getMessages(
              error,
            );

          for (
            const message of messages
          ) {
            this.toastService.error(
              this.translate.instant(
                'errors.title',
              ),
              message,
            );
          }
        },
      });
  }

  goBack(): void {
    void this.router.navigate([
      '/organizations',
    ]);
  }

  private loadPage(): void {
    if (!this.organizationId) {
      return;
    }

    this.isLoading.set(true);

    forkJoin({
      organization:
        this.organizationsApi.getById(
          this.organizationId,
        ),

      history:
        this.organizationsApi
          .getStatusHistory(
            this.organizationId,
          ),
    })
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: result => {
          this.organization.set(
            result.organization,
          );

          this.statusHistory.set(
            result.history,
          );

          this.isLoading.set(false);
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.isLoading.set(false);

          this.showErrors(error);

          void this.router.navigate([
            '/organizations',
          ]);
        },
      });
  }

  private reloadAfterStatusChange(): void {
    if (!this.organizationId) {
      return;
    }

    this.isHistoryLoading.set(true);

    forkJoin({
      organization:
        this.organizationsApi.getById(
          this.organizationId,
        ),

      history:
        this.organizationsApi
          .getStatusHistory(
            this.organizationId,
          ),
    })
      .pipe(
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe({
        next: result => {
          this.organization.set(
            result.organization,
          );

          this.statusHistory.set(
            result.history,
          );

          this.isHistoryLoading.set(
            false,
          );
        },

        error: (
          error: HttpErrorResponse,
        ) => {
          this.isHistoryLoading.set(
            false,
          );

          this.showErrors(error);
        },
      });
  }

  private showErrors(
    error: HttpErrorResponse,
  ): void {
    const messages =
      this.apiErrorService.getMessages(
        error,
      );

    for (const message of messages) {
      this.toastService.error(
        this.translate.instant(
          'errors.title',
        ),
        message,
      );
    }
  }
}
