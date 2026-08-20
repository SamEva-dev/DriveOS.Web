import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  EvaluateTravelRequest,
  TravelEvaluationResponse,
  TravelLocationMode,
} from '../../models/scheduling.models';

type TravelTab = 'analysis' | 'privacy';
type LocationSide = 'origin' | 'destination';

@Component({
  selector: 'driveos-scheduling-travel-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-travel.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingTravelPage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);

  readonly tab = signal<TravelTab>('analysis');
  readonly loading = signal(false);
  readonly evaluating = signal(false);
  readonly locating = signal<LocationSide | null>(null);
  readonly errors = signal<readonly string[]>([]);
  readonly result = signal<TravelEvaluationResponse | null>(null);
  readonly evaluateDrawerOpen = signal(false);
  readonly contextBooking = signal<Booking | null>(null);
  readonly previousBooking = signal<Booking | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);

  readonly originMode = signal<TravelLocationMode>(1);
  readonly originLabel = signal('');
  readonly originAddress = signal('');
  readonly originLatitude = signal<number | null>(null);
  readonly originLongitude = signal<number | null>(null);
  readonly destinationMode = signal<TravelLocationMode>(1);
  readonly destinationLabel = signal('');
  readonly destinationAddress = signal('');
  readonly destinationLatitude = signal<number | null>(null);
  readonly destinationLongitude = signal<number | null>(null);
  readonly previousPlannedEndLocal = signal(this.localInput(new Date()));
  readonly previousActualEndLocal = signal('');
  readonly nextPlannedStartLocal = signal(this.localInput(new Date(Date.now() + 60 * 60000)));
  readonly nextActualStartLocal = signal('');
  readonly transportMode = signal(1);
  readonly requiredBufferMinutes = signal<number | null>(15);
  readonly manualEstimatedDurationMinutes = signal<number | null>(null);
  readonly manualDistanceKilometers = signal<number | null>(null);
  readonly manualTrafficContext = signal('');
  readonly purpose = signal('travel-feasibility');

  readonly canRead = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.travel.read),
  );
  readonly canUsePreciseLocation = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.travel.preciseLocation),
  );
  readonly hasBookingContext = computed(() => !!this.contextBooking());
  readonly canEvaluate = computed(() => {
    if (!this.canRead() || this.evaluating()) return false;
    if (!this.originLabel().trim() || !this.destinationLabel().trim()) return false;
    if (this.originMode() === 1 && !this.originAddress().trim()) return false;
    if (this.destinationMode() === 1 && !this.destinationAddress().trim()) return false;
    if (
      this.originMode() !== 1 &&
      (this.originLatitude() == null || this.originLongitude() == null)
    )
      return false;
    if (
      this.destinationMode() !== 1 &&
      (this.destinationLatitude() == null || this.destinationLongitude() == null)
    )
      return false;
    return (
      !!this.toIso(this.previousPlannedEndLocal()) && !!this.toIso(this.nextPlannedStartLocal())
    );
  });

  constructor() {
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    if (bookingId) this.loadBookingContext(bookingId);
  }

  openEvaluation(): void {
    this.evaluateDrawerOpen.set(true);
  }
  closeEvaluation(): void {
    this.evaluateDrawerOpen.set(false);
  }
  setTab(value: TravelTab): void {
    this.tab.set(value);
  }
  setOriginMode(value: string): void {
    this.originMode.set(Number(value) as TravelLocationMode);
  }
  setDestinationMode(value: string): void {
    this.destinationMode.set(Number(value) as TravelLocationMode);
  }

  evaluate(): void {
    if (!this.canEvaluate()) return;
    const request = this.buildRequest();
    if (!request) return;
    this.evaluating.set(true);
    this.errors.set([]);
    this.api.evaluateTravel(request).subscribe({
      next: (value) => {
        this.result.set(value);
        this.evaluating.set(false);
        this.evaluateDrawerOpen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.evaluating.set(false);
      },
    });
  }

  useBrowserLocation(side: LocationSide): void {
    if (!this.canUsePreciseLocation() || !navigator.geolocation) return;
    this.locating.set(side);
    this.errors.set([]);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const mode: TravelLocationMode = 3;
        if (side === 'origin') {
          this.originMode.set(mode);
          this.originLabel.set(this.originLabel().trim() || 'Current position');
          this.originLatitude.set(position.coords.latitude);
          this.originLongitude.set(position.coords.longitude);
        } else {
          this.destinationMode.set(mode);
          this.destinationLabel.set(this.destinationLabel().trim() || 'Current position');
          this.destinationLatitude.set(position.coords.latitude);
          this.destinationLongitude.set(position.coords.longitude);
        }
        this.locating.set(null);
      },
      () => {
        this.errors.set(['scheduling.travel.geolocationUnavailable']);
        this.locating.set(null);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  resourceNames(booking: Booking | null): string {
    if (!booking) return '—';
    const map = new Map(this.resources().map((r) => [r.id, r.displayName]));
    return (
      booking.resources
        .map((r) => map.get(r.calendarResourceId) ?? r.calendarResourceId)
        .join(' · ') || '—'
    );
  }

  timeSourceKey(value: number): string {
    return value === 2
      ? 'scheduling.travel.timeSource.actual'
      : 'scheduling.travel.timeSource.planned';
  }
  trafficKey(value: string): string {
    const normalized = (value || 'unknown').trim().toLowerCase();
    const known = ['manual', 'normal', 'light', 'moderate', 'heavy', 'unknown'];
    return known.includes(normalized)
      ? `scheduling.travel.traffic.${normalized}`
      : 'scheduling.travel.traffic.custom';
  }
  routeSourceKey(value: string): string {
    return value === 'manual'
      ? 'scheduling.travel.routeSource.manual'
      : 'scheduling.travel.routeSource.provider';
  }

  private loadBookingContext(bookingId: string): void {
    this.loading.set(true);
    this.errors.set([]);
    this.api.getBooking(bookingId).subscribe({
      next: (booking) => {
        this.contextBooking.set(booking);
        const start = new Date(booking.startAtUtc);
        const from = new Date(start.getTime() - 48 * 3600000).toISOString();
        const to = new Date(start.getTime() + 2 * 3600000).toISOString();
        forkJoin({
          bookings: this.api.getBookings(from, to),
          resources: this.api.getResources(),
        }).subscribe({
          next: ({ bookings, resources }) => {
            this.resources.set(resources);
            const currentResourceIds = new Set(booking.resources.map((r) => r.calendarResourceId));
            const previous =
              [...bookings]
                .filter(
                  (candidate) =>
                    candidate.id !== booking.id &&
                    new Date(candidate.endAtUtc) <= start &&
                    candidate.resources.some((r) => currentResourceIds.has(r.calendarResourceId)),
                )
                .sort(
                  (a, b) => new Date(b.endAtUtc).getTime() - new Date(a.endAtUtc).getTime(),
                )[0] ?? null;
            this.previousBooking.set(previous);
            this.prefillFromBookings(previous, booking);
            this.loading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.errors.set(this.errorsApi.getMessages(error));
            this.loading.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  private prefillFromBookings(previous: Booking | null, next: Booking): void {
    this.nextPlannedStartLocal.set(this.localInput(new Date(next.startAtUtc)));
    this.nextActualStartLocal.set(
      next.attendance?.arrivalTimeUtc
        ? this.localInput(new Date(next.attendance.arrivalTimeUtc))
        : '',
    );
    this.destinationLabel.set(next.title || 'Destination');
    this.destinationAddress.set(next.meetingPoint ?? '');
    if (previous) {
      this.previousPlannedEndLocal.set(this.localInput(new Date(previous.endAtUtc)));
      this.previousActualEndLocal.set(
        previous.attendance?.departureTimeUtc
          ? this.localInput(new Date(previous.attendance.departureTimeUtc))
          : '',
      );
      this.originLabel.set(previous.title || 'Origin');
      this.originAddress.set(previous.meetingPoint ?? '');
    }
    this.evaluateDrawerOpen.set(true);
  }

  private buildRequest(): EvaluateTravelRequest | null {
    const previousPlannedEndUtc = this.toIso(this.previousPlannedEndLocal());
    const nextPlannedStartUtc = this.toIso(this.nextPlannedStartLocal());
    if (!previousPlannedEndUtc || !nextPlannedStartUtc) return null;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 60000);
    return {
      origin: this.locationRequest('origin', now, expires),
      destination: this.locationRequest('destination', now, expires),
      previousPlannedEndUtc,
      previousActualEndUtc: this.toIsoOrNull(this.previousActualEndLocal()),
      nextPlannedStartUtc,
      nextActualStartUtc: this.toIsoOrNull(this.nextActualStartLocal()),
      requiredBufferMinutes: this.requiredBufferMinutes(),
      transportMode: this.transportMode() as 1 | 2 | 3 | 4 | 99,
      manualEstimatedDurationMinutes: this.manualEstimatedDurationMinutes(),
      manualDistanceKilometers: this.manualDistanceKilometers(),
      manualTrafficContext: this.manualTrafficContext().trim() || null,
    };
  }

  private locationRequest(side: LocationSide, captured: Date, expires: Date) {
    const origin = side === 'origin';
    const mode = origin ? this.originMode() : this.destinationMode();
    return {
      mode,
      label: (origin ? this.originLabel() : this.destinationLabel()).trim(),
      address:
        mode === 1 ? (origin ? this.originAddress() : this.destinationAddress()).trim() : null,
      latitude: mode === 1 ? null : origin ? this.originLatitude() : this.destinationLatitude(),
      longitude: mode === 1 ? null : origin ? this.originLongitude() : this.destinationLongitude(),
      purpose: mode === 1 ? null : this.purpose().trim(),
      capturedAtUtc: mode === 1 ? null : captured.toISOString(),
      expiresAtUtc: mode === 1 ? null : expires.toISOString(),
    };
  }

  private localInput(date: Date): string {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  }
  private toIso(value: string): string | null {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  private toIsoOrNull(value: string): string | null {
    return value ? this.toIso(value) : null;
  }
}
