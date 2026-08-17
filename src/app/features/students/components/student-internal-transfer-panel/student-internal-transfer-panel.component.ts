import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsBadgeComponent, DriveOsBadgeVariant } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { InternalTransfer, StudentBranchOption } from '../../models/student.models';

interface TransferElementOption {
  value: number;
  labelKey: string;
}

@Component({
  selector: 'driveos-student-internal-transfer-panel',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-internal-transfer-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentInternalTransferPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly auth = inject(AuthService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly transfers = input.required<readonly InternalTransfer[]>();
  readonly refreshed = output<void>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly optionsLoading = signal(false);
  readonly branchOptions = signal<readonly StudentBranchOption[]>([]);
  readonly analyzedTransfer = signal<InternalTransfer | null>(null);
  readonly selectedElements = signal(2047);

  readonly canAnalyze = computed(() => {
    this.authorization.permissions();
    return (
      this.authorization.hasPermission(STUDENT_PERMISSIONS.transferInternal) &&
      this.authorization.hasPermission(STUDENT_PERMISSIONS.branchesRead)
    );
  });

  readonly canValidate = computed(() => {
    this.authorization.permissions();
    return (
      this.canAnalyze() &&
      this.authorization.hasPermission(STUDENT_PERMISSIONS.planningReassign) &&
      this.authorization.hasPermission(STUDENT_PERMISSIONS.financeTransferReview)
    );
  });

  readonly form = this.fb.nonNullable.group({
    targetBranchId: ['', Validators.required],
    mode: [1, Validators.required],
    effectiveOn: [''],
    temporaryUntil: [''],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  constructor() {
    this.ensureBranchOptions();
  }

  readonly elementOptions: readonly TransferElementOption[] = [
    { value: 1, labelKey: 'students.mobility.internal.elements.enrollment' },
    { value: 2, labelKey: 'students.mobility.internal.elements.futureSessions' },
    { value: 4, labelKey: 'students.mobility.internal.elements.instructor' },
    { value: 8, labelKey: 'students.mobility.internal.elements.vehicles' },
    { value: 16, labelKey: 'students.mobility.internal.elements.pricing' },
    { value: 32, labelKey: 'students.mobility.internal.elements.credits' },
    { value: 64, labelKey: 'students.mobility.internal.elements.documents' },
    { value: 128, labelKey: 'students.mobility.internal.elements.exams' },
    { value: 256, labelKey: 'students.mobility.internal.elements.payments' },
    { value: 512, labelKey: 'students.mobility.internal.elements.communications' },
    { value: 1024, labelKey: 'students.mobility.internal.elements.meetingPoint' },
  ];

  open(): void {
    this.ensureBranchOptions();
    this.analyzedTransfer.set(null);
    this.selectedElements.set(2047);
    this.form.reset({
      targetBranchId: '',
      mode: 1,
      effectiveOn: '',
      temporaryUntil: '',
      reason: '',
    });
    this.editorOpen.set(true);
  }

  cancel(): void {
    this.editorOpen.set(false);
    this.analyzedTransfer.set(null);
  }

  toggleElement(value: number): void {
    const current = this.selectedElements();
    this.selectedElements.set((current & value) === value ? current & ~value : current | value);
  }

  elementSelected(value: number): boolean {
    return (this.selectedElements() & value) === value;
  }

  analyze(): void {
    if (this.form.invalid || this.saving() || this.selectedElements() === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const mode = Number(value.mode);
    if (mode !== 1 && !value.effectiveOn) {
      this.form.controls.effectiveOn.setErrors({ required: true });
      return;
    }
    if (mode === 4 && !value.temporaryUntil) {
      this.form.controls.temporaryUntil.setErrors({ required: true });
      return;
    }

    this.saving.set(true);
    this.api
      .analyzeInternalTransfer(this.studentId(), {
        targetBranchId: value.targetBranchId,
        mode,
        elements: this.selectedElements(),
        effectiveOn: mode === 1 ? null : value.effectiveOn || null,
        temporaryUntil: mode === 4 ? value.temporaryUntil || null : null,
        reason: value.reason.trim(),
      })
      .subscribe({
        next: (transfer) => {
          this.analyzedTransfer.set(transfer);
          this.saving.set(false);
          this.toast.success(this.translate.instant('students.mobility.internal.feedback.analyzed'));
          this.refreshed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.showError(error);
        },
      });
  }

  validate(transfer: InternalTransfer): void {
    if (this.saving() || transfer.status !== 'Analyzed') return;
    this.saving.set(true);
    this.api.validateInternalTransfer(this.studentId(), transfer.transferId).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.toast.success(this.translate.instant('students.mobility.internal.feedback.validated'));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(error);
      },
    });
  }

  canValidateTransfer(transfer: InternalTransfer): boolean {
    return transfer.status === 'Analyzed' && this.canValidate();
  }

  branchLabel(branchId: string): string {
    const branch = this.branchOptions().find((item) => item.id === branchId);
    if (!branch) return branchId;
    return branch.code ? `${branch.name} (${branch.code})` : branch.name;
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    if (['Applied', 'Validated', 'Active'].includes(status)) return 'success';
    if (['Cancelled', 'Expired', 'Reverted', 'Blocked'].includes(status)) return 'danger';
    if (['Analyzed', 'Scheduled', 'Warning', 'NotEvaluated'].includes(status)) return 'warning';
    return 'neutral';
  }

  impactIcon(status: string): string {
    if (status === 'Blocked') return 'ph-x-circle';
    if (status === 'Warning' || status === 'NotEvaluated') return 'ph-warning';
    return 'ph-check-circle';
  }

  private ensureBranchOptions(): void {
    if (this.branchOptions().length || this.optionsLoading()) return;
    const organizationId = this.auth.user()?.organizationId;
    if (!organizationId) return;
    this.optionsLoading.set(true);
    this.api.getBranchOptions(organizationId).subscribe({
      next: (page) => {
        this.branchOptions.set(page.items.filter((item) => item.status === 'Active'));
        this.optionsLoading.set(false);
      },
      error: () => this.optionsLoading.set(false),
    });
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }
}
