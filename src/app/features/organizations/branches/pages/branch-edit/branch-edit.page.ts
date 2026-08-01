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

import { finalize } from 'rxjs';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../../core/errors/api-error.service';

import {
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';

import { BranchFormComponent } from '../../components/branch-form/branch-form.component';

import { BranchesApiService } from '../../data-access/branches-api.service';

import { BranchFormValue } from '../../models/branch-form-value';

import { Branch } from '../../models/branch.model';

import { branchTypeFromName } from '../../models/branch-type';

@Component({
  selector: 'driveos-branch-edit-page',

  standalone: true,

  imports: [
    RouterLink,
    TranslatePipe,

    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,

    BranchFormComponent,
  ],

  templateUrl: './branch-edit.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchEditPage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly branchesApi = inject(BranchesApiService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly toastService = inject(DriveOsToastService);

  private readonly translate = inject(TranslateService);

  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  readonly branch = signal<Branch | null>(null);

  readonly isLoading = signal(true);

  readonly isSubmitting = signal(false);

  readonly loadError = signal(false);

  readonly formValue = computed<BranchFormValue | null>(() => {
    const branch = this.branch();

    if (!branch) {
      return null;
    }

    return {
      name: branch.name,

      code: branch.code,

      branchType: branchTypeFromName(branch.branchType),

      addressLine1: branch.addressLine1,

      addressLine2: branch.addressLine2 ?? '',

      postalCode: branch.postalCode,

      city: branch.city,

      timeZoneId: branch.timeZoneId,

      isPrimary: branch.isPrimary,
    };
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.organizationId || !this.branchId) {
      this.loadError.set(true);
      this.isLoading.set(false);
      return;
    }

    this.loadError.set(false);
    this.isLoading.set(true);

    this.branchesApi
      .getById(this.organizationId, this.branchId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (branch) => this.branch.set(branch),

        error: (error: HttpErrorResponse) => {
          this.loadError.set(true);
          this.showErrors(error);
        },
      });
  }

  submit(value: BranchFormValue): void {
    if (value.branchType === null || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.branchesApi
      .update(this.organizationId, this.branchId, {
        name: value.name,

        branchType: value.branchType,

        addressLine1: value.addressLine1,

        addressLine2: value.addressLine2 || null,

        postalCode: value.postalCode,

        city: value.city,

        timeZoneId: value.timeZoneId,
      })
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toastService.success(
            this.translate.instant('organizations.branches.notifications.updated'),
          );

          void this.router.navigate([
            '/organizations',
            this.organizationId,
            'branches',
            this.branchId,
          ]);
        },

        error: (error: HttpErrorResponse) => {
          this.showErrors(error);
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/organizations', this.organizationId, 'branches', this.branchId]);
  }

  private showErrors(error: HttpErrorResponse): void {
    const messages = this.apiErrorService.getMessages(error);

    for (const message of messages) {
      this.toastService.error(this.translate.instant('errors.title'), message);
    }
  }
}
