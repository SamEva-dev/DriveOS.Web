import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  PrimaryBranchChangeAnalysis,
  StudentBranchAssignment,
  StudentBranchOption,
  StudentBranches,
} from '../../models/student.models';

type BranchAction =
  | { type: 'assign' }
  | { type: 'changePrimary' }
  | { type: 'end'; assignment: StudentBranchAssignment }
  | null;

@Component({
  selector: 'driveos-student-branches-panel',
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
  templateUrl: './student-branches-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentBranchesPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly auth = inject(AuthService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly branches = input.required<StudentBranches>();
  readonly refreshed = output<void>();

  readonly action = signal<BranchAction>(null);
  readonly saving = signal(false);
  readonly branchOptions = signal<readonly StudentBranchOption[]>([]);
  readonly optionsLoading = signal(false);
  readonly analysis = signal<PrimaryBranchChangeAnalysis | null>(null);

  readonly canAssign = computed(() => this.hasPermission(STUDENT_PERMISSIONS.branchesAssign));
  readonly canChangePrimary = computed(() => this.hasPermission(STUDENT_PERMISSIONS.branchesChangePrimary));
  readonly activeAssignments = computed(() =>
    this.branches().assignments.filter((item) => item.status === 'Active' || item.status === 'Planned'),
  );
  readonly pastAssignments = computed(() =>
    this.branches().assignments.filter((item) => item.status !== 'Active' && item.status !== 'Planned'),
  );

  readonly assignForm = this.fb.nonNullable.group({
    branchId: ['', Validators.required],
    type: [2, Validators.required],
    servicesAllowed: [31, Validators.required],
    effectiveFrom: [this.today(), Validators.required],
    effectiveTo: [''],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  readonly primaryForm = this.fb.nonNullable.group({
    targetBranchId: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  readonly endForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  openAssign(): void {
    this.ensureBranchOptions();
    this.assignForm.reset({
      branchId: '',
      type: 2,
      servicesAllowed: 31,
      effectiveFrom: this.today(),
      effectiveTo: '',
      reason: '',
    });
    this.action.set({ type: 'assign' });
  }

  openChangePrimary(): void {
    this.ensureBranchOptions();
    this.analysis.set(null);
    this.primaryForm.reset({ targetBranchId: '', reason: '' });
    this.action.set({ type: 'changePrimary' });
  }

  openEnd(assignment: StudentBranchAssignment): void {
    this.endForm.reset({ reason: '' });
    this.action.set({ type: 'end', assignment });
  }

  cancel(): void {
    this.action.set(null);
    this.analysis.set(null);
  }

  assign(): void {
    if (this.assignForm.invalid || this.saving()) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const value = this.assignForm.getRawValue();
    this.run(
      this.api.assignStudentBranch(this.studentId(), {
        branchId: value.branchId,
        type: Number(value.type),
        servicesAllowed: Number(value.servicesAllowed),
        effectiveFrom: value.effectiveFrom,
        effectiveTo: value.effectiveTo || null,
        reason: value.reason.trim(),
      }),
      'students.assignments.branches.feedback.assigned',
    );
  }

  analyzePrimaryChange(): void {
    if (this.primaryForm.controls.targetBranchId.invalid || this.saving()) {
      this.primaryForm.controls.targetBranchId.markAsTouched();
      return;
    }
    this.saving.set(true);
    this.api
      .analyzePrimaryBranchChange(this.studentId(), this.primaryForm.getRawValue().targetBranchId)
      .subscribe({
        next: (analysis) => {
          this.analysis.set(analysis);
          this.saving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.showError(error);
        },
      });
  }

  confirmPrimaryChange(): void {
    const analysis = this.analysis();
    if (!analysis || this.primaryForm.invalid || this.saving()) {
      this.primaryForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.changePrimaryBranch(this.studentId(), {
        analysisId: analysis.analysisId,
        reason: this.primaryForm.getRawValue().reason.trim(),
      }),
      'students.assignments.branches.feedback.primaryChanged',
    );
  }

  endAssignment(): void {
    const current = this.action();
    if (current?.type !== 'end' || this.endForm.invalid || this.saving()) {
      this.endForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.endStudentBranchAssignment(
        this.studentId(),
        current.assignment.id,
        this.endForm.getRawValue().reason.trim(),
      ),
      'students.assignments.branches.feedback.ended',
    );
  }

  branchLabel(branchId: string): string {
    const branch = this.branchOptions().find((item) => item.id === branchId);
    if (!branch) return branchId;
    return branch.code ? `${branch.name} (${branch.code})` : branch.name;
  }

  isPrimary(branchId: string): boolean {
    return this.branches().primaryBranchId === branchId;
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    if (status === 'Active') return 'success';
    if (status === 'Planned') return 'warning';
    if (status === 'Cancelled') return 'danger';
    return 'neutral';
  }

  verificationVariant(status: string | number): DriveOsBadgeVariant {
    if (status === 'Passed' || status === 1) return 'success';
    if (status === 'Failed' || status === 2) return 'danger';
    if (status === 'Warning' || status === 4) return 'warning';
    return 'neutral';
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

  private run(operation: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.toast.success(this.translate.instant(feedbackKey));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(error);
      },
    });
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }

  private hasPermission(permission: string): boolean {
    this.authorization.permissions();
    return this.authorization.hasPermission(permission);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
