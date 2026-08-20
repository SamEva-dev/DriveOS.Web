import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
} from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { EnrollmentSuspension, SuspendEnrollmentRequest } from '../../models/student.models';

interface ScopeOption {
  readonly control: 'scheduling' | 'training' | 'exam' | 'portal' | 'finance';
  readonly value: number;
  readonly code: string;
  readonly permission?: string;
}

@Component({
  selector: 'driveos-student-suspension-panel',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-suspension-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSuspensionPanelComponent {
  readonly studentId = input.required<string>();
  readonly items = input.required<readonly EnrollmentSuspension[]>();
  readonly created = output<void>();

  private readonly api = inject(StudentsApiService);
  private readonly fb = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly editing = signal(false);
  readonly saving = signal(false);

  readonly canSuspend = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.suspend),
  );
  readonly canSuspendFinancial = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.suspendFinancial),
  );
  readonly canSuspendPedagogical = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.suspendPedagogical),
  );
  readonly hasActiveSuspension = computed(() =>
    this.items().some((item) => item.status === 'Active' || item.status === 'Scheduled'),
  );

  readonly scopeOptions: readonly ScopeOption[] = [
    { control: 'scheduling', value: 2, code: 'scheduling' },
    {
      control: 'training',
      value: 4,
      code: 'training',
      permission: STUDENT_PERMISSIONS.suspendPedagogical,
    },
    { control: 'exam', value: 8, code: 'exam', permission: STUDENT_PERMISSIONS.suspendPedagogical },
    { control: 'portal', value: 16, code: 'portal' },
    {
      control: 'finance',
      value: 32,
      code: 'finance',
      permission: STUDENT_PERMISSIONS.suspendFinancial,
    },
  ];

  readonly form = this.fb.nonNullable.group({
    reason: [1, Validators.required],
    fullEnrollment: false,
    scopes: this.fb.nonNullable.group({
      scheduling: true,
      training: false,
      exam: false,
      portal: false,
      finance: false,
    }),
    startDate: [this.today(), Validators.required],
    expectedEndDate: [this.datePlusDays(14), Validators.required],
    reviewDate: [this.datePlusDays(7), Validators.required],
    bookingsDecision: [1, Validators.required],
    futureBookingsCount: [0, [Validators.required, Validators.min(0)]],
    immediateActions: ['', [Validators.required, Validators.maxLength(2000)]],
    creditDecision: ['', [Validators.required, Validators.maxLength(1000)]],
    notificationPlan: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  open(): void {
    if (!this.canSuspend() || this.hasActiveSuspension()) return;
    this.form.reset({
      reason: 1,
      fullEnrollment: false,
      scopes: { scheduling: true, training: false, exam: false, portal: false, finance: false },
      startDate: this.today(),
      expectedEndDate: this.datePlusDays(14),
      reviewDate: this.datePlusDays(7),
      bookingsDecision: 1,
      futureBookingsCount: 0,
      immediateActions: '',
      creditDecision: '',
      notificationPlan: '',
    });
    this.editing.set(true);
  }

  cancel(): void {
    if (!this.saving()) this.editing.set(false);
  }

  scopeAllowed(option: ScopeOption): boolean {
    return !option.permission || this.authorization.hasPermission(option.permission);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const scope = value.fullEnrollment ? 63 : this.calculateScope(value.scopes);

    if (scope === 0) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.scopeRequired'),
      );
      return;
    }
    if (value.fullEnrollment && (!this.canSuspendFinancial() || !this.canSuspendPedagogical())) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.fullPermission'),
      );
      return;
    }
    if ((scope & 32) !== 0 && !this.canSuspendFinancial()) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.financialPermission'),
      );
      return;
    }
    if ((scope & (4 | 8)) !== 0 && !this.canSuspendPedagogical()) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.pedagogicalPermission'),
      );
      return;
    }
    if (value.expectedEndDate <= value.startDate) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.endAfterStart'),
      );
      return;
    }
    if (value.reviewDate < value.startDate || value.reviewDate > value.expectedEndDate) {
      this.toast.error(
        this.translate.instant('students.lifecycle.suspension.validation.reviewRange'),
      );
      return;
    }

    const request: SuspendEnrollmentRequest = {
      reason: Number(value.reason),
      scope,
      startDate: value.startDate,
      expectedEndDate: value.expectedEndDate,
      immediateActions: value.immediateActions.trim(),
      bookingsDecision: Number(value.bookingsDecision),
      futureBookingsCount: Number(value.futureBookingsCount),
      creditDecision: value.creditDecision.trim(),
      notificationPlan: value.notificationPlan.trim(),
      reviewDate: value.reviewDate,
    };

    this.saving.set(true);
    this.api.suspendEnrollment(this.studentId(), request).subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.toast.success(
          this.translate.instant('students.lifecycle.suspension.feedback.created'),
        );
        this.created.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  variant(status: string): DriveOsBadgeVariant {
    if (status === 'Ended') return 'success';
    if (status === 'Cancelled') return 'danger';
    if (status === 'Active' || status === 'Scheduled') return 'warning';
    return 'neutral';
  }

  scopeLabels(scope: number | string): string {
    const numeric = typeof scope === 'number' ? scope : Number(scope);
    if (!Number.isFinite(numeric)) return String(scope);
    if (numeric === 63 || (numeric & 1) !== 0) {
      return this.translate.instant('students.lifecycle.suspension.scopes.full');
    }
    return this.scopeOptions
      .filter((option) => (numeric & option.value) !== 0)
      .map((option) =>
        this.translate.instant(`students.lifecycle.suspension.scopes.${option.code}`),
      )
      .join(', ');
  }

  private calculateScope(scopes: {
    scheduling: boolean;
    training: boolean;
    exam: boolean;
    portal: boolean;
    finance: boolean;
  }): number {
    return this.scopeOptions.reduce(
      (result, option) => (scopes[option.control] ? result | option.value : result),
      0,
    );
  }

  private today(): string {
    const now = new Date();
    return this.localDate(now);
  }

  private datePlusDays(days: number): string {
    const value = new Date();
    value.setDate(value.getDate() + days);
    return this.localDate(value);
  }

  private localDate(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
