import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { HttpErrorResponse } from '@angular/common/http';

import { Router } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { OrganizationsApiService } from '../../data-access/organizations-api.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { ORGANIZATION_TYPE_OPTIONS, OrganizationType } from '../../models/organization-type';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsToastService,
} from '../../../../shared/ui';

@Component({
  selector: 'driveos-organization-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
  ],
  templateUrl: './organization-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationCreatePage {
  private readonly formBuilder = inject(FormBuilder);

  private readonly organizationsApi = inject(OrganizationsApiService);

  private readonly apiErrorService = inject(ApiErrorService);

  private readonly translate = inject(TranslateService);

  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);

  readonly organizationTypes = ORGANIZATION_TYPE_OPTIONS;

  private readonly toastService = inject(DriveOsToastService);

  readonly translatedTypeOptions = computed(() =>
    this.organizationTypes.map((option) => ({
      value: option.value,
      label: this.translate.instant(option.labelKey),
    })),
  );

  readonly form = this.formBuilder.nonNullable.group({
    legalName: ['', [Validators.required, Validators.maxLength(200)]],

    countryCode: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],

    organizationType: [null as OrganizationType | null, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.organizationsApi
      .create({
        legalName: rawValue.legalName.trim(),

        countryCode: rawValue.countryCode.trim().toUpperCase(),

        organizationType: rawValue.organizationType!,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);

          this.toastService.success(this.translate.instant('organizations.createdSuccessfully'));

          void this.router.navigate(['/organizations', response.organizationId]);
        },

        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);

          console.error('Error creating organization:', error);
          const messages = this.apiErrorService.getMessages(error);

          for (const message of messages) {
            this.toastService.error(this.translate.instant('errors.title'), message);
          }
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/organizations']);
  }
}
