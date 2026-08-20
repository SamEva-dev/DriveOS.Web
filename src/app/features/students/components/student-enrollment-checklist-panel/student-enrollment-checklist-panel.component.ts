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
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
} from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { EnrollmentChecklist, EnrollmentChecklistItem } from '../../models/student.models';

type ChecklistAction =
  | { type: 'status'; item: EnrollmentChecklistItem }
  | { type: 'assign'; item: EnrollmentChecklistItem }
  | { type: 'activate' }
  | null;

@Component({
  selector: 'driveos-student-enrollment-checklist-panel',
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
  templateUrl: './student-enrollment-checklist-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentChecklistPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);

  readonly studentId = input.required<string>();
  readonly checklist = input.required<EnrollmentChecklist>();
  readonly refreshed = output<void>();

  readonly action = signal<ChecklistAction>(null);
  readonly saving = signal(false);
  readonly synchronizing = signal(false);
  readonly remindingId = signal<string | null>(null);

  readonly canUpdate = computed(() => this.hasPermission(STUDENT_PERMISSIONS.checklistUpdate));
  readonly canActivate = computed(() => this.hasPermission(STUDENT_PERMISSIONS.activateEnrollment));
  readonly progress = computed(() => {
    const value = this.checklist();
    return value.totalBlocking === 0
      ? 100
      : Math.round((value.completedBlocking * 100) / value.totalBlocking);
  });

  readonly statuses = [
    'NotStarted',
    'InProgress',
    'WaitingExternal',
    'Completed',
    'Waived',
    'Rejected',
    'Blocked',
    'Expired',
  ] as const;

  readonly statusForm = this.fb.nonNullable.group({
    status: ['InProgress', Validators.required],
    reason: ['', Validators.maxLength(500)],
  });
  readonly assignmentForm = this.fb.nonNullable.group({
    responsibleUserId: ['', Validators.required],
  });


  openSource(item: EnrollmentChecklistItem): void {
    if (!item.targetRoute) return;
    void this.router.navigate(['/students', this.studentId(), ...item.targetRoute.split('/').filter(Boolean)]);
  }

  openStatus(item: EnrollmentChecklistItem): void {
    this.statusForm.reset({
      status: item.status || 'InProgress',
      reason: item.decisionReason ?? '',
    });
    this.action.set({ type: 'status', item });
  }

  openAssign(item: EnrollmentChecklistItem): void {
    this.assignmentForm.reset({ responsibleUserId: item.responsibleUserId ?? '' });
    this.action.set({ type: 'assign', item });
  }

  openActivate(): void {
    if (!this.checklist().canActivate || !this.canActivate()) return;
    this.action.set({ type: 'activate' });
  }

  cancel(): void {
    this.action.set(null);
  }

  synchronize(): void {
    if (!this.canUpdate() || this.synchronizing()) return;
    this.synchronizing.set(true);
    this.api
      .synchronizeEnrollmentChecklist(this.studentId(), this.checklist().enrollmentId)
      .subscribe({
        next: () => {
          this.synchronizing.set(false);
          this.toast.success(
            this.translate.instant('students.enrollment.checklist.feedback.synchronized'),
          );
          this.refreshed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.synchronizing.set(false);
          this.showError(error);
        },
      });
  }

  saveStatus(): void {
    const current = this.action();
    if (current?.type !== 'status' || this.statusForm.invalid || this.saving()) {
      this.statusForm.markAllAsTouched();
      return;
    }
    const value = this.statusForm.getRawValue();
    if (['Rejected', 'Blocked', 'Waived'].includes(value.status) && !value.reason.trim()) {
      this.statusForm.controls.reason.setErrors({ required: true });
      return;
    }
    this.run(
      this.api.changeEnrollmentChecklistItemStatus(
        this.studentId(),
        this.checklist().enrollmentId,
        current.item.id,
        { status: value.status, reason: value.reason.trim() || null },
      ),
      'students.enrollment.checklist.feedback.statusUpdated',
    );
  }

  saveAssignment(): void {
    const current = this.action();
    if (current?.type !== 'assign' || this.assignmentForm.invalid || this.saving()) {
      this.assignmentForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.assignEnrollmentChecklistItem(
        this.studentId(),
        this.checklist().enrollmentId,
        current.item.id,
        this.assignmentForm.getRawValue().responsibleUserId.trim(),
      ),
      'students.enrollment.checklist.feedback.assigned',
    );
  }

  remind(item: EnrollmentChecklistItem): void {
    if (!this.canUpdate() || this.remindingId()) return;
    this.remindingId.set(item.id);
    this.api
      .remindEnrollmentChecklistItem(this.studentId(), this.checklist().enrollmentId, item.id)
      .subscribe({
        next: () => {
          this.remindingId.set(null);
          this.toast.success(
            this.translate.instant('students.enrollment.checklist.feedback.reminded'),
          );
          this.refreshed.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.remindingId.set(null);
          this.showError(error);
        },
      });
  }

  activate(): void {
    if (
      this.action()?.type !== 'activate' ||
      !this.checklist().canActivate ||
      !this.canActivate() ||
      this.saving()
    )
      return;
    this.run(
      this.api.activateEnrollment(this.studentId(), this.checklist().enrollmentId),
      'students.enrollment.checklist.feedback.activated',
    );
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    if (['Completed', 'Waived'].includes(status)) return 'success';
    if (['Rejected', 'Blocked', 'Expired'].includes(status)) return 'danger';
    if (['InProgress', 'WaitingExternal'].includes(status)) return 'warning';
    return 'neutral';
  }

  private run(operation: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.action.set(null);
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
}
