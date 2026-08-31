import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import {
  ProfessionalEngagementType,
  ProfessionalOpportunity,
  ProfessionalRateUnit,
  ProfessionalType,
  ProfessionalVehicleProvisionMode,
} from '../../models/professional-opportunity.model';
import { ProfessionalMatchResult } from '../../models/professional-matching.model';
import { ProfessionalApplication } from '../../models/professional-application.model';
import { ProfessionalApplicationDrawerComponent } from '../professional-application-drawer/professional-application-drawer.component';

@Component({
  selector: 'driveos-professional-opportunity-drawer',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    DriveOsDrawerComponent,
    ProfessionalApplicationDrawerComponent,
  ],
  templateUrl: './professional-opportunity-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalOpportunityDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly authService = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly opportunity = input<ProfessionalOpportunity | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();

  readonly saving = signal(false);
  readonly actionBusy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly cancelMode = signal(false);
  readonly detailTab = signal<'details' | 'matching' | 'applications'>('details');
  readonly applicationsLoading = signal(false);
  readonly applicationsLoaded = signal(false);
  readonly applicationsError = signal(false);
  readonly applications = signal<readonly ProfessionalApplication[]>([]);
  readonly selectedApplication = signal<ProfessionalApplication | null>(null);
  readonly applicationDrawerOpen = signal(false);
  readonly matchingLoading = signal(false);
  readonly matchingLoaded = signal(false);
  readonly matchingError = signal(false);
  readonly matches = signal<readonly ProfessionalMatchResult[]>([]);
  cancelReason = '';

  branchId = '';
  title = '';
  description = '';
  professionalType: ProfessionalType = 'DrivingInstructor';
  teachingCategoryCodes = 'B';
  requiredLanguageCodes = '';
  requiredSpecializationCodes = '';
  countryCode = 'FR';
  areaCode = '';
  areaDisplayName = '';
  radiusKm: number | null = null;
  startsOn = this.today();
  endsOn = this.plusDays(30);
  estimatedMinutes: number | null = null;
  engagementType: ProfessionalEngagementType = 'HourlyService';
  vehicleProvisionMode: ProfessionalVehicleProvisionMode = 'Either';
  budgetMin: number | null = null;
  budgetMax: number | null = null;
  currency = 'EUR';
  budgetUnit: ProfessionalRateUnit = 'Hour';
  budgetNegotiable = true;

  readonly organizationId = computed(() => this.authService.user()?.organizationId ?? '');
  readonly isCreateMode = computed(() => !this.opportunity());
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.create),
  );
  readonly canPublish = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.publish),
  );
  readonly canPause = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.pause),
  );
  readonly canClose = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.close),
  );
  readonly canCancel = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.cancel),
  );
  readonly canReadMatching = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.matching.read),
  );
  readonly canRunMatching = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.matching.run),
  );
  readonly canExplainMatching = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.matching.explain),
  );
  readonly canReadApplications = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.applications.read),
  );

  readonly professionalTypes: readonly ProfessionalType[] = [
    'DrivingInstructor',
    'InstructorTrainer',
    'AdministrativeContractor',
    'ComplianceConsultant',
    'Other',
  ];
  readonly engagementTypes: readonly ProfessionalEngagementType[] = [
    'HourlyService',
    'HalfDay',
    'FullDay',
    'FixedMission',
    'RecurringMission',
    'Replacement',
    'Negotiable',
  ];
  readonly vehicleModes: readonly ProfessionalVehicleProvisionMode[] = [
    'NotApplicable',
    'ClientProvided',
    'ProfessionalProvided',
    'Either',
  ];
  readonly rateUnits: readonly ProfessionalRateUnit[] = [
    'Hour',
    'HalfDay',
    'Day',
    'Session',
    'Mission',
  ];

  setDetailTab(tab: 'details' | 'matching' | 'applications'): void {
    this.detailTab.set(tab);
    if (tab === 'matching' && !this.matchingLoaded() && !this.matchingLoading())
      this.loadMatching();
    if (tab === 'applications' && !this.applicationsLoaded() && !this.applicationsLoading())
      this.loadApplications();
  }

  loadApplications(force = false): void {
    const item = this.opportunity(),
      org = this.organizationId();
    if (!item || !org || !this.canReadApplications()) return;
    if (this.applicationsLoaded() && !force) return;
    this.applicationsLoading.set(true);
    this.applicationsError.set(false);
    this.api.listProfessionalApplications(org, item.id).subscribe({
      next: (x) => {
        this.applications.set(x);
        this.applicationsLoaded.set(true);
        this.applicationsLoading.set(false);
      },
      error: () => {
        this.applicationsError.set(true);
        this.applicationsLoading.set(false);
      },
    });
  }
  openApplication(item: ProfessionalApplication): void {
    this.selectedApplication.set(item);
    this.applicationDrawerOpen.set(true);
  }
  closeApplication(): void {
    this.applicationDrawerOpen.set(false);
    this.selectedApplication.set(null);
  }
  applicationChanged(): void {
    this.loadApplications(true);
    this.changed.emit();
  }

  loadMatching(force = false): void {
    const item = this.opportunity();
    const organizationId = this.organizationId();
    if (!item || !organizationId || !this.canRunMatching() || item.status !== 'Published') return;
    if (this.matchingLoaded() && !force) return;
    this.matchingLoading.set(true);
    this.matchingError.set(false);
    this.api.matchProfessionalsForOpportunity(organizationId, item.id, 30).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.matchingLoaded.set(true);
        this.matchingLoading.set(false);
      },
      error: () => {
        this.matchingError.set(true);
        this.matchingLoading.set(false);
      },
    });
  }

  matchScoreWidth(score: number): string {
    return `${Math.max(0, Math.min(100, score))}%`;
  }

  matchingReasonKey(reason: string): string {
    return `professionalMarketplace.matching.reasons.${reason}`;
  }

  close(): void {
    if (this.saving() || this.actionBusy()) return;
    this.reset();
    this.closeRequested.emit();
  }

  create(): void {
    if (!this.canCreate()) return;
    const organizationId = this.organizationId();
    if (!organizationId) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.opportunities.errors.organization'),
      ]);
      return;
    }
    if (
      !this.title.trim() ||
      !this.description.trim() ||
      !this.startsOn ||
      !this.endsOn ||
      !this.countryCode.trim() ||
      !this.csv(this.teachingCategoryCodes).length
    ) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.opportunities.errors.required'),
      ]);
      return;
    }
    this.saving.set(true);
    this.formErrors.set([]);
    this.api
      .createProfessionalOpportunity(organizationId, {
        branchId: this.clean(this.branchId),
        title: this.title.trim(),
        description: this.description.trim(),
        professionalType: this.professionalType,
        teachingCategoryCodes: this.csv(this.teachingCategoryCodes),
        requiredLanguageCodes: this.csv(this.requiredLanguageCodes),
        requiredSpecializationCodes: this.csv(this.requiredSpecializationCodes),
        countryCode: this.countryCode.trim().toUpperCase(),
        areaCode: this.clean(this.areaCode)?.toUpperCase() ?? null,
        areaDisplayName: this.clean(this.areaDisplayName),
        latitude: null,
        longitude: null,
        radiusKm: this.radiusKm,
        startsOn: this.startsOn,
        endsOn: this.endsOn,
        timeWindows: [],
        estimatedMinutes: this.estimatedMinutes,
        engagementType: this.engagementType,
        vehicleProvisionMode: this.vehicleProvisionMode,
        budgetMin: this.budgetMin,
        budgetMax: this.budgetMax,
        currency:
          this.budgetMin !== null || this.budgetMax !== null
            ? this.currency.trim().toUpperCase()
            : null,
        budgetUnit: this.budgetMin !== null || this.budgetMax !== null ? this.budgetUnit : null,
        budgetNegotiable: this.budgetNegotiable,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.changed.emit();
          this.reset();
          this.closeRequested.emit();
        },
        error: (error) => {
          this.formErrors.set(this.errors.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  publish(): void {
    this.mutate('publish');
  }
  pause(): void {
    this.mutate('pause');
  }
  fill(): void {
    this.mutate('fill');
  }

  requestCancel(): void {
    this.cancelMode.set(true);
    this.cancelReason = '';
    this.formErrors.set([]);
  }
  cancelCancellation(): void {
    this.cancelMode.set(false);
    this.cancelReason = '';
  }
  confirmCancel(): void {
    const item = this.opportunity();
    const organizationId = this.organizationId();
    if (!item || !organizationId || !this.cancelReason.trim()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.opportunities.errors.cancelReason'),
      ]);
      return;
    }
    this.actionBusy.set(true);
    this.formErrors.set([]);
    this.api
      .cancelProfessionalOpportunity(organizationId, item.id, this.cancelReason.trim())
      .subscribe({
        next: () => this.afterMutation(),
        error: (error) => {
          this.formErrors.set(this.errors.getMessages(error));
          this.actionBusy.set(false);
        },
      });
  }

  private mutate(action: 'publish' | 'pause' | 'fill'): void {
    const item = this.opportunity();
    const organizationId = this.organizationId();
    if (!item || !organizationId) return;
    this.actionBusy.set(true);
    this.formErrors.set([]);
    const request =
      action === 'publish'
        ? this.api.publishProfessionalOpportunity(organizationId, item.id)
        : action === 'pause'
          ? this.api.pauseProfessionalOpportunity(organizationId, item.id)
          : this.api.fillProfessionalOpportunity(organizationId, item.id);
    request.subscribe({
      next: () => this.afterMutation(),
      error: (error) => {
        this.formErrors.set(this.errors.getMessages(error));
        this.actionBusy.set(false);
      },
    });
  }

  private afterMutation(): void {
    this.actionBusy.set(false);
    this.cancelMode.set(false);
    this.changed.emit();
    this.closeRequested.emit();
  }
  private csv(value: string): string[] {
    return value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  private clean(value: string): string | null {
    const v = value.trim();
    return v ? v : null;
  }
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
  private plusDays(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  private reset(): void {
    this.branchId = '';
    this.title = '';
    this.description = '';
    this.professionalType = 'DrivingInstructor';
    this.teachingCategoryCodes = 'B';
    this.requiredLanguageCodes = '';
    this.requiredSpecializationCodes = '';
    this.countryCode = 'FR';
    this.areaCode = '';
    this.areaDisplayName = '';
    this.radiusKm = null;
    this.startsOn = this.today();
    this.endsOn = this.plusDays(30);
    this.estimatedMinutes = null;
    this.engagementType = 'HourlyService';
    this.vehicleProvisionMode = 'Either';
    this.budgetMin = null;
    this.budgetMax = null;
    this.currency = 'EUR';
    this.budgetUnit = 'Hour';
    this.budgetNegotiable = true;
    this.cancelMode.set(false);
    this.cancelReason = '';
    this.formErrors.set([]);
    this.detailTab.set('details');
    this.matches.set([]);
    this.matchingLoaded.set(false);
    this.matchingLoading.set(false);
    this.matchingError.set(false);
    this.applications.set([]);
    this.applicationsLoaded.set(false);
    this.applicationsLoading.set(false);
    this.applicationsError.set(false);
    this.closeApplication();
  }
}
