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
import { DriveOsBadgeComponent } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentRelationshipItem, StudentRelationships } from '../../models/student.models';

type RelationshipAction =
  | { type: 'create' }
  | { type: 'edit'; item: StudentRelationshipItem }
  | { type: 'suspend'; item: StudentRelationshipItem }
  | { type: 'revoke'; item: StudentRelationshipItem }
  | null;

interface FlagOption {
  value: number;
  labelKey: string;
}

@Component({
  selector: 'driveos-student-relationships-panel',
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
  templateUrl: './student-relationships-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentRelationshipsPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly relationships = input.required<StudentRelationships>();
  readonly refreshed = output<void>();

  readonly action = signal<RelationshipAction>(null);
  readonly saving = signal(false);
  readonly invitingId = signal<string | null>(null);
  readonly permissions = signal(0);
  readonly financialScope = signal(0);
  readonly communicationScope = signal(0);

  readonly canCreate = computed(() => this.has(STUDENT_PERMISSIONS.relationshipsCreate));
  readonly canUpdate = computed(() => this.has(STUDENT_PERMISSIONS.relationshipsUpdate));
  readonly canRevoke = computed(() => this.has(STUDENT_PERMISSIONS.relationshipsRevoke));
  readonly canManagePayers = computed(() =>
    this.has(STUDENT_PERMISSIONS.relationshipsManagePayers),
  );

  readonly partyKinds = ['Person', 'Organization'] as const;
  readonly relationshipTypes = [
    'Payer',
    'BillingContact',
    'EmergencyContact',
    'AuthorizedContact',
    'EmployerContact',
    'FunderContact',
    'Guardian',
    'PartnerContact',
  ] as const;
  readonly permissionOptions: readonly FlagOption[] = [
    { value: 1, labelKey: 'students.profile.relationships.permissions.receiveInformation' },
    { value: 2, labelKey: 'students.profile.relationships.permissions.pay' },
    { value: 4, labelKey: 'students.profile.relationships.permissions.viewInvoices' },
    { value: 8, labelKey: 'students.profile.relationships.permissions.receiveDocuments' },
    { value: 16, labelKey: 'students.profile.relationships.permissions.beContacted' },
  ];
  readonly financialOptions: readonly FlagOption[] = [
    { value: 1, labelKey: 'students.profile.relationships.financial.invoices' },
    { value: 2, labelKey: 'students.profile.relationships.financial.payments' },
    { value: 4, labelKey: 'students.profile.relationships.financial.refunds' },
    { value: 8, labelKey: 'students.profile.relationships.financial.contracts' },
  ];
  readonly communicationOptions: readonly FlagOption[] = [
    { value: 1, labelKey: 'students.profile.relationships.communication.general' },
    { value: 2, labelKey: 'students.profile.relationships.communication.administrative' },
    { value: 4, labelKey: 'students.profile.relationships.communication.financial' },
    { value: 8, labelKey: 'students.profile.relationships.communication.pedagogical' },
    { value: 16, labelKey: 'students.profile.relationships.communication.emergency' },
  ];

  readonly form = this.fb.nonNullable.group({
    personOrOrganizationId: ['', Validators.required],
    partyKind: ['Person'],
    displayName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(40)],
    relationshipType: ['AuthorizedContact'],
    effectiveFrom: [new Date().toISOString().slice(0, 10), Validators.required],
    effectiveTo: [''],
    isPrimaryPayer: [false],
  });
  readonly reasonForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  openCreate(): void {
    this.form.reset({
      personOrOrganizationId: '',
      partyKind: 'Person',
      displayName: '',
      email: '',
      phone: '',
      relationshipType: 'AuthorizedContact',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      isPrimaryPayer: false,
    });
    this.permissions.set(0);
    this.financialScope.set(0);
    this.communicationScope.set(1);
    ['personOrOrganizationId', 'partyKind', 'displayName', 'email', 'phone'].forEach((k) =>
      this.form.get(k)?.enable(),
    );
    this.action.set({ type: 'create' });
  }

  openEdit(item: StudentRelationshipItem): void {
    this.form.reset({
      personOrOrganizationId: item.personOrOrganizationId,
      partyKind: item.partyKind,
      displayName: item.displayName,
      email: item.email ?? '',
      phone: item.phone ?? '',
      relationshipType: item.relationshipType,
      effectiveFrom: item.effectiveFrom,
      effectiveTo: item.effectiveTo ?? '',
      isPrimaryPayer: item.isPrimaryPayer,
    });
    ['personOrOrganizationId', 'partyKind', 'displayName', 'email', 'phone'].forEach((k) =>
      this.form.get(k)?.disable(),
    );
    this.permissions.set(item.permissions);
    this.financialScope.set(item.financialScope);
    this.communicationScope.set(item.communicationScope);
    this.action.set({ type: 'edit', item });
  }

  openReason(type: 'suspend' | 'revoke', item: StudentRelationshipItem): void {
    this.reasonForm.reset({ reason: '' });
    this.action.set({ type, item });
  }
  close(): void {
    if (!this.saving()) this.action.set(null);
  }
  toggle(target: 'permissions' | 'financial' | 'communication', flag: number): void {
    const state =
      target === 'permissions'
        ? this.permissions
        : target === 'financial'
          ? this.financialScope
          : this.communicationScope;
    state.update((v) => ((v & flag) === flag ? v & ~flag : v | flag));
  }
  hasFlag(value: number, flag: number): boolean {
    return (value & flag) === flag;
  }

  save(): void {
    const action = this.action();
    if (!action || (action.type !== 'create' && action.type !== 'edit') || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.isPrimaryPayer && !this.canManagePayers()) {
      this.toast.error(
        this.translate.instant('students.profile.relationships.errors.payerPermission'),
      );
      return;
    }
    this.saving.set(true);
    const request$ =
      action.type === 'create'
        ? this.api.createRelationship(this.studentId(), {
            personOrOrganizationId: v.personOrOrganizationId,
            partyKind: v.partyKind,
            displayName: v.displayName.trim(),
            email: v.email.trim() || null,
            phone: v.phone.trim() || null,
            relationshipType: v.relationshipType,
            permissions: this.permissions(),
            financialScope: this.financialScope(),
            communicationScope: this.communicationScope(),
            effectiveFrom: v.effectiveFrom,
            effectiveTo: v.effectiveTo || null,
            isPrimaryPayer: v.isPrimaryPayer,
          })
        : this.api.updateRelationship(this.studentId(), action.item.id, {
            relationshipType: v.relationshipType,
            permissions: this.permissions(),
            financialScope: this.financialScope(),
            communicationScope: this.communicationScope(),
            effectiveFrom: v.effectiveFrom,
            effectiveTo: v.effectiveTo || null,
            isPrimaryPayer: v.isPrimaryPayer,
          });
    this.execute(request$, 'students.profile.relationships.saved');
  }

  invite(item: StudentRelationshipItem): void {
    this.invitingId.set(item.id);
    this.api.inviteRelationship(this.studentId(), item.id).subscribe({
      next: () => {
        this.invitingId.set(null);
        this.toast.success(this.translate.instant('students.profile.relationships.invited'));
        this.refreshed.emit();
      },
      error: (e) => {
        this.invitingId.set(null);
        this.showError(e);
      },
    });
  }
  confirmReason(): void {
    const action = this.action();
    if (
      !action ||
      (action.type !== 'suspend' && action.type !== 'revoke') ||
      this.reasonForm.invalid
    ) {
      this.reasonForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const reason = this.reasonForm.getRawValue().reason.trim();
    const request$ =
      action.type === 'suspend'
        ? this.api.suspendRelationship(this.studentId(), action.item.id, reason)
        : this.api.revokeRelationship(this.studentId(), action.item.id, reason);
    this.execute(
      request$,
      action.type === 'suspend'
        ? 'students.profile.relationships.suspended'
        : 'students.profile.relationships.revoked',
    );
  }

  private execute(request$: Observable<unknown>, key: string): void {
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.action.set(null);
        this.toast.success(this.translate.instant(key));
        this.refreshed.emit();
      },
      error: (e) => {
        this.saving.set(false);
        this.showError(e);
      },
    });
  }
  private has(permission: string): boolean {
    this.authorization.permissions();
    return this.authorization.hasPermission(permission);
  }
  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }
  statusVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
    return status === 'Active'
      ? 'success'
      : status === 'Suspended'
        ? 'warning'
        : status === 'Revoked'
          ? 'danger'
          : 'neutral';
  }
}
