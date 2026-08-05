import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import { OrganizationSequencesApiService } from '../../data-access/organization-sequences-api.service';
import { ORGANIZATION_SEQUENCE_PERMISSIONS as permissions } from '../../domain/organization-sequence-permissions';
import {
  OrganizationSequence,
  OrganizationSequenceListItem,
  OrganizationSequenceResetPolicy,
  OrganizationSequenceScope,
  OrganizationSequenceStatus,
} from '../../models/organization-sequence.model';

@Component({
  selector: 'driveos-organization-sequences-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-sequences.page.html',
  styleUrl: './organization-sequences.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSequencesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrganizationSequencesApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly sequences = signal<readonly OrganizationSequenceListItem[]>([]);
  readonly selected = signal<OrganizationSequence | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<'view' | 'create' | 'reserve' | 'confirm'>('view');
  readonly pendingAction = signal<'suspend' | 'reactivate' | 'archive' | null>(null);
  readonly lastReservedValue = signal<string | null>(null);

  readonly canCreate = computed(() => this.authorization.hasPermission(permissions.create));
  readonly canReserve = computed(() => this.authorization.hasPermission(permissions.reserve));
  readonly canSuspend = computed(() => this.authorization.hasPermission(permissions.suspend));
  readonly canReactivate = computed(() => this.authorization.hasPermission(permissions.reactivate));
  readonly canArchive = computed(() => this.authorization.hasPermission(permissions.archive));

  readonly createForm = this.fb.nonNullable.group({
    scope: [OrganizationSequenceScope.Organization, Validators.required],
    branchId: [''],
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,40}$/)]],
    pattern: ['{CODE}-{YYYY}-{NUMBER}', Validators.required],
    padding: [6, [Validators.required, Validators.min(1), Validators.max(18)]],
    initialValue: [1, [Validators.required, Validators.min(1)]],
    resetPolicy: [OrganizationSequenceResetPolicy.Never, Validators.required],
  });

  readonly reserveForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    branchId: [''],
  });

  readonly preview = signal('CODE-2026-000001');

  constructor() {
    if (!this.organizationId) {
      void this.router.navigate(['/organizations']);
      return;
    }
    this.updatePreview();
    this.createForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updatePreview());
    this.loadSequences();
  }

  select(item: OrganizationSequenceListItem): void {
    if (this.saving()) return;
    this.mode.set('view');
    this.detailLoading.set(true);
    this.lastReservedValue.set(null);
    this.api
      .getById(this.organizationId, item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => {
          this.selected.set(value);
          this.detailLoading.set(false);
        },
        error: (error) => {
          this.detailLoading.set(false);
          this.showErrors(error);
        },
      });
  }

  openCreate(): void {
    this.createForm.reset({
      scope: OrganizationSequenceScope.Organization,
      branchId: '',
      code: '',
      pattern: '{CODE}-{YYYY}-{NUMBER}',
      padding: 6,
      initialValue: 1,
      resetPolicy: OrganizationSequenceResetPolicy.Never,
    });
    this.mode.set('create');
  }

  openReserve(): void {
    const current = this.selected();
    if (!current || current.status !== OrganizationSequenceStatus.Active || !this.canReserve())
      return;
    this.reserveForm.reset({ code: current.code, branchId: current.branchId ?? '' });
    this.mode.set('reserve');
  }

  requestAction(action: 'suspend' | 'reactivate' | 'archive'): void {
    this.pendingAction.set(action);
    this.mode.set('confirm');
  }

  cancelMode(): void {
    if (!this.saving()) {
      this.mode.set('view');
      this.pendingAction.set(null);
    }
  }

  submitCreate(): void {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const value = this.createForm.getRawValue();
    const branchId =
      value.scope === OrganizationSequenceScope.Branch ? value.branchId.trim() : null;
    if (value.scope === OrganizationSequenceScope.Branch && !branchId) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.sequences.validation.branchRequired'),
      );
      return;
    }
    if (!value.pattern.includes('{NUMBER}')) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.sequences.validation.numberTokenRequired'),
      );
      return;
    }
    this.saving.set(true);
    this.api
      .create(this.organizationId, {
        branchId,
        scope: value.scope,
        code: value.code.trim().toUpperCase(),
        pattern: value.pattern.trim(),
        padding: value.padding,
        initialValue: value.initialValue,
        resetPolicy: value.resetPolicy,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.afterMutation(result.id, 'organizations.sequences.messages.created'),
        error: (error) => this.onMutationError(error),
      });
  }

  submitReserve(): void {
    if (this.reserveForm.invalid || this.saving()) return;
    const value = this.reserveForm.getRawValue();
    this.saving.set(true);
    this.api
      .reserve(this.organizationId, {
        code: value.code.trim().toUpperCase(),
        branchId: value.branchId.trim() || null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.lastReservedValue.set(result.value);
          this.saving.set(false);
          this.mode.set('view');
          this.toast.success(this.translate.instant('organizations.sequences.messages.reserved'));
          this.loadSequences(this.selected()?.id ?? null);
        },
        error: (error) => this.onMutationError(error),
      });
  }

  confirmAction(): void {
    const current = this.selected();
    const action = this.pendingAction();
    if (!current || !action || this.saving()) return;
    const request = { expectedRevision: current.revision };
    const operation =
      action === 'suspend'
        ? this.api.suspend(this.organizationId, current.id, request)
        : action === 'reactivate'
          ? this.api.reactivate(this.organizationId, current.id, request)
          : this.api.archive(this.organizationId, current.id, request);
    this.saving.set(true);
    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.afterMutation(current.id, `organizations.sequences.messages.${action}d`),
      error: (error) => this.onMutationError(error),
    });
  }

  statusLabel(status: OrganizationSequenceStatus): string {
    return `organizations.sequences.status.${OrganizationSequenceStatus[status]}`;
  }

  statusVariant(status: OrganizationSequenceStatus): 'success' | 'warning' | 'neutral' {
    if (status === OrganizationSequenceStatus.Active) return 'success';
    if (status === OrganizationSequenceStatus.Suspended) return 'warning';
    return 'neutral';
  }

  scopeLabel(scope: OrganizationSequenceScope): string {
    return `organizations.sequences.scope.${OrganizationSequenceScope[scope]}`;
  }

  resetLabel(policy: OrganizationSequenceResetPolicy): string {
    return `organizations.sequences.resetPolicy.${OrganizationSequenceResetPolicy[policy]}`;
  }

  private loadSequences(selectId: string | null = null): void {
    this.loading.set(true);
    this.api
      .getAll(this.organizationId, null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.sequences.set(items);
          this.loading.set(false);
          const id = selectId ?? this.selected()?.id ?? items[0]?.id;
          const item = items.find((x) => x.id === id);
          if (item) this.select(item);
          else this.selected.set(null);
        },
        error: (error) => {
          this.loading.set(false);
          this.showErrors(error);
        },
      });
  }

  private afterMutation(id: string, messageKey: string): void {
    this.saving.set(false);
    this.mode.set('view');
    this.pendingAction.set(null);
    this.toast.success(this.translate.instant(messageKey));
    this.loadSequences(id);
  }

  private onMutationError(error: HttpErrorResponse): void {
    this.saving.set(false);
    if (error.status === 409) {
      this.toast.warning(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.sequences.messages.conflict'),
      );
      this.loadSequences(this.selected()?.id ?? null);
      return;
    }
    this.showErrors(error);
  }

  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.apiErrors.getMessages(error)) {
      this.toast.error(this.translate.instant('errors.title'), message);
    }
  }

  private updatePreview(): void {
    const value = this.createForm.getRawValue();
    this.preview.set(
      this.formatPreview(value.code, value.pattern, value.padding, value.initialValue),
    );
  }

  private formatPreview(code: string, pattern: string, padding: number, number: number): string {
    const now = new Date();
    return (pattern || '{CODE}-{YYYY}-{NUMBER}')
      .replaceAll('{CODE}', (code || 'CODE').trim().toUpperCase())
      .replaceAll('{YYYY}', String(now.getFullYear()))
      .replaceAll('{YY}', String(now.getFullYear()).slice(-2))
      .replaceAll('{MM}', String(now.getMonth() + 1).padStart(2, '0'))
      .replaceAll(
        '{NUMBER}',
        String(Math.max(1, number || 1)).padStart(Math.max(1, padding || 1), '0'),
      );
  }

  protected readonly OrganizationSequenceScope = OrganizationSequenceScope;
  protected readonly OrganizationSequenceResetPolicy = OrganizationSequenceResetPolicy;
  protected readonly OrganizationSequenceStatus = OrganizationSequenceStatus;
}
