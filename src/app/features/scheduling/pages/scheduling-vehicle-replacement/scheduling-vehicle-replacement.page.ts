import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  Booking,
  CalendarResource,
  VehicleReplacementApplyResult,
  VehicleReplacementPreview,
  VehicleReplacementRequest,
  VehicleReplacementSuggestion,
} from '../../models/scheduling.models';

type Step = 'scope' | 'suggestions' | 'impacts' | 'confirmation';

@Component({
  selector: 'driveos-scheduling-vehicle-replacement-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    RouterLink,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-vehicle-replacement.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingVehicleReplacementPage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly previewing = signal(false);
  readonly applying = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly success = signal<VehicleReplacementApplyResult | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly bookings = signal<readonly Booking[]>([]);
  readonly suggestions = signal<readonly VehicleReplacementSuggestion[]>([]);
  readonly preview = signal<VehicleReplacementPreview | null>(null);
  readonly selectedCandidate = signal<VehicleReplacementSuggestion | null>(null);
  readonly candidateDrawerOpen = signal(false);
  readonly confirmationDrawerOpen = signal(false);
  readonly step = signal<Step>('scope');

  readonly previousVehicleId = signal('');
  readonly mode = signal(1);
  readonly fromLocal = signal(this.localInput(new Date()));
  readonly toLocal = signal(this.localInput(new Date(Date.now() + 14 * 86400000)));
  readonly selectedBookingIds = signal<readonly string[]>([]);
  readonly reason = signal('');
  readonly transmissionType = signal('');
  readonly dualControlRequired = signal(true);
  readonly energyType = signal('');
  readonly adaptations = signal('');
  readonly operationId = signal(crypto.randomUUID());

  readonly canRead = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.vehicleReplacement.read),
  );
  readonly canAssign = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.vehicleReplacement.assign),
  );
  readonly vehicles = computed(() =>
    this.resources().filter((x) =>
      ['Vehicle', 'ExamVehicle'].includes(this.resourceType(x.resourceType)),
    ),
  );
  readonly relevantBookings = computed(() => {
    const vehicleId = this.previousVehicleId();
    const resourceIds = new Set(
      this.vehicles()
        .filter((x) => x.externalResourceId === vehicleId)
        .map((x) => x.id),
    );
    return this.bookings().filter((booking) =>
      booking.resources.some((r) => resourceIds.has(r.calendarResourceId)),
    );
  });
  readonly selectedBookings = computed(() => {
    const selected = new Set(this.selectedBookingIds());
    return this.relevantBookings().filter((x) => selected.has(x.id));
  });
  readonly affectedStudentCount = computed(
    () =>
      new Set(
        this.selectedBookings().flatMap((b) =>
          b.participants.filter((p) => p.participantType === 1).map((p) => p.externalParticipantId),
        ),
      ).size,
  );
  readonly affectedInstructorCount = computed(() => {
    const byId = new Map(this.resources().map((r) => [r.id, r]));
    return new Set(
      this.selectedBookings().flatMap((b) =>
        b.resources
          .map((r) => byId.get(r.calendarResourceId))
          .filter(
            (r): r is CalendarResource => !!r && this.resourceType(r.resourceType) === 'Instructor',
          )
          .map((r) => r.externalResourceId),
      ),
    ).size;
  });
  readonly trainingCategories = computed(() => [
    ...new Set(
      this.selectedBookings()
        .map((x) => x.trainingCategory?.trim())
        .filter((x): x is string => !!x),
    ),
  ]);
  readonly canSearch = computed(
    () =>
      this.canRead() &&
      !!this.previousVehicleId() &&
      this.selectedBookingIds().length > 0 &&
      !this.searching(),
  );
  readonly canApply = computed(
    () =>
      this.canAssign() &&
      !!this.preview()?.canConfirm &&
      !!this.selectedCandidate() &&
      !!this.reason().trim() &&
      !this.applying(),
  );

  readonly modes = [
    { value: 1, key: 'singleSession' },
    { value: 2, key: 'selectedSessions' },
    { value: 3, key: 'dateRange' },
    { value: 4, key: 'untilRepairCompleted' },
    { value: 5, key: 'permanentReplacement' },
  ] as const;

  constructor() {
    this.load();
  }

  load(): void {
    const from = this.toIso(this.fromLocal());
    const to = this.toIso(this.toLocal());
    if (!from || !to) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.errors.set([]);
    forkJoin({
      resources: this.api.getResources(),
      bookings: this.api.getBookings(from, to),
    }).subscribe({
      next: ({ resources, bookings }) => {
        this.resources.set(resources);
        this.bookings.set(bookings);
        const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
        if (bookingId) {
          const booking = bookings.find((x) => x.id === bookingId);
          const resource = booking?.resources
            .map((r) => resources.find((x) => x.id === r.calendarResourceId))
            .find(
              (x) => x && ['Vehicle', 'ExamVehicle'].includes(this.resourceType(x.resourceType)),
            );
          if (resource) this.previousVehicleId.set(resource.externalResourceId);
          if (booking) this.selectedBookingIds.set([booking.id]);
          this.mode.set(1);
        }
        this.applyModeSelection();
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  reloadPeriod(): void {
    this.resetResults();
    this.load();
  }
  setPreviousVehicle(id: string): void {
    this.previousVehicleId.set(id);
    this.selectedBookingIds.set([]);
    this.resetResults();
    this.applyModeSelection();
  }
  setMode(value: number): void {
    this.mode.set(value);
    this.resetResults();
    this.applyModeSelection();
  }
  toggleBooking(id: string): void {
    if (this.mode() === 1) this.selectedBookingIds.set([id]);
    else {
      const current = new Set(this.selectedBookingIds());
      current.has(id) ? current.delete(id) : current.add(id);
      this.selectedBookingIds.set([...current]);
    }
    this.resetResults();
  }

  search(): void {
    if (!this.canSearch()) return;
    this.searching.set(true);
    this.errors.set([]);
    this.preview.set(null);
    this.selectedCandidate.set(null);
    this.api
      .suggestVehicleReplacements({
        previousVehicleId: this.previousVehicleId(),
        bookingIds: this.selectedBookingIds(),
        requirements: this.requirements(),
      })
      .subscribe({
        next: (value) => {
          this.suggestions.set(value);
          this.searching.set(false);
          this.step.set('suggestions');
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  inspect(candidate: VehicleReplacementSuggestion): void {
    this.selectedCandidate.set(candidate);
    this.candidateDrawerOpen.set(true);
  }
  choose(candidate: VehicleReplacementSuggestion): void {
    this.selectedCandidate.set(candidate);
    this.candidateDrawerOpen.set(false);
    this.previewReplacement();
  }
  previewReplacement(): void {
    const request = this.buildRequest(false);
    if (!request) return;
    this.previewing.set(true);
    this.errors.set([]);
    this.api.previewVehicleReplacement(request).subscribe({
      next: (value) => {
        this.preview.set(value);
        this.previewing.set(false);
        this.step.set('impacts');
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as VehicleReplacementPreview | undefined;
        if (error.status === 409 && body?.bookingIds) {
          this.preview.set(body);
          this.step.set('impacts');
        } else this.errors.set(this.errorsApi.getMessages(error));
        this.previewing.set(false);
      },
    });
  }
  openConfirmation(): void {
    if (this.preview()?.canConfirm) this.confirmationDrawerOpen.set(true);
  }
  apply(): void {
    const request = this.buildRequest(true);
    if (!request || !this.canApply()) return;
    this.applying.set(true);
    this.errors.set([]);
    this.api.applyVehicleReplacement(request).subscribe({
      next: (value) => {
        this.success.set(value);
        this.applying.set(false);
        this.confirmationDrawerOpen.set(false);
        this.step.set('confirmation');
        this.loadAfterApply();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.applying.set(false);
      },
    });
  }
  backToCalendar(): void {
    void this.router.navigate(['/planning/calendar']);
  }

  private requirements() {
    return {
      trainingCategory: this.trainingCategories().length === 1 ? this.trainingCategories()[0] : '',
      transmissionType: this.transmissionType().trim() || null,
      dualControlRequired: this.dualControlRequired(),
      requiredAdaptations: this.adaptations()
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      energyType: this.energyType().trim() || null,
    };
  }
  private buildRequest(requireReason: boolean): VehicleReplacementRequest | null {
    const candidate = this.selectedCandidate();
    if (!candidate || (requireReason && !this.reason().trim())) return null;
    return {
      operationId: this.operationId(),
      previousVehicleId: this.previousVehicleId(),
      replacementVehicleId: candidate.vehicleId,
      mode: this.mode(),
      bookingIds: this.selectedBookingIds(),
      requirements: this.requirements(),
      reason: this.reason().trim(),
    };
  }
  private applyModeSelection(): void {
    const list = this.relevantBookings();
    if (!list.length) return;
    if (this.mode() === 1 && !this.selectedBookingIds().length)
      this.selectedBookingIds.set([list[0].id]);
    if ([3, 4, 5].includes(this.mode())) this.selectedBookingIds.set(list.map((x) => x.id));
  }
  private resetResults(): void {
    this.suggestions.set([]);
    this.preview.set(null);
    this.selectedCandidate.set(null);
    this.success.set(null);
    this.step.set('scope');
    this.operationId.set(crypto.randomUUID());
  }
  private loadAfterApply(): void {
    const from = this.toIso(this.fromLocal()),
      to = this.toIso(this.toLocal());
    if (!from || !to) return;
    this.api.getBookings(from, to).subscribe((x) => this.bookings.set(x));
  }
  resourceType(value: string | number): string {
    const map: Record<number, string> = {
      1: 'Student',
      2: 'Instructor',
      3: 'Vehicle',
      4: 'Room',
      5: 'Branch',
      6: 'Simulator',
      7: 'Equipment',
      8: 'ExamVehicle',
      9: 'PartnerResource',
    };
    return typeof value === 'number' ? (map[value] ?? String(value)) : value;
  }
  vehicleName(id: string): string {
    return this.vehicles().find((x) => x.externalResourceId === id)?.displayName ?? id;
  }
  factorKey(value: string): string {
    if (value.startsWith('availability:'))
      return 'scheduling.vehicleReplacement.factors.availability';
    if (value === 'branch:matching') return 'scheduling.vehicleReplacement.factors.branchMatching';
    return 'scheduling.vehicleReplacement.factors.other';
  }
  reviewKey(value: string): string {
    const map: Record<string, string> = {
      'fleet.vehicle.compatibility.external-review':
        'scheduling.vehicleReplacement.external.compatibility',
      'fleet.vehicle.insurance.external-review': 'scheduling.vehicleReplacement.external.insurance',
      'fleet.vehicle.maintenance.external-review':
        'scheduling.vehicleReplacement.external.maintenance',
      'fleet.vehicle.location.external-review': 'scheduling.vehicleReplacement.external.location',
      'fleet.vehicle.ownership.external-review': 'scheduling.vehicleReplacement.external.ownership',
    };
    return map[value] ?? 'scheduling.vehicleReplacement.external.generic';
  }
  blockingReasonKey(value: string): string {
    if (value.includes('authoritative-data-unavailable'))
      return 'scheduling.vehicleReplacement.blocking.authoritativeDataUnavailable';
    if (value.includes('previous-vehicle-resource-not-found'))
      return 'scheduling.vehicleReplacement.blocking.previousResourceMissing';
    if (value.includes('replacement-vehicle-resource-not-found'))
      return 'scheduling.vehicleReplacement.blocking.replacementResourceMissing';
    if (value.includes('conflict:'))
      return 'scheduling.vehicleReplacement.blocking.schedulingConflict';
    return 'scheduling.vehicleReplacement.blocking.generic';
  }
  private localInput(date: Date): string {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  }
  private toIso(value: string): string | null {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
}
