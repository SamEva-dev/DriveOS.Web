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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, Observable } from 'rxjs';
import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import { OrganizationLegalProfileApiService } from '../../data-access/organization-legal-profile-api.service';
import { ORGANIZATION_LEGAL_PROFILE_PERMISSIONS } from '../../domain/organization-legal-profile-permissions';
import {
  ORGANIZATION_LEGAL_FORMS,
  OrganizationLegalForm,
  OrganizationLegalProfile,
} from '../../models/organization-legal-profile.model';

@Component({
  selector: 'driveos-organization-legal-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-legal-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationLegalProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(OrganizationLegalProfileApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly backLink = this.resolveBackLink();
  readonly legalForms = ORGANIZATION_LEGAL_FORMS;
  readonly profile = signal<OrganizationLegalProfile | null>(null);
  readonly isLoading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly changingStatus = signal(false);

  readonly canCreate = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_LEGAL_PROFILE_PERMISSIONS.create),
  );
  readonly canUpdate = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_LEGAL_PROFILE_PERMISSIONS.update),
  );
  readonly canActivate = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_LEGAL_PROFILE_PERMISSIONS.activate),
  );
  readonly canArchive = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_LEGAL_PROFILE_PERMISSIONS.archive),
  );
  readonly isReadOnly = computed(() => this.profile()?.status === 'Archived');

  readonly form = new FormGroup({
    legalForm: new FormControl<OrganizationLegalForm>('LimitedLiabilityCompany', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    registrationNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    taxNumber: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    tradeName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    incorporationDate: new FormControl('', { nonNullable: true }),
    addressLine1: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(250)],
    }),
    addressLine2: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(250)],
    }),
    postalCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    region: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    countryCode: new FormControl('FR', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)],
    }),
    activateImmediately: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    if (!this.organizationId) {
      this.isLoading.set(false);
      this.loadFailed.set(true);
      void this.router.navigate(['/organizations']);
      return;
    }
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.api
      .get(this.organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.patchForm(profile);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          if (error.status === 404) {
            this.profile.set(null);
            return;
          }
          this.loadFailed.set(true);
          this.showErrors(error);
        },
      });
  }

  save(): void {
    if (this.form.invalid || this.saving() || this.isReadOnly()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const current = this.profile();
    this.saving.set(true);

    const request$: Observable<unknown> = current
      ? this.api.update(this.organizationId, {
          legalForm: value.legalForm,
          registrationNumber: value.registrationNumber.trim(),
          taxNumber: this.nullIfBlank(value.taxNumber),
          tradeName: this.nullIfBlank(value.tradeName),
          incorporationDate: this.nullIfBlank(value.incorporationDate),
          addressLine1: value.addressLine1.trim(),
          addressLine2: this.nullIfBlank(value.addressLine2),
          postalCode: value.postalCode.trim(),
          city: value.city.trim(),
          region: this.nullIfBlank(value.region),
          countryCode: value.countryCode.trim().toUpperCase(),
          expectedRevision: current.revision,
        })
      : this.api.create(this.organizationId, {
          legalForm: value.legalForm,
          registrationNumber: value.registrationNumber.trim(),
          taxNumber: this.nullIfBlank(value.taxNumber),
          tradeName: this.nullIfBlank(value.tradeName),
          incorporationDate: this.nullIfBlank(value.incorporationDate),
          addressLine1: value.addressLine1.trim(),
          addressLine2: this.nullIfBlank(value.addressLine2),
          postalCode: value.postalCode.trim(),
          city: value.city.trim(),
          region: this.nullIfBlank(value.region),
          countryCode: value.countryCode.trim().toUpperCase(),
          activateImmediately: value.activateImmediately,
        });

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant(
              current
                ? 'organizations.legalProfile.messages.updated'
                : 'organizations.legalProfile.messages.created',
            ),
          );
          this.load();
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  activate(): void {
    const current = this.profile();
    if (!current || current.status !== 'Draft' || !this.canActivate() || this.changingStatus())
      return;
    this.changeStatus('activate', current.revision);
  }

  archive(): void {
    const current = this.profile();
    if (!current || current.status === 'Archived' || !this.canArchive() || this.changingStatus())
      return;
    if (!window.confirm(this.translate.instant('organizations.legalProfile.confirmArchive')))
      return;
    this.changeStatus('archive', current.revision);
  }

  statusBadgeVariant(
    status: OrganizationLegalProfile['status'],
  ): 'neutral' | 'success' | 'warning' {
    if (status === 'Active') return 'success';
    if (status === 'Archived') return 'neutral';
    return 'warning';
  }

  private changeStatus(action: 'activate' | 'archive', revision: number): void {
    this.changingStatus.set(true);
    const request$ =
      action === 'activate'
        ? this.api.activate(this.organizationId, { expectedRevision: revision })
        : this.api.archive(this.organizationId, { expectedRevision: revision });

    request$
      .pipe(
        finalize(() => this.changingStatus.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant(`organizations.legalProfile.messages.${action}d`),
          );
          this.load();
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  private patchForm(profile: OrganizationLegalProfile): void {
    this.form.patchValue({
      legalForm: profile.legalForm,
      registrationNumber: profile.registrationNumber,
      taxNumber: profile.taxNumber ?? '',
      tradeName: profile.tradeName ?? '',
      incorporationDate: profile.incorporationDate ?? '',
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2 ?? '',
      postalCode: profile.postalCode,
      city: profile.city,
      region: profile.region ?? '',
      countryCode: profile.countryCode,
      activateImmediately: false,
    });

    if (profile.status === 'Archived') this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }

  private handleMutationError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.toast.warning(
        this.translate.instant('organizations.legalProfile.messages.conflictTitle'),
        this.translate.instant('organizations.legalProfile.messages.conflictDescription'),
      );
      this.load();
      return;
    }
    this.showErrors(error);
  }

  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) {
      this.toast.error(this.translate.instant('errors.title'), message);
    }
  }

  private nullIfBlank(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private resolveBackLink(): readonly string[] {
    const readinessUrl = `/organizations/${this.organizationId}/activation-readiness`;
    return this.route.snapshot.queryParamMap.get('returnUrl') === readinessUrl
      ? ['/organizations', this.organizationId, 'activation-readiness']
      : ['/organizations', this.organizationId];
  }
}
