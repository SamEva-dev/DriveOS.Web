import { HttpErrorResponse } from '@angular/common/http';

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../../core/errors/api-error.service';

import { DriveOsCardComponent, DriveOsToastService } from '../../../../../shared/ui';

import { BranchFormComponent } from '../../components/branch-form/branch-form.component';

import { BranchesApiService } from '../../data-access/branches-api.service';

import { BranchFormValue } from '../../models/branch-form-value';

@Component({
  selector: 'driveos-branch-create-page',

  standalone: true,

  imports: [RouterLink, TranslatePipe, DriveOsCardComponent, BranchFormComponent],

  templateUrl: './branch-create.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchCreatePage {
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly branchesApi = inject(BranchesApiService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly toastService = inject(DriveOsToastService);

  private readonly translate = inject(TranslateService);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  readonly isSubmitting = signal(false);

  submit(value: BranchFormValue): void {
    if (!this.organizationId || value.branchType === null || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.branchesApi
      .create(this.organizationId, {
        name: value.name,
        code: value.code,

        branchType: value.branchType,

        addressLine1: value.addressLine1,

        addressLine2: value.addressLine2 || null,

        postalCode: value.postalCode,

        city: value.city,

        timeZoneId: value.timeZoneId,

        isPrimary: value.isPrimary,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);

          this.toastService.success(
            this.translate.instant('organizations.branches.notifications.created'),
          );

          void this.router.navigate([
            '/organizations',
            this.organizationId,
            'branches',
            response.id,
          ]);
        },

        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);

          this.showErrors(error);
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/organizations', this.organizationId, 'branches']);
  }

  private showErrors(error: HttpErrorResponse): void {
    const messages = this.apiErrorService.getMessages(error);

    for (const message of messages) {
      this.toastService.error(this.translate.instant('errors.title'), message);
    }
  }
}
