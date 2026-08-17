import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsBadgeComponent } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentGuardian, StudentGuardians } from '../../models/student.models';

type GuardianAction =
  | { type: 'create' }
  | { type: 'edit'; guardian: StudentGuardian }
  | { type: 'revoke'; guardian: StudentGuardian }
  | null;

interface PermissionOption { value: number; labelKey: string }

@Component({
  selector: 'driveos-student-guardians-panel',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-guardians-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentGuardiansPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly guardians = input.required<StudentGuardians>();
  readonly refreshed = output<void>();

  readonly action = signal<GuardianAction>(null);
  readonly saving = signal(false);
  readonly invitingId = signal<string | null>(null);

  readonly canCreate = computed(() => this.hasPermission(STUDENT_PERMISSIONS.guardiansCreate));
  readonly canUpdate = computed(() => this.hasPermission(STUDENT_PERMISSIONS.guardiansUpdate));
  readonly canInvite = computed(() => this.hasPermission(STUDENT_PERMISSIONS.guardiansInvite));
  readonly canRevoke = computed(() => this.hasPermission(STUDENT_PERMISSIONS.guardiansRevoke));

  readonly relationshipTypes = ['Parent', 'LegalGuardian', 'FosterParent', 'AuthorizedRepresentative', 'Other'] as const;
  readonly authorityStatuses = ['Unknown', 'Full', 'Shared', 'Restricted', 'None'] as const;
  readonly permissionOptions: readonly PermissionOption[] = [
    { value: 1, labelKey: 'students.profile.guardians.permissions.profileRead' },
    { value: 2, labelKey: 'students.profile.guardians.permissions.scheduleRead' },
    { value: 4, labelKey: 'students.profile.guardians.permissions.scheduleBook' },
    { value: 8, labelKey: 'students.profile.guardians.permissions.scheduleCancel' },
    { value: 16, labelKey: 'students.profile.guardians.permissions.progressRead' },
    { value: 32, labelKey: 'students.profile.guardians.permissions.documentsRead' },
    { value: 64, labelKey: 'students.profile.guardians.permissions.documentsUpload' },
    { value: 128, labelKey: 'students.profile.guardians.permissions.contractsSign' },
    { value: 256, labelKey: 'students.profile.guardians.permissions.invoicesRead' },
    { value: 512, labelKey: 'students.profile.guardians.permissions.paymentsPay' },
    { value: 1024, labelKey: 'students.profile.guardians.permissions.examRead' },
    { value: 2048, labelKey: 'students.profile.guardians.permissions.messagesRead' },
    { value: 4096, labelKey: 'students.profile.guardians.permissions.messagesSend' },
  ];

  readonly guardianForm = this.fb.nonNullable.group({
    guardianPersonId: ['', [Validators.required]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.maxLength(40)]],
    relationshipType: ['Parent'],
    legalBasis: ['', [Validators.required, Validators.maxLength(250)]],
    parentalAuthorityStatus: ['Unknown'],
    effectiveFrom: [new Date().toISOString().slice(0, 10), Validators.required],
    effectiveTo: [''],
    financialRights: [false],
    signatureRights: [false],
    notificationPreferences: ['Email'],
  });
  readonly revokeForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });
  readonly selectedPermissions = signal<number>(0);

  openCreate(): void {
    this.guardianForm.reset({
      guardianPersonId: '', firstName: '', lastName: '', email: '', phone: '', relationshipType: 'Parent',
      legalBasis: '', parentalAuthorityStatus: 'Unknown', effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '', financialRights: false, signatureRights: false, notificationPreferences: 'Email',
    });
    this.selectedPermissions.set(0);
    this.guardianForm.controls.guardianPersonId.enable();
    this.guardianForm.controls.firstName.enable();
    this.guardianForm.controls.lastName.enable();
    this.guardianForm.controls.email.enable();
    this.guardianForm.controls.phone.enable();
    this.action.set({ type: 'create' });
  }

  openEdit(guardian: StudentGuardian): void {
    this.guardianForm.reset({
      guardianPersonId: guardian.guardianPersonId,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      email: guardian.email ?? '',
      phone: guardian.phone ?? '',
      relationshipType: guardian.relationshipType,
      legalBasis: guardian.legalBasis,
      parentalAuthorityStatus: guardian.parentalAuthorityStatus,
      effectiveFrom: guardian.effectiveFrom,
      effectiveTo: guardian.effectiveTo ?? '',
      financialRights: guardian.financialRights,
      signatureRights: guardian.signatureRights,
      notificationPreferences: guardian.notificationPreferences,
    });
    this.selectedPermissions.set(guardian.permissions);
    for (const control of [this.guardianForm.controls.guardianPersonId, this.guardianForm.controls.firstName, this.guardianForm.controls.lastName, this.guardianForm.controls.email, this.guardianForm.controls.phone]) control.disable();
    this.action.set({ type: 'edit', guardian });
  }

  openRevoke(guardian: StudentGuardian): void {
    this.revokeForm.reset({ reason: '' });
    this.action.set({ type: 'revoke', guardian });
  }

  cancel(): void { this.action.set(null); }

  togglePermission(value: number): void {
    const current = this.selectedPermissions();
    this.selectedPermissions.set((current & value) === value ? current & ~value : current | value);
  }

  hasGuardianPermission(mask: number, value: number): boolean { return (mask & value) === value; }

  save(): void {
    const current = this.action();
    if (!current || (current.type !== 'create' && current.type !== 'edit') || this.guardianForm.invalid || this.saving()) {
      this.guardianForm.markAllAsTouched();
      return;
    }
    const value = this.guardianForm.getRawValue();
    if (value.effectiveTo && value.effectiveTo < value.effectiveFrom) {
      this.guardianForm.controls.effectiveTo.setErrors({ period: true });
      return;
    }
    const common = {
      relationshipType: value.relationshipType,
      legalBasis: value.legalBasis.trim(),
      parentalAuthorityStatus: value.parentalAuthorityStatus,
      permissions: this.selectedPermissions(),
      effectiveFrom: value.effectiveFrom,
      effectiveTo: value.effectiveTo || null,
      financialRights: value.financialRights,
      signatureRights: value.signatureRights,
      notificationPreferences: value.notificationPreferences.trim(),
    };
    const operation = current.type === 'create'
      ? this.api.createGuardian(this.studentId(), {
          guardianPersonId: value.guardianPersonId.trim(), firstName: value.firstName.trim(), lastName: value.lastName.trim(),
          email: value.email.trim() || null, phone: value.phone.trim() || null, ...common,
        })
      : this.api.updateGuardian(this.studentId(), current.guardian.id, common);
    this.run(operation, current.type === 'create' ? 'students.profile.guardians.feedback.created' : 'students.profile.guardians.feedback.updated');
  }

  invite(guardian: StudentGuardian): void {
    if (!this.canInvite() || this.invitingId() || guardian.status !== 'Active') return;
    this.invitingId.set(guardian.id);
    this.api.inviteGuardian(this.studentId(), guardian.id).subscribe({
      next: () => {
        this.invitingId.set(null);
        this.toast.success(this.translate.instant('students.profile.guardians.feedback.invited'));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => { this.invitingId.set(null); this.showError(error); },
    });
  }

  revoke(): void {
    const current = this.action();
    if (current?.type !== 'revoke' || this.revokeForm.invalid || this.saving()) { this.revokeForm.markAllAsTouched(); return; }
    this.run(this.api.revokeGuardian(this.studentId(), current.guardian.id, this.revokeForm.getRawValue()), 'students.profile.guardians.feedback.revoked');
  }

  private run(operation: Observable<unknown>, messageKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.action.set(null);
        this.toast.success(this.translate.instant(messageKey));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => { this.saving.set(false); this.showError(error); },
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
