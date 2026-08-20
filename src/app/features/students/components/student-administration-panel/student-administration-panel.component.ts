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
import { AdministrationRequirement, StudentAdministration } from '../../models/student.models';

type AdministrationAction =
  | { type: 'create-requirement' }
  | { type: 'edit-requirement'; requirement: AdministrationRequirement }
  | { type: 'decide-requirement'; requirement: AdministrationRequirement }
  | { type: 'request-exception'; requirement: AdministrationRequirement }
  | { type: 'add-block' }
  | { type: 'release-block'; blockId: string; code: string }
  | { type: 'decide-exception'; exceptionId: string; approve: boolean }
  | null;

@Component({
  selector: 'driveos-student-administration-panel',
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
  templateUrl: './student-administration-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAdministrationPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly administration = input.required<StudentAdministration>();
  readonly refreshed = output<void>();

  readonly action = signal<AdministrationAction>(null);
  readonly saving = signal(false);
  readonly synchronizing = signal(false);

  readonly canUpdate = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.administrationUpdate);
  });
  readonly canValidate = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.documentsValidate);
  });
  readonly canRequestException = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.complianceExceptionRequest);
  });
  readonly canApproveException = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.complianceExceptionApprove);
  });
  readonly completion = computed(() => {
    const value = this.administration();
    return value.totalRequirements === 0
      ? 0
      : Math.round((value.validatedRequirements * 100) / value.totalRequirements);
  });

  readonly requirementForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    labelKey: ['', [Validators.required, Validators.maxLength(200)]],
    isBlocking: [false],
    dueAtUtc: [''],
    policySource: ['', [Validators.required, Validators.maxLength(100)]],
  });
  readonly decisionForm = this.fb.nonNullable.group({
    status: [
      'Validated' as 'Submitted' | 'Validated' | 'Rejected' | 'Expired',
      Validators.required,
    ],
    reason: ['', Validators.maxLength(500)],
  });
  readonly blockForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(80)]],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });
  readonly reasonForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  openCreateRequirement(): void {
    this.requirementForm.reset({
      code: '',
      labelKey: '',
      isBlocking: false,
      dueAtUtc: '',
      policySource: '',
    });
    this.action.set({ type: 'create-requirement' });
  }

  openEditRequirement(requirement: AdministrationRequirement): void {
    this.requirementForm.reset({
      code: requirement.code,
      labelKey: requirement.labelKey,
      isBlocking: requirement.isBlocking,
      dueAtUtc: requirement.dueAtUtc ? requirement.dueAtUtc.slice(0, 16) : '',
      policySource: requirement.policySource,
    });
    this.action.set({ type: 'edit-requirement', requirement });
  }

  openRequirementDecision(requirement: AdministrationRequirement): void {
    this.decisionForm.reset({ status: 'Validated', reason: '' });
    this.action.set({ type: 'decide-requirement', requirement });
  }

  openExceptionRequest(requirement: AdministrationRequirement): void {
    this.reasonForm.reset({ reason: '' });
    this.action.set({ type: 'request-exception', requirement });
  }

  openAddBlock(): void {
    this.blockForm.reset({ code: '', reason: '' });
    this.action.set({ type: 'add-block' });
  }

  openReleaseBlock(blockId: string, code: string): void {
    this.reasonForm.reset({ reason: '' });
    this.action.set({ type: 'release-block', blockId, code });
  }

  openExceptionDecision(exceptionId: string, approve: boolean): void {
    this.reasonForm.reset({ reason: '' });
    this.action.set({ type: 'decide-exception', exceptionId, approve });
  }

  cancelAction(): void {
    this.action.set(null);
  }

  synchronize(): void {
    if (!this.canUpdate() || this.synchronizing()) return;
    this.synchronizing.set(true);
    this.api.synchronizeAdministrationRequirements(this.studentId()).subscribe({
      next: (count) => {
        this.synchronizing.set(false);
        this.toast.success(
          this.translate.instant('students.profile.administration.feedback.synchronized'),
          this.translate.instant('students.profile.administration.feedback.synchronizedCount', {
            count,
          }),
        );
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.synchronizing.set(false);
        this.showError(error);
      },
    });
  }

  saveRequirement(): void {
    const current = this.action();
    if (
      (current?.type !== 'create-requirement' && current?.type !== 'edit-requirement') ||
      this.requirementForm.invalid ||
      this.saving()
    ) {
      this.requirementForm.markAllAsTouched();
      return;
    }
    const value = this.requirementForm.getRawValue();
    const request = {
      code: value.code.trim(),
      labelKey: value.labelKey.trim(),
      isBlocking: value.isBlocking,
      dueAtUtc: value.dueAtUtc ? new Date(value.dueAtUtc).toISOString() : null,
      policySource: value.policySource.trim(),
    };
    const operation =
      current.type === 'create-requirement'
        ? this.api.createAdministrationRequirement(this.studentId(), request)
        : this.api.updateAdministrationRequirement(
            this.studentId(),
            current.requirement.id,
            request,
          );
    this.run(operation, 'students.profile.administration.feedback.requirementSaved');
  }

  decideRequirement(): void {
    const current = this.action();
    if (current?.type !== 'decide-requirement' || this.decisionForm.invalid || this.saving())
      return;
    const value = this.decisionForm.getRawValue();
    if (value.status === 'Rejected' && !value.reason.trim()) {
      this.decisionForm.controls.reason.setErrors({ required: true });
      return;
    }
    this.run(
      this.api.decideAdministrationRequirement(this.studentId(), current.requirement.id, {
        status: value.status,
        reason: value.reason.trim(),
      }),
      'students.profile.administration.feedback.requirementUpdated',
    );
  }

  addBlock(): void {
    if (this.action()?.type !== 'add-block' || this.blockForm.invalid || this.saving()) {
      this.blockForm.markAllAsTouched();
      return;
    }
    const value = this.blockForm.getRawValue();
    this.run(
      this.api.addAdministrativeBlock(this.studentId(), {
        code: value.code.trim(),
        reason: value.reason.trim(),
      }),
      'students.profile.administration.feedback.blockAdded',
    );
  }

  submitReasonAction(): void {
    const current = this.action();
    if (!current || this.reasonForm.invalid || this.saving()) {
      this.reasonForm.markAllAsTouched();
      return;
    }
    const reason = this.reasonForm.getRawValue().reason.trim();
    if (current.type === 'release-block') {
      this.run(
        this.api.releaseAdministrativeBlock(this.studentId(), current.blockId, { reason }),
        'students.profile.administration.feedback.blockReleased',
      );
      return;
    }
    if (current.type === 'request-exception') {
      if (reason.length < 10) {
        this.reasonForm.controls.reason.setErrors({ minlength: true });
        return;
      }
      this.run(
        this.api.requestComplianceException(this.studentId(), current.requirement.id, { reason }),
        'students.profile.administration.feedback.exceptionRequested',
      );
      return;
    }
    if (current.type === 'decide-exception') {
      this.run(
        this.api.decideComplianceException(this.studentId(), current.exceptionId, {
          approve: current.approve,
          reason,
        }),
        current.approve
          ? 'students.profile.administration.feedback.exceptionApproved'
          : 'students.profile.administration.feedback.exceptionRejected',
      );
    }
  }

  requirementVariant(status: string): DriveOsBadgeVariant {
    return status === 'Validated' || status === 'Waived'
      ? 'success'
      : status === 'Rejected' || status === 'Expired' || status === 'Missing'
        ? 'danger'
        : 'warning';
  }

  exceptionVariant(status: string): DriveOsBadgeVariant {
    return status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning';
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    return status === 'Compliant' ? 'success' : status === 'Blocked' ? 'danger' : 'warning';
  }

  private run(observable: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    observable.subscribe({
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
    for (const message of this.errors.getMessages(error)) {
      this.toast.error(this.translate.instant('errors.title'), message);
    }
  }
}
