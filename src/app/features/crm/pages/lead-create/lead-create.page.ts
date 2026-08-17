import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsToastService,
} from '../../../../shared/ui';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { LeadSourceType, TransmissionPreference } from '../../models/lead.model';

@Component({
  selector: 'driveos-lead-create-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
  ],
  templateUrl: './lead-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadCreatePage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly leadsApi = inject(LeadsApiService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly isSubmitting = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(30)],
    licenseCategory: ['B', [Validators.required, Validators.maxLength(20)]],
    transmission: ['Unspecified' as TransmissionPreference, Validators.required],
    preferredLocation: ['', Validators.maxLength(200)],
    sourceType: ['Website' as LeadSourceType, Validators.required],
    sourceDetail: ['', Validators.maxLength(500)],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    this.isSubmitting.set(true);
    this.leadsApi
      .create({
        branchId: null,
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: optional(value.email),
        phone: optional(value.phone),
        licenseCategory: value.licenseCategory.trim().toUpperCase(),
        transmission: value.transmission,
        preferredLocation: optional(value.preferredLocation),
        sourceType: value.sourceType,
        sourceDetail: optional(value.sourceDetail),
        assignedAdvisorId: null,
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.toast.success(this.translate.instant('crm.leads.create.success'));
          void this.router.navigate(['/crm/leads'], { state: { createdLeadId: response.leadId } });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          for (const message of this.apiErrorService.getMessages(error))
            this.toast.error(this.translate.instant('errors.title'), message);
        },
      });
  }

  cancel(): void {
    void this.router.navigate(['/crm/leads']);
  }
}
