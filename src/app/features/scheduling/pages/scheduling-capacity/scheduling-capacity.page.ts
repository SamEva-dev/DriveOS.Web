import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  CalendarResource,
  CapacityDaily,
  CapacityDimension,
  CapacityForecast,
  CapacityScenarioRequest,
  CapacityScenarioResponse,
} from '../../models/scheduling.models';

type CapacityTab = 'overview' | 'resources' | 'scenarios' | 'methodology';

interface HorizonOption {
  readonly value: number;
  readonly key: string;
}
interface ScenarioOption {
  readonly value: number;
  readonly key: string;
  readonly icon: string;
}

@Component({
  selector: 'driveos-scheduling-capacity-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    PercentPipe,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-capacity.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingCapacityPage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);

  readonly tab = signal<CapacityTab>('overview');
  readonly loading = signal(false);
  readonly scenarioLoading = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly forecast = signal<CapacityForecast | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly selectedHorizon = signal(1);
  readonly selectedBranchId = signal('');
  readonly scenarioDrawerOpen = signal(false);
  readonly scenarioResult = signal<CapacityScenarioResponse | null>(null);
  readonly scenarioType = signal(1);
  readonly scenarioQuantity = signal(1);
  readonly scenarioHoursPerWeek = signal(35);
  readonly scenarioAssumption = signal('');

  readonly horizons: readonly HorizonOption[] = [
    { value: 1, key: 'scheduling.capacity.horizons.days7' },
    { value: 2, key: 'scheduling.capacity.horizons.days30' },
    { value: 3, key: 'scheduling.capacity.horizons.days90' },
    { value: 4, key: 'scheduling.capacity.horizons.months6' },
    { value: 5, key: 'scheduling.capacity.horizons.months12' },
  ];

  readonly scenarios: readonly ScenarioOption[] = [
    {
      value: 1,
      key: 'scheduling.capacity.scenario.types.recruitInstructor',
      icon: 'ph ph-user-plus',
    },
    { value: 2, key: 'scheduling.capacity.scenario.types.addVehicle', icon: 'ph ph-car-profile' },
    { value: 3, key: 'scheduling.capacity.scenario.types.extendHours', icon: 'ph ph-clock-plus' },
    { value: 4, key: 'scheduling.capacity.scenario.types.freelancers', icon: 'ph ph-briefcase' },
    { value: 5, key: 'scheduling.capacity.scenario.types.partner', icon: 'ph ph-handshake' },
    { value: 6, key: 'scheduling.capacity.scenario.types.openBranch', icon: 'ph ph-buildings' },
  ];

  readonly canRead = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.capacity.read),
  );
  readonly canForecast = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.capacity.forecast),
  );
  readonly canSimulate = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.capacity.scenarios),
  );
  readonly branches = computed(() =>
    this.resources().filter((x) => this.resourceType(x) === 'Branch'),
  );
  readonly summary = computed(() => this.forecast()?.summary ?? null);
  readonly criticalResources = computed(() =>
    (this.forecast()?.byResource ?? []).filter((x) => x.saturationRatePercent >= 85).slice(0, 8),
  );
  readonly underusedResources = computed(() =>
    (this.forecast()?.byResource ?? [])
      .filter((x) => x.netAvailableHours > 0 && x.saturationRatePercent <= 35)
      .slice(0, 8),
  );
  readonly scenarioImprovement = computed(() => {
    const result = this.scenarioResult();
    if (!result) return null;
    return (
      result.baseline.summary.saturationRatePercent - result.simulatedSummary.saturationRatePercent
    );
  });

  readonly demandPolyline = computed(() =>
    this.polyline(this.forecast()?.daily ?? [], (x) => x.estimatedDemandHours),
  );
  readonly capacityPolyline = computed(() =>
    this.polyline(this.forecast()?.daily ?? [], (x) => x.netAvailableHours),
  );

  constructor() {
    this.load();
  }

  setTab(value: CapacityTab): void {
    this.tab.set(value);
  }

  setHorizon(value: number): void {
    if (this.selectedHorizon() === value) return;
    this.selectedHorizon.set(value);
    this.scenarioResult.set(null);
    this.load();
  }

  setBranch(value: string): void {
    this.selectedBranchId.set(value);
    this.scenarioResult.set(null);
    this.load();
  }

  refresh(): void {
    this.load();
  }

  openScenario(type?: number): void {
    if (!this.canSimulate()) return;
    if (type) this.scenarioType.set(type);
    this.scenarioResult.set(null);
    this.scenarioAssumption.set('');
    this.scenarioDrawerOpen.set(true);
  }

  closeScenario(): void {
    if (this.scenarioLoading()) return;
    this.scenarioDrawerOpen.set(false);
  }

  simulate(): void {
    if (!this.canSimulate() || this.scenarioLoading() || !this.scenarioAssumption().trim()) return;
    const request: CapacityScenarioRequest = {
      horizon: this.selectedHorizon(),
      scenarioType: this.scenarioType(),
      branchId: this.selectedBranchId() || null,
      quantity: Math.max(1, Number(this.scenarioQuantity()) || 1),
      additionalHoursPerResourcePerWeek: Math.max(0.25, Number(this.scenarioHoursPerWeek()) || 0),
      assumptionLabel: this.scenarioAssumption().trim(),
    };
    this.scenarioLoading.set(true);
    this.errors.set([]);
    this.api.simulateCapacityScenario(request).subscribe({
      next: (value) => {
        this.scenarioResult.set(value);
        this.scenarioLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.scenarioLoading.set(false);
      },
    });
  }

  saturationTone(value: number): string {
    if (value >= 100) return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
    if (value >= 85)
      return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200';
    if (value >= 65) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200';
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200';
  }

  saturationBar(value: number): string {
    const safe = Math.max(0, Math.min(100, value));
    return `${safe}%`;
  }

  confidenceKey(value: number): string {
    return value === 3
      ? 'scheduling.capacity.confidence.high'
      : value === 2
        ? 'scheduling.capacity.confidence.medium'
        : 'scheduling.capacity.confidence.low';
  }

  confidenceTone(value: number): string {
    return value === 3
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
      : value === 2
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
        : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200';
  }

  resourceTypeLabel(dimension: CapacityDimension): string {
    const key = dimension.label.toLowerCase();
    const known: Record<string, string> = {
      student: 'scheduling.capacity.resourceTypes.student',
      instructor: 'scheduling.capacity.resourceTypes.instructor',
      vehicle: 'scheduling.capacity.resourceTypes.vehicle',
      room: 'scheduling.capacity.resourceTypes.room',
      branch: 'scheduling.capacity.resourceTypes.branch',
      simulator: 'scheduling.capacity.resourceTypes.simulator',
      equipment: 'scheduling.capacity.resourceTypes.equipment',
      examvehicle: 'scheduling.capacity.resourceTypes.examVehicle',
      partnerresource: 'scheduling.capacity.resourceTypes.partnerResource',
      other: 'scheduling.capacity.resourceTypes.other',
    };
    return known[key] ?? dimension.label;
  }

  assumptionKey(value: string): string {
    const known: Record<string, string> = {
      'capacity.unit=resource-hours': 'scheduling.capacity.assumptions.resourceHours',
      'capacity.source=active-availability-plans':
        'scheduling.capacity.assumptions.activeAvailability',
      'capacity.recurring-rule-resolution=highest-priority-non-preferred-rule':
        'scheduling.capacity.assumptions.priorityResolution',
      'capacity.preferences-excluded=true': 'scheduling.capacity.assumptions.preferencesExcluded',
      'capacity.tentative-active-holds-included=true':
        'scheduling.capacity.assumptions.activeHoldsIncluded',
      'demand.source=committed-bookings-plus-active-waiting-list':
        'scheduling.capacity.assumptions.demandSource',
      'forecast.model=deterministic-operational-baseline':
        'scheduling.capacity.assumptions.deterministic',
      'forecast.ai=false': 'scheduling.capacity.assumptions.noAi',
      'geography=aggregated-by-branch-only': 'scheduling.capacity.assumptions.geographyAggregated',
      'average-slot-lead-time.source=booking-created-at-to-session-start':
        'scheduling.capacity.assumptions.leadTime',
    };
    return known[value] ?? value;
  }

  private load(): void {
    if (!this.canRead()) return;
    this.loading.set(true);
    this.errors.set([]);
    forkJoin({
      forecast: this.api.getCapacityForecast(
        this.selectedHorizon(),
        this.selectedBranchId() || null,
        this.canForecast(),
      ),
      resources: this.api.getResources(),
    }).subscribe({
      next: ({ forecast, resources }) => {
        this.forecast.set(forecast);
        this.resources.set(resources);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  private resourceType(resource: CalendarResource): string {
    const raw = String(resource.resourceType);
    const map: Record<string, string> = {
      '1': 'Student',
      '2': 'Instructor',
      '3': 'Vehicle',
      '4': 'Room',
      '5': 'Branch',
      '6': 'Simulator',
      '7': 'Equipment',
      '8': 'ExamVehicle',
      '9': 'PartnerResource',
      '99': 'Other',
    };
    return map[raw] ?? raw;
  }

  private polyline(
    items: readonly CapacityDaily[],
    selector: (item: CapacityDaily) => number,
  ): string {
    if (!items.length) return '';
    const width = 1000;
    const height = 240;
    const allMax = Math.max(
      1,
      ...items.flatMap((x) => [x.netAvailableHours, x.estimatedDemandHours]),
    );
    return items
      .map((item, index) => {
        const x = items.length === 1 ? width / 2 : (index / (items.length - 1)) * width;
        const y = height - (selector(item) / allMax) * (height - 24) - 12;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
}
