import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsBadgeComponent, DriveOsBadgeVariant } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { ExternalTransfer, ExternalTransferPreconditions } from '../../models/student.models';

interface ScopeOption { value: number; labelKey: string; }

@Component({
  selector: 'driveos-student-external-transfer-panel',
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
  templateUrl: './student-external-transfer-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentExternalTransferPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly transfers = input.required<readonly ExternalTransfer[]>();
  readonly refreshed = output<void>();

  readonly editorOpen = signal(false);
  readonly saving = signal(false);
  readonly selectedScope = signal(2047);
  readonly actionTransferId = signal<string | null>(null);
  readonly action = signal<'consent' | 'finance' | 'decision' | null>(null);
  readonly preconditions = signal<Record<string, ExternalTransferPreconditions>>({});

  readonly canCreate = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.transferExternal);
  });
  readonly canReviewFinance = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasPermission(STUDENT_PERMISSIONS.financeTransferResolution);
  });
  readonly canDecide = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasAll([
      STUDENT_PERMISSIONS.partnersStudentsTransfer,
      STUDENT_PERMISSIONS.studentDataGrantsCreate,
    ]);
  });
  readonly canComplete = computed(() => {
    this.authorization.permissions();
    return this.authorization.hasAll([
      STUDENT_PERMISSIONS.transferExternal,
      STUDENT_PERMISSIONS.partnersStudentsTransfer,
    ]);
  });

  readonly createForm = this.fb.nonNullable.group({
    targetOrganizationId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F-]{36}$/)]],
    type: [1, Validators.required],
    effectiveOn: [this.today(), Validators.required],
    temporaryUntil: [''],
    countryCode: ['FR', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
    responsibilities: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
  });
  readonly consentForm = this.fb.nonNullable.group({
    evidenceReference: ['', [Validators.required, Validators.maxLength(500)]],
  });
  readonly financeForm = this.fb.nonNullable.group({
    status: [2, Validators.required],
    resolution: [''],
  });
  readonly decisionForm = this.fb.nonNullable.group({
    accept: [true],
    reason: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  readonly scopeOptions: readonly ScopeOption[] = [
    { value: 1, labelKey: 'students.mobility.external.scope.identity' },
    { value: 2, labelKey: 'students.mobility.external.scope.contactDetails' },
    { value: 4, labelKey: 'students.mobility.external.scope.selectedDocuments' },
    { value: 8, labelKey: 'students.mobility.external.scope.trainingHistory' },
    { value: 16, labelKey: 'students.mobility.external.scope.assessments' },
    { value: 32, labelKey: 'students.mobility.external.scope.completedHours' },
    { value: 64, labelKey: 'students.mobility.external.scope.exams' },
    { value: 128, labelKey: 'students.mobility.external.scope.relevantContracts' },
    { value: 256, labelKey: 'students.mobility.external.scope.credits' },
    { value: 512, labelKey: 'students.mobility.external.scope.authorizedFinance' },
    { value: 1024, labelKey: 'students.mobility.external.scope.authorizedSpecialNeeds' },
  ];

  openCreate(): void {
    this.selectedScope.set(2047);
    this.createForm.reset({
      targetOrganizationId: '', type: 1, effectiveOn: this.today(), temporaryUntil: '',
      countryCode: 'FR', reason: '', responsibilities: '',
    });
    this.editorOpen.set(true);
  }
  cancelCreate(): void { this.editorOpen.set(false); }
  toggleScope(value: number): void {
    const current = this.selectedScope();
    this.selectedScope.set((current & value) === value ? current & ~value : current | value);
  }
  scopeSelected(value: number): boolean { return (this.selectedScope() & value) === value; }

  create(): void {
    if (this.createForm.invalid || this.saving() || this.selectedScope() === 0) {
      this.createForm.markAllAsTouched(); return;
    }
    const value = this.createForm.getRawValue();
    const type = Number(value.type);
    if (type === 3 && !value.temporaryUntil) {
      this.createForm.controls.temporaryUntil.setErrors({ required: true }); return;
    }
    this.saving.set(true);
    this.api.createExternalTransfer(this.studentId(), {
      targetOrganizationId: value.targetOrganizationId.trim(),
      type,
      dataScope: this.selectedScope(),
      effectiveOn: value.effectiveOn,
      temporaryUntil: type === 3 ? value.temporaryUntil || null : null,
      countryCode: value.countryCode.trim().toUpperCase(),
      reason: value.reason.trim(),
      responsibilities: value.responsibilities.trim(),
    }).subscribe({
      next: () => { this.saving.set(false); this.editorOpen.set(false); this.success('created'); },
      error: (e: HttpErrorResponse) => this.fail(e),
    });
  }

  openConsent(transfer: ExternalTransfer): void {
    this.actionTransferId.set(transfer.transferId); this.action.set('consent');
    this.consentForm.reset({ evidenceReference: '' });
  }
  verifyConsent(transfer: ExternalTransfer): void {
    if (this.consentForm.invalid || this.saving()) { this.consentForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.verifyExternalTransferConsent(this.studentId(), transfer.transferId, this.consentForm.getRawValue().evidenceReference.trim())
      .subscribe({ next: () => { this.saving.set(false); this.closeAction(); this.success('consentVerified'); }, error: (e) => this.fail(e) });
  }

  openFinance(transfer: ExternalTransfer): void {
    this.actionTransferId.set(transfer.transferId); this.action.set('finance');
    this.financeForm.reset({ status: 2, resolution: '' });
  }
  reviewFinance(transfer: ExternalTransfer): void {
    if (this.financeForm.invalid || this.saving()) return;
    const value = this.financeForm.getRawValue();
    if ([3, 4].includes(Number(value.status)) && !value.resolution.trim()) {
      this.financeForm.controls.resolution.setErrors({ required: true }); return;
    }
    this.saving.set(true);
    this.api.reviewExternalTransferFinance(this.studentId(), transfer.transferId, {
      status: Number(value.status), resolution: value.resolution.trim() || null,
    }).subscribe({ next: () => { this.saving.set(false); this.closeAction(); this.success('financeReviewed'); }, error: (e) => this.fail(e) });
  }

  submit(transfer: ExternalTransfer, requestInvitationIfMissing: boolean): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api.submitExternalTransfer(this.studentId(), transfer.transferId, requestInvitationIfMissing).subscribe({
      next: (result) => {
        this.preconditions.update((current) => ({ ...current, [transfer.transferId]: result }));
        this.saving.set(false); this.success('submitted');
      },
      error: (e) => this.fail(e),
    });
  }

  openDecision(transfer: ExternalTransfer): void {
    this.actionTransferId.set(transfer.transferId); this.action.set('decision');
    this.decisionForm.reset({ accept: true, reason: '' });
  }
  decide(transfer: ExternalTransfer): void {
    if (this.decisionForm.invalid || this.saving()) { this.decisionForm.markAllAsTouched(); return; }
    const value = this.decisionForm.getRawValue(); this.saving.set(true);
    this.api.decideExternalTransfer(this.studentId(), transfer.transferId, value.accept, value.reason.trim())
      .subscribe({ next: () => { this.saving.set(false); this.closeAction(); this.success(value.accept ? 'accepted' : 'rejected'); }, error: (e) => this.fail(e) });
  }

  complete(transfer: ExternalTransfer): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api.completeExternalTransfer(this.studentId(), transfer.transferId).subscribe({
      next: () => { this.saving.set(false); this.success('completed'); }, error: (e) => this.fail(e),
    });
  }

  closeAction(): void { this.actionTransferId.set(null); this.action.set(null); }
  isAction(transfer: ExternalTransfer, action: 'consent' | 'finance' | 'decision'): boolean {
    return this.actionTransferId() === transfer.transferId && this.action() === action;
  }
  canSubmit(transfer: ExternalTransfer): boolean {
    return this.canCreate() && transfer.status === 'ConsentPending' && transfer.consentStatus === 'Verified' && ['Cleared', 'Resolved'].includes(transfer.financialStatus);
  }
  canCompleteTransfer(transfer: ExternalTransfer): boolean {
    return this.canComplete() && ['Accepted', 'Scheduled', 'InProgress'].includes(transfer.status);
  }
  statusVariant(status: string): DriveOsBadgeVariant {
    if (['Completed', 'Accepted', 'Active', 'Verified', 'Cleared', 'Resolved'].includes(status)) return 'success';
    if (['Rejected', 'Cancelled', 'Failed', 'Expired', 'Missing', 'Withdrawn'].includes(status)) return 'danger';
    if (['ConsentPending', 'TargetReview', 'Scheduled', 'Pending', 'ResolutionRequired', 'InvitationRequested'].includes(status)) return 'warning';
    return 'neutral';
  }
  private today(): string { return new Date().toISOString().slice(0, 10); }
  private success(key: string): void {
    this.toast.success(this.translate.instant(`students.mobility.external.feedback.${key}`));
    this.refreshed.emit();
  }
  private fail(error: HttpErrorResponse): void { this.saving.set(false); for (const message of this.errors.getMessages(error)) this.toast.error(message); }
}
