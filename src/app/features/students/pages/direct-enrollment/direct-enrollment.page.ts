import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { EnrollmentSource, StudentBranchOption } from '../../models/student.models';

@Component({
  selector: 'driveos-direct-enrollment-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './direct-enrollment.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectEnrollmentPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  readonly submitting = signal(false);
  readonly branchesLoading = signal(true);
  readonly branchesError = signal(false);
  readonly branches = signal<readonly StudentBranchOption[]>([]);
  private readonly idempotencyKey = crypto.randomUUID();
  readonly sources: readonly EnrollmentSource[] = [
    'DirectBranch',
    'ReturningStudent',
    'IncomingTransfer',
    'Partner',
    'LegacyImport',
  ];
  readonly form = this.fb.nonNullable.group(
    {
      branchId: ['', Validators.required],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.email, Validators.maxLength(254)]],
      phone: ['', Validators.maxLength(40)],
      trainingCode: ['B', [Validators.required, Validators.maxLength(100)]],
      source: ['DirectBranch' as EnrollmentSource, Validators.required],
      regulatoryCountryCode: [
        'FR',
        [Validators.required, Validators.minLength(2), Validators.maxLength(3)],
      ],
      preferredLanguageCode: [
        'fr',
        [Validators.required, Validators.minLength(2), Validators.maxLength(10)],
      ],
      requiredConsentsAccepted: [false, Validators.requiredTrue],
    },
    { validators: [DirectEnrollmentPage.contactRequired] },
  );
  constructor() {
    this.loadBranches();
  }
  loadBranches(): void {
    const organizationId = this.auth.user()?.organizationId;
    if (!organizationId) {
      this.branchesLoading.set(false);
      this.branchesError.set(true);
      return;
    }
    this.branchesLoading.set(true);
    this.branchesError.set(false);
    this.api.getBranchOptions(organizationId).subscribe({
      next: (page) => {
        const active = page.items.filter((item) => item.status === 'Active');
        this.branches.set(active);
        const primary = active.find((item) => item.isPrimary) ?? active[0];
        if (primary) this.form.controls.branchId.setValue(primary.id);
        this.branchesLoading.set(false);
      },
      error: () => {
        this.branchesError.set(true);
        this.branchesLoading.set(false);
      },
    });
  }
  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    this.submitting.set(true);
    this.api
      .startDirectEnrollment(
        {
          existingStudentId: null,
          branchId: value.branchId,
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: optional(value.email),
          phone: optional(value.phone),
          trainingCode: value.trainingCode.trim().toUpperCase(),
          source: value.source,
          regulatoryCountryCode: value.regulatoryCountryCode.trim().toUpperCase(),
          preferredLanguageCode: value.preferredLanguageCode.trim().toLowerCase(),
          requiredConsentsAccepted: value.requiredConsentsAccepted,
        },
        this.idempotencyKey,
      )
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.toast.success(this.translate.instant('students.directEnrollment.success'));
          void this.router.navigate(['/students', response.studentId, 'enrollment']);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          for (const message of this.errors.getMessages(error))
            this.toast.error(this.translate.instant('errors.title'), message);
        },
      });
  }
  cancel(): void {
    void this.router.navigate(['/students/dashboard']);
  }
  private static contactRequired(control: AbstractControl): ValidationErrors | null {
    const email = `${control.get('email')?.value ?? ''}`.trim();
    const phone = `${control.get('phone')?.value ?? ''}`.trim();
    return email || phone ? null : { contactRequired: true };
  }
}
