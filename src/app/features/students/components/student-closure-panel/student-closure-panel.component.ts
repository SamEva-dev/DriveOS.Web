import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
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
  CreateEnrollmentClosureRequest,
  EnrollmentClosure,
  EnrollmentClosureCheckStatus,
  EnrollmentClosureCheckType,
  StudentOverview,
} from '../../models/student.models';

interface ClosureCheckDefinition {
  readonly type: EnrollmentClosureCheckType;
  readonly value: number;
}

interface RetentionScopeDefinition {
  readonly key: string;
  readonly value: number;
}

@Component({
  selector: 'driveos-student-closure-panel',
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
  templateUrl: './student-closure-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentClosurePanelComponent implements OnInit {
  readonly studentId = input.required<string>();
  readonly items = input.required<readonly EnrollmentClosure[]>();
  readonly changed = output<void>();

  private readonly api = inject(StudentsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly overview = signal<StudentOverview | null>(null);
  readonly loadingOverview = signal(true);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly reviewingKey = signal<string | null>(null);
  readonly completingId = signal<string | null>(null);
  readonly archiveId = signal<string | null>(null);
  readonly reopenId = signal<string | null>(null);

  readonly canCreate = computed(() => this.authorization.hasPermission(STUDENT_PERMISSIONS.close));
  readonly canComplete = computed(() =>
    this.authorization.hasAll([
      STUDENT_PERMISSIONS.close,
      STUDENT_PERMISSIONS.financeCloseStudentAccount,
      STUDENT_PERMISSIONS.contractsTerminate,
    ]),
  );
  readonly canArchive = computed(() => this.authorization.hasPermission(STUDENT_PERMISSIONS.archive));
  readonly canReopen = computed(() => this.authorization.hasPermission(STUDENT_PERMISSIONS.reopen));
  readonly activeEnrollmentId = computed(() => this.overview()?.activeEnrollment?.enrollmentId ?? null);
  readonly hasOpenCase = computed(() =>
    this.items().some((item) => ['Draft', 'ReadyToClose'].includes(item.status)),
  );

  readonly checkDefinitions: readonly ClosureCheckDefinition[] = [
    { type: 'FutureSessions', value: 1 },
    { type: 'FinalInvoices', value: 2 },
    { type: 'Credits', value: 3 },
    { type: 'Exams', value: 4 },
    { type: 'Documents', value: 5 },
    { type: 'Contract', value: 6 },
    { type: 'Equipment', value: 7 },
    { type: 'Disputes', value: 8 },
    { type: 'DataRetention', value: 9 },
  ];

  readonly retentionScopes: readonly RetentionScopeDefinition[] = [
    { key: 'identity', value: 1 },
    { key: 'contracts', value: 2 },
    { key: 'finance', value: 4 },
    { key: 'pedagogy', value: 8 },
    { key: 'exams', value: 16 },
    { key: 'documents', value: 32 },
    { key: 'audit', value: 64 },
    { key: 'disputes', value: 128 },
  ];

  readonly form = this.fb.nonNullable.group({
    reason: [1, Validators.required],
    closureDate: [this.today(), Validators.required],
    reasonDetail: ['', Validators.maxLength(2000)],
    checks: this.fb.array(
      this.checkDefinitions.map((definition) =>
        this.fb.nonNullable.group({
          type: definition.type,
          value: definition.value,
          status: [1 as EnrollmentClosureCheckStatus, Validators.required],
          detail: ['', Validators.maxLength(1000)],
        }),
      ),
    ),
  });

  readonly archiveForm = this.fb.nonNullable.group({
    retainUntil: [this.oneYearFromToday(), Validators.required],
    retentionLegalBasis: ['', [Validators.required, Validators.maxLength(1000)]],
    retentionScope: [0, Validators.required],
  });

  readonly reopenForm = this.fb.nonNullable.group({
    justification: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.api.getOverview(this.studentId()).subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loadingOverview.set(false);
      },
      error: () => this.loadingOverview.set(false),
    });
  }

  get checks(): FormArray {
    return this.form.controls.checks;
  }

  open(): void {
    if (!this.canCreate() || !this.activeEnrollmentId() || this.hasOpenCase()) return;
    this.form.reset({ reason: 1, closureDate: this.today(), reasonDetail: '' });
    this.checks.controls.forEach((control, index) => {
      const definition = this.checkDefinitions[index];
      control.reset({ type: definition.type, value: definition.value, status: 1, detail: '' });
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
    const enrollmentId = this.activeEnrollmentId();
    if (!enrollmentId) return;
    const value = this.form.getRawValue();
    if (Number(value.reason) === 9 && !value.reasonDetail.trim()) {
      this.toast.error(this.translate.instant('students.lifecycle.closure.validation.otherReasonDetail'));
      return;
    }
    if (value.closureDate < this.today()) {
      this.toast.error(this.translate.instant('students.lifecycle.closure.validation.closureDatePast'));
      return;
    }
    const request: CreateEnrollmentClosureRequest = {
      enrollmentId,
      reason: Number(value.reason),
      closureDate: value.closureDate,
      reasonDetail: value.reasonDetail.trim(),
      checks: value.checks.map((check) => ({
        type: Number(check.value),
        status: Number(check.status) as EnrollmentClosureCheckStatus,
        detail: check.detail.trim(),
      })),
    };
    this.saving.set(true);
    this.api.createClosure(this.studentId(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success(this.translate.instant('students.lifecycle.closure.feedback.created'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  review(
    item: EnrollmentClosure,
    check: { type: string; status: string; detail: string },
    status: EnrollmentClosureCheckStatus,
    detail: string,
  ): void {
    if (!this.canCreate() || this.reviewingKey()) return;
    const key = `${item.closureId}:${check.type}`;
    this.reviewingKey.set(key);
    this.api
      .reviewClosureCheck(this.studentId(), item.closureId, check.type as EnrollmentClosureCheckType, {
        status,
        detail: detail.trim(),
      })
      .subscribe({
        next: () => {
          this.reviewingKey.set(null);
          this.toast.success(this.translate.instant('students.lifecycle.closure.feedback.checkUpdated'));
          this.changed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.reviewingKey.set(null);
          for (const message of this.errors.getMessages(error)) this.toast.error(message);
        },
      });
  }

  complete(item: EnrollmentClosure): void {
    if (!this.canComplete() || item.status !== 'ReadyToClose' || this.completingId()) {
      if (!this.canComplete()) {
        this.toast.error(this.translate.instant('students.lifecycle.closure.validation.closePermissions'));
      }
      return;
    }
    this.completingId.set(item.closureId);
    this.api.completeClosure(this.studentId(), item.closureId).subscribe({
      next: () => {
        this.completingId.set(null);
        this.toast.success(this.translate.instant('students.lifecycle.closure.feedback.completed'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.completingId.set(null);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  openArchive(item: EnrollmentClosure): void {
    if (!this.canArchive() || item.status !== 'Closed') return;
    this.archiveForm.reset({
      retainUntil: this.oneYearFromToday(),
      retentionLegalBasis: '',
      retentionScope: 0,
    });
    this.archiveId.set(item.closureId);
  }

  toggleRetentionScope(value: number, checked: boolean): void {
    const current = Number(this.archiveForm.controls.retentionScope.value);
    this.archiveForm.controls.retentionScope.setValue(checked ? current | value : current & ~value);
  }

  isRetentionScopeSelected(value: number): boolean {
    return (Number(this.archiveForm.controls.retentionScope.value) & value) === value;
  }

  archive(): void {
    const closureId = this.archiveId();
    if (!closureId || this.archiveForm.invalid || this.saving()) {
      this.archiveForm.markAllAsTouched();
      return;
    }
    const value = this.archiveForm.getRawValue();
    if (Number(value.retentionScope) === 0) {
      this.toast.error(this.translate.instant('students.lifecycle.closure.validation.retentionScopeRequired'));
      return;
    }
    if (value.retainUntil <= this.today()) {
      this.toast.error(this.translate.instant('students.lifecycle.closure.validation.retainFuture'));
      return;
    }
    this.saving.set(true);
    this.api.archiveStudent(this.studentId(), closureId, {
      retainUntil: value.retainUntil,
      retentionLegalBasis: value.retentionLegalBasis.trim(),
      retentionScope: Number(value.retentionScope),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.archiveId.set(null);
        this.toast.success(this.translate.instant('students.lifecycle.closure.feedback.archived'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  openReopen(item: EnrollmentClosure): void {
    if (!this.canReopen() || !['Closed', 'Archived'].includes(item.status)) return;
    this.reopenForm.reset({ justification: '' });
    this.reopenId.set(item.closureId);
  }

  reopen(): void {
    const closureId = this.reopenId();
    if (!closureId || this.reopenForm.invalid || this.saving()) {
      this.reopenForm.markAllAsTouched();
      if (this.reopenForm.controls.justification.hasError('minlength')) {
        this.toast.error(this.translate.instant('students.lifecycle.closure.validation.reopenJustification'));
      }
      return;
    }
    this.saving.set(true);
    this.api.reopenEnrollment(this.studentId(), closureId, {
      justification: this.reopenForm.controls.justification.value.trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.reopenId.set(null);
        this.toast.success(this.translate.instant('students.lifecycle.closure.feedback.reopened'));
        this.changed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  checkStatusValue(status: string): EnrollmentClosureCheckStatus {
    if (status === 'Resolved') return 2;
    if (status === 'NotApplicable') return 3;
    if (status === 'Blocking') return 4;
    return 1;
  }

  closureCheckStatus(value: string): EnrollmentClosureCheckStatus {
    const parsed = Number(value);
    return parsed === 2 || parsed === 3 || parsed === 4 ? parsed : 1;
  }

  canCompleteItem(item: EnrollmentClosure): boolean {
    return item.status === 'ReadyToClose' && item.closureDate <= this.today();
  }

  variant(status: string): DriveOsBadgeVariant {
    if (['ReadyToClose', 'Closed', 'Archived', 'Resolved', 'NotApplicable'].includes(status)) return 'success';
    if (['Blocking', 'Cancelled'].includes(status)) return 'danger';
    if (['Draft', 'Pending'].includes(status)) return 'warning';
    if (status === 'Reopened') return 'info';
    return 'neutral';
  }

  private today(): string {
    const value = new Date();
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private oneYearFromToday(): string {
    const value = new Date();
    value.setFullYear(value.getFullYear() + 1);
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
