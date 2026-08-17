import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsBadgeComponent, DriveOsBadgeVariant } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import {
  CreateEnrollmentReactivationRequest,
  EnrollmentReactivation,
  EnrollmentSuspension,
  ReactivationCheckStatus,
  ReactivationCheckType,
} from '../../models/student.models';

interface CheckDefinition {
  readonly type: ReactivationCheckType;
  readonly value: number;
}

@Component({
  selector: 'driveos-student-reactivation-panel',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-reactivation-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentReactivationPanelComponent {
  readonly studentId = input.required<string>();
  readonly suspensions = input.required<readonly EnrollmentSuspension[]>();
  readonly items = input.required<readonly EnrollmentReactivation[]>();
  readonly changed = output<void>();

  private readonly api = inject(StudentsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly reviewingKey = signal<string | null>(null);
  readonly applyingId = signal<string | null>(null);

  readonly canReactivate = computed(() =>
    this.authorization.hasAll([STUDENT_PERMISSIONS.reactivate, STUDENT_PERMISSIONS.complianceRead]),
  );
  readonly canApply = computed(() =>
    this.authorization.hasAll([STUDENT_PERMISSIONS.reactivate, STUDENT_PERMISSIONS.enrollmentReactivate]),
  );
  readonly canRequestPedagogyReview = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.pedagogyReviewRequest),
  );
  readonly activeSuspensions = computed(() =>
    this.suspensions().filter((item) => item.status === 'Active'),
  );
  readonly hasOpenReactivation = computed(() =>
    this.items().some((item) => !['Applied', 'Cancelled', 'NewEnrollmentRequired'].includes(item.status)),
  );

  readonly checkDefinitions: readonly CheckDefinition[] = [
    { type: 'SuspensionReasonResolved', value: 1 },
    { type: 'Contract', value: 2 },
    { type: 'Documents', value: 3 },
    { type: 'Funding', value: 4 },
    { type: 'Credits', value: 5 },
    { type: 'Pedagogy', value: 6 },
    { type: 'Instructor', value: 7 },
    { type: 'Resources', value: 8 },
    { type: 'Assessment', value: 9 },
    { type: 'Planning', value: 10 },
    { type: 'RegulatoryRules', value: 11 },
  ];

  readonly form = this.fb.nonNullable.group({
    suspensionId: ['', Validators.required],
    mode: [2, Validators.required],
    resumeDate: [this.today(), Validators.required],
    conditions: ['', Validators.maxLength(2000)],
    pedagogyReviewRequested: false,
    checks: this.fb.array(
      this.checkDefinitions.map((definition) =>
        this.fb.nonNullable.group({
          type: definition.type,
          value: definition.value,
          status: [2 as ReactivationCheckStatus, Validators.required],
          detail: ['', Validators.maxLength(1000)],
        }),
      ),
    ),
  });

  get checks(): FormArray {
    return this.form.controls.checks;
  }

  open(): void {
    if (!this.canReactivate() || !this.activeSuspensions().length || this.hasOpenReactivation()) return;
    this.form.reset({
      suspensionId: this.activeSuspensions()[0]?.suspensionId ?? '',
      mode: 2,
      resumeDate: this.today(),
      conditions: '',
      pedagogyReviewRequested: false,
    });
    this.checks.controls.forEach((control, index) => {
      const definition = this.checkDefinitions[index];
      control.reset({ type: definition.type, value: definition.value, status: 2, detail: '' });
    });
    this.editing.set(true);
  }

  cancel(): void {
    if (!this.saving()) this.editing.set(false);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const mode = Number(value.mode) as 1 | 2 | 3 | 4;
    if (mode === 3 && !value.conditions.trim()) {
      this.toast.error(this.translate.instant('students.lifecycle.reactivation.validation.conditionsRequired'));
      return;
    }
    if (value.pedagogyReviewRequested && !this.canRequestPedagogyReview()) {
      this.toast.error(this.translate.instant('students.lifecycle.reactivation.validation.pedagogyPermission'));
      return;
    }
    if (mode === 1 && value.resumeDate !== this.today()) {
      this.toast.error(this.translate.instant('students.lifecycle.reactivation.validation.immediateToday'));
      return;
    }
    if ((mode === 1 || mode === 2) && value.checks.some((check) => Number(check.status) === 3)) {
      this.toast.error(this.translate.instant('students.lifecycle.reactivation.validation.failedChecks'));
      return;
    }

    const request: CreateEnrollmentReactivationRequest = {
      suspensionId: value.suspensionId,
      mode,
      resumeDate: value.resumeDate,
      conditions: value.conditions.trim(),
      pedagogyReviewRequested: value.pedagogyReviewRequested,
      checks: value.checks.map((check) => ({
        type: Number(check.value),
        status: Number(check.status) as ReactivationCheckStatus,
        detail: check.detail.trim(),
      })),
    };

    this.saving.set(true);
    this.api.createReactivation(this.studentId(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success(this.translate.instant('students.lifecycle.reactivation.feedback.created'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  review(
    item: EnrollmentReactivation,
    check: { type: string; status: string; detail: string },
    status: ReactivationCheckStatus,
    detail: string,
  ): void {
    if (!this.canReactivate()) return;
    const key = `${item.reactivationId}:${check.type}`;
    if (this.reviewingKey()) return;
    this.reviewingKey.set(key);
    this.api.reviewReactivationCheck(
      this.studentId(),
      item.reactivationId,
      check.type as ReactivationCheckType,
      { status, detail: detail.trim() },
    ).subscribe({
      next: () => {
        this.reviewingKey.set(null);
        this.toast.success(this.translate.instant('students.lifecycle.reactivation.feedback.checkUpdated'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.reviewingKey.set(null);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  apply(item: EnrollmentReactivation): void {
    if (!this.canApply() || this.applyingId() || !this.canApplyItem(item)) return;
    this.applyingId.set(item.reactivationId);
    this.api.applyReactivation(this.studentId(), item.reactivationId).subscribe({
      next: () => {
        this.applyingId.set(null);
        this.toast.success(this.translate.instant('students.lifecycle.reactivation.feedback.applied'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.applyingId.set(null);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  canApplyItem(item: EnrollmentReactivation): boolean {
    if (['Applied', 'NewEnrollmentRequired', 'Cancelled'].includes(item.status)) return false;
    if (new Date(`${item.resumeDate}T00:00:00`).getTime() > new Date(`${this.today()}T00:00:00`).getTime()) return false;
    return !item.checks.some((check) => check.status === 'Failed');
  }

  statusValue(status: string): ReactivationCheckStatus {
    if (status === 'Valid') return 1;
    if (status === 'Warning') return 2;
    if (status === 'Failed') return 3;
    return 4;
  }

  variant(status: string): DriveOsBadgeVariant {
    if (['Applied', 'Valid', 'Satisfied', 'Approved'].includes(status)) return 'success';
    if (['Failed', 'Rejected', 'Cancelled'].includes(status)) return 'danger';
    if (['Scheduled', 'PendingConditions', 'Warning'].includes(status)) return 'warning';
    return 'neutral';
  }

  private today(): string {
    const value = new Date();
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
