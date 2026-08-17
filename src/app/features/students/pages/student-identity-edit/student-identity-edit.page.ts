import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';

@Component({
  selector: 'driveos-student-identity-edit-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-identity-edit.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentIdentityEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly potentialDuplicate = signal(false);
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly form = this.fb.nonNullable.group({
    legalFirstName: ['', [Validators.required, Validators.maxLength(100)]],
    legalLastName: ['', [Validators.required, Validators.maxLength(100)]],
    preferredName: ['', Validators.maxLength(100)],
    birthDate: [''],
    birthPlace: ['', Validators.maxLength(150)],
    nationality: ['', Validators.maxLength(100)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(40)],
    addressLine1: ['', Validators.maxLength(200)],
    addressLine2: ['', Validators.maxLength(200)],
    postalCode: ['', Validators.maxLength(20)],
    city: ['', Validators.maxLength(100)],
    countryCode: ['', Validators.maxLength(3)],
    preferredLanguage: ['', Validators.maxLength(10)],
    timeZone: ['', Validators.maxLength(100)],
    allowEmail: [false],
    allowSms: [false],
    allowPhone: [false],
    justification: ['', Validators.maxLength(500)],
  });
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api.getIdentity(this.studentId).subscribe({
      next: (value) => {
        this.form.patchValue({
          ...value,
          preferredName: value.preferredName ?? '',
          birthDate: value.birthDate ?? '',
          birthPlace: value.birthPlace ?? '',
          nationality: value.nationality ?? '',
          email: value.email ?? '',
          phone: value.phone ?? '',
          addressLine1: value.addressLine1 ?? '',
          addressLine2: value.addressLine2 ?? '',
          postalCode: value.postalCode ?? '',
          city: value.city ?? '',
          countryCode: value.countryCode ?? '',
          preferredLanguage: value.preferredLanguage ?? '',
          timeZone: value.timeZone ?? '',
          justification: '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const optional = (text: string): string | null => text.trim() || null;
    this.saving.set(true);
    this.potentialDuplicate.set(false);
    this.api
      .updateIdentity(this.studentId, {
        legalFirstName: value.legalFirstName.trim(),
        legalLastName: value.legalLastName.trim(),
        preferredName: optional(value.preferredName),
        birthDate: optional(value.birthDate),
        birthPlace: optional(value.birthPlace),
        nationality: optional(value.nationality),
        email: optional(value.email),
        phone: optional(value.phone),
        addressLine1: optional(value.addressLine1),
        addressLine2: optional(value.addressLine2),
        postalCode: optional(value.postalCode),
        city: optional(value.city),
        countryCode: optional(value.countryCode)?.toUpperCase() ?? null,
        preferredLanguage: optional(value.preferredLanguage)?.toLowerCase() ?? null,
        timeZone: optional(value.timeZone),
        allowEmail: value.allowEmail,
        allowSms: value.allowSms,
        allowPhone: value.allowPhone,
        justification: optional(value.justification),
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.potentialDuplicateDetected) {
            this.potentialDuplicate.set(true);
            return;
          }
          this.toast.success(this.translate.instant('students.identityEdit.success'));
          void this.router.navigate(['/students', this.studentId, 'profile']);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          for (const message of this.errors.getMessages(error))
            this.toast.error(this.translate.instant('errors.title'), message);
        },
      });
  }
  cancel(): void {
    void this.router.navigate(['/students', this.studentId, 'profile']);
  }
}
