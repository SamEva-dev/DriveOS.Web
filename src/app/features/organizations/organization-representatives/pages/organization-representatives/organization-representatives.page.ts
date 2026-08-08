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
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { AuthUsersApiService } from '../../../../../core/auth/data-access/auth-users-api.service';
import { AuthUser, authUserDisplayName } from '../../../../../core/auth/models/auth-user.model';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsToastService,
  DriveOsAuthUserPickerComponent,
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
    DriveOsAuthUserPickerComponent,
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
  private readonly authUsers = inject(AuthUsersApiService);
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
  readonly createUser = signal<AuthUser | null>(null);
  readonly representativeUsers = signal<Readonly<Record<string, AuthUser>>>({});
  readonly canCreate = computed(() => this.auth.hasPermission(p.create));
  readonly canUpdate = computed(() => this.auth.hasPermission(p.update));
  readonly canActivate = computed(() => this.auth.hasPermission(p.activate));
  readonly canSuspend = computed(() => this.auth.hasPermission(p.suspend));
  readonly canReactivate = computed(() => this.auth.hasPermission(p.reactivate));
  readonly canEnd = computed(() => this.auth.hasPermission(p.end));
  readonly canPrimary = computed(() => this.auth.hasPermission(p.setPrimaryOwner));
  readonly createForm = this.fb.nonNullable.group({
    representativeType: [OrganizationRepresentativeType.Owner, Validators.required],
    authorityScope: ['', [Validators.required, Validators.maxLength(2000)]],
    isPrimaryOwner: [false],
    effectiveFrom: [new Date().toISOString().slice(0, 10), Validators.required],
    effectiveTo: [''],
    activateImmediately: [true],
  }, { validators: [OrganizationRepresentativesPage.dateRangeValidator] });
  readonly editForm = this.fb.nonNullable.group({
    userId: [''],
    authorityScope: ['', [Validators.required, Validators.maxLength(2000)]],
    effectiveFrom: ['', Validators.required],
    effectiveTo: [''],
  });
  readonly actionForm = this.fb.nonNullable.group({ reason: [''], effectiveTo: [''] });
  readonly totalCount = computed(() => this.items().length);
  readonly activeCount = computed(() => this.items().filter((x) => x.status === OrganizationRepresentativeStatus.Active).length);
  readonly ownerCount = computed(() => this.items().filter((x) => x.representativeType === OrganizationRepresentativeType.Owner).length);
  readonly hasPrimaryOwner = computed(() => this.items().some((x) => x.isPrimaryOwner && x.status === OrganizationRepresentativeStatus.Active));

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
    this.selected.set(null);
    this.createUser.set(null);
    this.createForm.reset({
      representativeType: OrganizationRepresentativeType.Owner,
      authorityScope: '',
      isPrimaryOwner: false,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: '',
      activateImmediately: true,
    });
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
    if (this.saving()) return;

    if (this.createForm.invalid || !this.createUser()) {
      this.createForm.markAllAsTouched();
      this.toast.warning(
        this.tr.instant('organizations.representatives.validation.formInvalidTitle'),
        !this.createUser()
          ? this.tr.instant('organizations.representatives.validation.userRequired')
          : this.tr.instant('organizations.representatives.validation.formInvalid'),
      );
      return;
    }
    const v = this.createForm.getRawValue();
    const user = this.createUser()!;
    this.saving.set(true);
    this.api
      .create(this.organizationId, {
        personId: null,
        userId: user.id,
        representativeType: v.representativeType,
        authorityScope: v.authorityScope.trim(),
        isPrimaryOwner: v.isPrimaryOwner,
        effectiveFrom: v.effectiveFrom,
        effectiveTo: v.effectiveTo || null,
        activateImmediately: v.activateImmediately,
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
  onCreateUserSelected(user: AuthUser | null): void {
    this.createUser.set(user);
  }

  representativeDisplayName(item: OrganizationRepresentativeListItem): string {
    if (!item.userId) return this.tr.instant('organizations.representatives.personWithoutAccount');
    const user = this.representativeUsers()[item.userId];
    return user ? authUserDisplayName(user) : this.tr.instant('organizations.representatives.loadingIdentity');
  }

  representativeEmail(item: OrganizationRepresentativeListItem): string {
    if (!item.userId) return '';
    return this.representativeUsers()[item.userId]?.email ?? '';
  }

  typeLabel(v: OrganizationRepresentativeType) {
    return `organizations.representatives.types.${OrganizationRepresentativeType[v]}`;
  }
  statusLabel(v: OrganizationRepresentativeStatus) {
    return `organizations.representatives.status.${OrganizationRepresentativeStatus[v]}`;
  }
  isInvalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  representativeInitials(item: OrganizationRepresentativeListItem): string {
    return this.typeLabel(item.representativeType).split('.').at(-1)?.slice(0, 2).toUpperCase() ?? 'RP';
  }

  statusVariant(v: OrganizationRepresentativeStatus): 'success' | 'warning' | 'neutral' {
    return v === OrganizationRepresentativeStatus.Active
      ? 'success'
      : v === OrganizationRepresentativeStatus.Suspended
        ? 'warning'
        : 'neutral';
  }
  private static dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const from = control.get('effectiveFrom')?.value as string | undefined;
    const to = control.get('effectiveTo')?.value as string | undefined;
    if (!from || !to) return null;
    return to >= from ? null : { invalidDateRange: true };
  }

  private load(id: string | null = null) {
    this.loading.set(true);
    this.api
      .getAll(this.organizationId, null)
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({
        next: (xs) => {
          this.items.set(xs);
          this.hydrateRepresentativeUsers(xs);
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
  private hydrateRepresentativeUsers(items: readonly OrganizationRepresentativeListItem[]): void {
    const ids = [...new Set(items.map((item) => item.userId).filter((id): id is string => Boolean(id)))];
    for (const userId of ids) {
      if (this.representativeUsers()[userId]) continue;
      this.authUsers
        .getById(userId)
        .pipe(takeUntilDestroyed(this.destroy))
        .subscribe({
          next: (user) => this.representativeUsers.update((current) => ({ ...current, [user.id]: user })),
          error: () => undefined,
        });
    }
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
