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
import { finalize, forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import { BranchesApiService } from '../../../branches/data-access/branches-api.service';
import { BranchListItem } from '../../../branches/models/branch-list-item';
import { OrganizationsApiService } from '../../../data-access/organizations-api.service';
import { Organization } from '../../../models/organization.model';
import { OrganizationSettingsApiService } from '../../data-access/organization-settings-api.service';
import { ORGANIZATION_SETTINGS_PERMISSIONS } from '../../domain/organization-settings-permissions';
import { MeasurementSystem, OrganizationSettings } from '../../models/organization-settings.model';

@Component({
  selector: 'driveos-organization-settings-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-settings.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSettingsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly settingsApi = inject(OrganizationSettingsApiService);
  private readonly organizationsApi = inject(OrganizationsApiService);
  private readonly branchesApi = inject(BranchesApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';
  readonly backLink = this.resolveBackLink();
  readonly organization = signal<Organization | null>(null);
  readonly settings = signal<OrganizationSettings | null>(null);
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly isLoading = signal(true);
  readonly loadFailed = signal(false);
  readonly settingsMissing = signal(false);
  readonly savingSection = signal<string | null>(null);
  readonly initializing = signal(false);

  readonly canCreate = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_SETTINGS_PERMISSIONS.create),
  );
  readonly canUpdate = computed(() =>
    this.authorization.hasPermission(ORGANIZATION_SETTINGS_PERMISSIONS.update),
  );

  readonly profileForm = new FormGroup({
    tradeName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    registrationNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    taxNumber: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
  });

  readonly contactForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email, Validators.maxLength(320)],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(40)] }),
    website: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
  });

  readonly addressForm = new FormGroup({
    addressLine1: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(250)],
    }),
    addressLine2: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(250)],
    }),
    postalCode: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    region: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] }),
    addressCountryCode: new FormControl('FR', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)],
    }),
  });

  readonly regionalForm = new FormGroup({
    defaultLanguage: new FormControl('fr', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supportedLanguagesText: new FormControl('fr', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    timeZoneId: new FormControl('Europe/Paris', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    currencyCode: new FormControl('EUR', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)],
    }),
    dateFormat: new FormControl('dd/MM/yyyy', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    timeFormat: new FormControl('HH:mm', { nonNullable: true, validators: [Validators.required] }),
    firstDayOfWeek: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(6)],
    }),
    measurementSystem: new FormControl<MeasurementSystem>(1, { nonNullable: true }),
  });

  readonly operationalForm = new FormGroup({
    defaultSessionDurationMinutes: new FormControl(60, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(15), Validators.max(480)],
    }),
    defaultBookingLeadTimeMinutes: new FormControl(60, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    defaultCancellationDelayHours: new FormControl(24, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    allowStudentSelfBooking: new FormControl(false, { nonNullable: true }),
    requireBranchForOperations: new FormControl(true, { nonNullable: true }),
    defaultBranchId: new FormControl<string | null>(null),
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

    forkJoin({
      organization: this.organizationsApi.getById(this.organizationId),
      branches: this.branchesApi.getPaged(this.organizationId, {
        pageNumber: 1,
        pageSize: 100,
        search: '',
        sortBy: 'name',
        sortDirection: 'asc',
      }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ organization, branches }) => {
          this.organization.set(organization);
          this.branches.set(branches.items);
          this.loadSettings();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.loadFailed.set(true);
          this.showErrors(error);
        },
      });
  }

  initialize(): void {
    const organization = this.organization();
    if (!organization || !this.canCreate() || this.initializing()) return;

    const countryCode = organization.countryCode.toUpperCase();
    const defaultBranch =
      this.branches().find((branch) => branch.isPrimary) ?? this.branches()[0] ?? null;
    this.initializing.set(true);

    this.settingsApi
      .create(this.organizationId, {
        tradeName: null,
        registrationNumber: null,
        taxNumber: null,
        email: null,
        phone: null,
        website: null,
        addressLine1: null,
        addressLine2: null,
        postalCode: null,
        city: null,
        region: null,
        addressCountryCode: countryCode,
        defaultLanguage: 'fr',
        supportedLanguages: ['fr', 'en'],
        timeZoneId: 'Europe/Paris',
        currencyCode: 'EUR',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        firstDayOfWeek: 1,
        measurementSystem: 1,
        defaultSessionDurationMinutes: 60,
        defaultBookingLeadTimeMinutes: 60,
        defaultCancellationDelayHours: 24,
        allowStudentSelfBooking: false,
        requireBranchForOperations: defaultBranch !== null,
        defaultBranchId: defaultBranch?.id ?? null,
      })
      .pipe(
        finalize(() => this.initializing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant('organizations.settings.notifications.created'),
          );
          this.loadSettings();
        },
        error: (error: HttpErrorResponse) => this.showErrors(error),
      });
  }

  saveProfile(): void {
    if (!this.prepareSave(this.profileForm, 'profile')) return;
    const value = this.profileForm.getRawValue();
    this.settingsApi
      .updateProfile(this.organizationId, {
        tradeName: this.nullIfBlank(value.tradeName),
        registrationNumber: this.nullIfBlank(value.registrationNumber),
        taxNumber: this.nullIfBlank(value.taxNumber),
        expectedVersion: this.currentVersion(),
      })
      .pipe(
        finalize(() => this.savingSection.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.afterSave(), error: (error) => this.showErrors(error) });
  }

  saveContact(): void {
    if (!this.prepareSave(this.contactForm, 'contact')) return;
    const value = this.contactForm.getRawValue();
    this.settingsApi
      .updateContact(this.organizationId, {
        email: this.nullIfBlank(value.email),
        phone: this.nullIfBlank(value.phone),
        website: this.nullIfBlank(value.website),
        expectedVersion: this.currentVersion(),
      })
      .pipe(
        finalize(() => this.savingSection.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.afterSave(), error: (error) => this.showErrors(error) });
  }

  saveAddress(): void {
    if (!this.prepareSave(this.addressForm, 'address')) return;
    const value = this.addressForm.getRawValue();
    this.settingsApi
      .updateAddress(this.organizationId, {
        addressLine1: this.nullIfBlank(value.addressLine1),
        addressLine2: this.nullIfBlank(value.addressLine2),
        postalCode: this.nullIfBlank(value.postalCode),
        city: this.nullIfBlank(value.city),
        region: this.nullIfBlank(value.region),
        addressCountryCode: value.addressCountryCode.trim().toUpperCase(),
        expectedVersion: this.currentVersion(),
      })
      .pipe(
        finalize(() => this.savingSection.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.afterSave(), error: (error) => this.showErrors(error) });
  }

  saveRegional(): void {
    if (!this.prepareSave(this.regionalForm, 'regional')) return;
    const value = this.regionalForm.getRawValue();
    const supportedLanguages = this.parseLanguages(value.supportedLanguagesText);
    if (!supportedLanguages.includes(value.defaultLanguage.trim().toLowerCase())) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.settings.errors.defaultLanguageNotSupported'),
      );
      this.savingSection.set(null);
      return;
    }
    this.settingsApi
      .updateRegional(this.organizationId, {
        defaultLanguage: value.defaultLanguage.trim().toLowerCase(),
        supportedLanguages,
        timeZoneId: value.timeZoneId.trim(),
        currencyCode: value.currencyCode.trim().toUpperCase(),
        dateFormat: value.dateFormat.trim(),
        timeFormat: value.timeFormat.trim(),
        firstDayOfWeek: Number(value.firstDayOfWeek),
        measurementSystem: Number(value.measurementSystem) as MeasurementSystem,
        expectedVersion: this.currentVersion(),
      })
      .pipe(
        finalize(() => this.savingSection.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.afterSave(), error: (error) => this.showErrors(error) });
  }

  saveOperational(): void {
    if (!this.prepareSave(this.operationalForm, 'operational')) return;
    const value = this.operationalForm.getRawValue();
    if (value.requireBranchForOperations && !value.defaultBranchId) {
      this.toast.error(
        this.translate.instant('errors.title'),
        this.translate.instant('organizations.settings.errors.defaultBranchRequired'),
      );
      this.savingSection.set(null);
      return;
    }
    this.settingsApi
      .updateOperational(this.organizationId, {
        defaultSessionDurationMinutes: Number(value.defaultSessionDurationMinutes),
        defaultBookingLeadTimeMinutes: Number(value.defaultBookingLeadTimeMinutes),
        defaultCancellationDelayHours: Number(value.defaultCancellationDelayHours),
        allowStudentSelfBooking: value.allowStudentSelfBooking,
        requireBranchForOperations: value.requireBranchForOperations,
        defaultBranchId: value.defaultBranchId || null,
        expectedVersion: this.currentVersion(),
      })
      .pipe(
        finalize(() => this.savingSection.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.afterSave(), error: (error) => this.showErrors(error) });
  }

  private loadSettings(): void {
    this.settingsApi
      .get(this.organizationId)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (settings) => {
          this.settingsMissing.set(false);
          this.settings.set(settings);
          this.patchForms(settings);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.settingsMissing.set(true);
            return;
          }
          this.loadFailed.set(true);
          this.showErrors(error);
        },
      });
  }

  private patchForms(settings: OrganizationSettings): void {
    this.profileForm.reset({
      tradeName: settings.tradeName ?? '',
      registrationNumber: settings.registrationNumber ?? '',
      taxNumber: settings.taxNumber ?? '',
    });
    this.contactForm.reset({
      email: settings.email ?? '',
      phone: settings.phone ?? '',
      website: settings.website ?? '',
    });
    this.addressForm.reset({
      addressLine1: settings.addressLine1 ?? '',
      addressLine2: settings.addressLine2 ?? '',
      postalCode: settings.postalCode ?? '',
      city: settings.city ?? '',
      region: settings.region ?? '',
      addressCountryCode: settings.addressCountryCode,
    });
    this.regionalForm.reset({
      defaultLanguage: settings.defaultLanguage,
      supportedLanguagesText: settings.supportedLanguages.join(', '),
      timeZoneId: settings.timeZoneId,
      currencyCode: settings.currencyCode,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      firstDayOfWeek: settings.firstDayOfWeek,
      measurementSystem: settings.measurementSystem,
    });
    this.operationalForm.reset({
      defaultSessionDurationMinutes: settings.defaultSessionDurationMinutes,
      defaultBookingLeadTimeMinutes: settings.defaultBookingLeadTimeMinutes,
      defaultCancellationDelayHours: settings.defaultCancellationDelayHours,
      allowStudentSelfBooking: settings.allowStudentSelfBooking,
      requireBranchForOperations: settings.requireBranchForOperations,
      defaultBranchId: settings.defaultBranchId,
    });
    this.markAllPristine();
  }

  private prepareSave(form: FormGroup, section: string): boolean {
    if (!this.canUpdate() || this.savingSection() !== null || !this.settings()) return false;
    form.markAllAsTouched();
    if (form.invalid) return false;
    this.savingSection.set(section);
    return true;
  }

  private afterSave(): void {
    this.toast.success(this.translate.instant('organizations.settings.notifications.updated'));
    this.loadSettings();
  }

  private currentVersion(): number {
    return this.settings()?.version ?? 0;
  }
  private nullIfBlank(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }
  private parseLanguages(value: string): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }
  private markAllPristine(): void {
    [
      this.profileForm,
      this.contactForm,
      this.addressForm,
      this.regionalForm,
      this.operationalForm,
    ].forEach((form) => form.markAsPristine());
  }
  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.apiErrorService.getMessages(error))
      this.toast.error(this.translate.instant('errors.title'), message);
  }

  private resolveBackLink(): readonly string[] {
    const readinessUrl = `/organizations/${this.organizationId}/activation-readiness`;
    return this.route.snapshot.queryParamMap.get('returnUrl') === readinessUrl
      ? ['/organizations', this.organizationId, 'activation-readiness']
      : ['/organizations', this.organizationId];
  }
}
