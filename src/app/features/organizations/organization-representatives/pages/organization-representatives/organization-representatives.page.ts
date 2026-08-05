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
import { OrganizationRepresentativesApiService } from '../../data-access/organization-representatives-api.service';
import { ORGANIZATION_REPRESENTATIVE_PERMISSIONS as p } from '../../domain/organization-representative-permissions';
import {
  OrganizationRepresentative,
  OrganizationRepresentativeListItem,
  OrganizationRepresentativeStatus,
  OrganizationRepresentativeType,
} from '../../models/organization-representative.model';
@Component({
  selector: 'driveos-organization-representatives-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-representatives.page.html',
  styleUrl: './organization-representatives.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationRepresentativesPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OrganizationRepresentativesApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly tr = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroy = inject(DestroyRef);
  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly items = signal<readonly OrganizationRepresentativeListItem[]>([]);
  readonly selected = signal<OrganizationRepresentative | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly mode = signal<'view' | 'create' | 'edit' | 'action'>('view');
  readonly action = signal<'activate' | 'suspend' | 'reactivate' | 'end' | 'primary' | null>(null);
  readonly canCreate = computed(() => this.auth.hasPermission(p.create));
  readonly canUpdate = computed(() => this.auth.hasPermission(p.update));
  readonly canActivate = computed(() => this.auth.hasPermission(p.activate));
  readonly canSuspend = computed(() => this.auth.hasPermission(p.suspend));
  readonly canReactivate = computed(() => this.auth.hasPermission(p.reactivate));
  readonly canEnd = computed(() => this.auth.hasPermission(p.end));
  readonly canPrimary = computed(() => this.auth.hasPermission(p.setPrimaryOwner));
  readonly createForm = this.fb.nonNullable.group({
    personId: ['', Validators.required],
    userId: [''],
    representativeType: [OrganizationRepresentativeType.Owner, Validators.required],
    authorityScope: ['', [Validators.required, Validators.maxLength(2000)]],
    isPrimaryOwner: [false],
    effectiveFrom: [new Date().toISOString().slice(0, 10), Validators.required],
    effectiveTo: [''],
    activateImmediately: [true],
  });
  readonly editForm = this.fb.nonNullable.group({
    userId: [''],
    authorityScope: ['', [Validators.required, Validators.maxLength(2000)]],
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
  });
  readonly actionForm = this.fb.nonNullable.group({ reason: [''], effectiveTo: [''] });
  readonly types = Object.values(OrganizationRepresentativeType).filter(
    (v) => typeof v === 'number',
  ) as OrganizationRepresentativeType[];
  constructor() {
    if (!this.organizationId) {
      void this.router.navigate(['/organizations']);
      return;
    }
    this.load();
  }
  select(x: OrganizationRepresentativeListItem) {
    this.api
      .getById(this.organizationId, x.id)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (v) => {
          this.selected.set(v);
          this.mode.set('view');
        },
        error: (e) => this.show(e),
      });
  }
  openCreate() {
    this.mode.set('create');
  }
  openEdit() {
    const x = this.selected();
    if (!x) return;
    this.editForm.reset({
      userId: x.userId ?? '',
      authorityScope: x.authorityScope,
      effectiveFrom: x.effectiveFrom,
      effectiveTo: x.effectiveTo ?? '',
    });
    this.mode.set('edit');
  }
  request(a: 'activate' | 'suspend' | 'reactivate' | 'end' | 'primary') {
    this.action.set(a);
    this.actionForm.reset({ reason: '', effectiveTo: new Date().toISOString().slice(0, 10) });
    this.mode.set('action');
  }
  cancel() {
    if (!this.saving()) {
      this.mode.set('view');
      this.action.set(null);
    }
  }
  submitCreate() {
    if (this.createForm.invalid || this.saving()) {
      this.createForm.markAllAsTouched();
      return;
    }
    const v = this.createForm.getRawValue();
    this.saving.set(true);
    this.api
      .create(this.organizationId, {
        ...v,
        personId: v.personId.trim(),
        userId: v.userId.trim() || null,
        authorityScope: v.authorityScope.trim(),
        effectiveTo: v.effectiveTo || null,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (r) => this.done(r.id, 'organizations.representatives.messages.created'),
        error: (e) => this.fail(e),
      });
  }
  submitEdit() {
    const x = this.selected();
    if (!x || this.editForm.invalid || this.saving()) return;
    const v = this.editForm.getRawValue();
    this.saving.set(true);
    this.api
      .updateAuthority(this.organizationId, x.id, {
        userId: v.userId.trim() || null,
        authorityScope: v.authorityScope.trim(),
        effectiveFrom: v.effectiveFrom,
        effectiveTo: v.effectiveTo || null,
        expectedRevision: x.revision,
      })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: () => this.done(x.id, 'organizations.representatives.messages.updated'),
        error: (e) => this.fail(e),
      });
  }
  confirm() {
    const x = this.selected(),
      a = this.action();
    if (!x || !a || this.saving()) return;
    const f = this.actionForm.getRawValue();
    if ((a === 'suspend' || a === 'reactivate' || a === 'end') && !f.reason.trim()) {
      this.toast.error(
        this.tr.instant('errors.title'),
        this.tr.instant('organizations.representatives.validation.reasonRequired'),
      );
      return;
    }
    this.saving.set(true);
    const op =
      a === 'activate'
        ? this.api.activate(this.organizationId, x.id, { expectedRevision: x.revision })
        : a === 'suspend'
          ? this.api.suspend(this.organizationId, x.id, {
              reason: f.reason.trim(),
              expectedRevision: x.revision,
            })
          : a === 'reactivate'
            ? this.api.reactivate(this.organizationId, x.id, {
                reason: f.reason.trim(),
                expectedRevision: x.revision,
              })
            : a === 'end'
              ? this.api.end(this.organizationId, x.id, {
                  reason: f.reason.trim(),
                  effectiveTo: f.effectiveTo,
                  expectedRevision: x.revision,
                })
              : this.api.setPrimaryOwner(this.organizationId, x.id, {
                  expectedRevision: x.revision,
                });
    op.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => this.done(x.id, `organizations.representatives.messages.${a}`),
      error: (e) => this.fail(e),
    });
  }
  typeLabel(v: OrganizationRepresentativeType) {
    return `organizations.representatives.types.${OrganizationRepresentativeType[v]}`;
  }
  statusLabel(v: OrganizationRepresentativeStatus) {
    return `organizations.representatives.status.${OrganizationRepresentativeStatus[v]}`;
  }
  statusVariant(v: OrganizationRepresentativeStatus): 'success' | 'warning' | 'neutral' {
    return v === OrganizationRepresentativeStatus.Active
      ? 'success'
      : v === OrganizationRepresentativeStatus.Suspended
        ? 'warning'
        : 'neutral';
  }
  private load(id: string | null = null) {
    this.loading.set(true);
    this.api
      .getAll(this.organizationId, null)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (xs) => {
          this.items.set(xs);
          this.loading.set(false);
          const found = xs.find((i) => i.id === (id ?? this.selected()?.id)) ?? xs[0];
          found ? this.select(found) : this.selected.set(null);
        },
        error: (e) => {
          this.loading.set(false);
          this.show(e);
        },
      });
  }
  private done(id: string, key: string) {
    this.saving.set(false);
    this.mode.set('view');
    this.action.set(null);
    this.toast.success(this.tr.instant(key));
    this.load(id);
  }
  private fail(e: HttpErrorResponse) {
    this.saving.set(false);
    if (e.status === 409) {
      this.toast.warning(
        this.tr.instant('errors.title'),
        this.tr.instant('organizations.representatives.messages.conflict'),
      );
      this.load(this.selected()?.id ?? null);
      return;
    }
    this.show(e);
  }
  private show(e: HttpErrorResponse) {
    for (const m of this.errors.getMessages(e))
      this.toast.error(this.tr.instant('errors.title'), m);
  }
}
