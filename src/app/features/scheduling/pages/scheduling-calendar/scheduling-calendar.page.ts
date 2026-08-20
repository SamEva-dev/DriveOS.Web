import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { BookingCreateDrawerComponent } from '../../components/booking-create-drawer/booking-create-drawer.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import { Booking, CalendarResource } from '../../models/scheduling.models';

type CalendarView = 'day' | 'week' | 'month' | 'agenda' | 'resources';
type PlanningDimension = 'global' | 'instructors' | 'vehicles' | 'students';

interface CalendarDay {
  readonly date: Date;
  readonly iso: string;
  readonly shortKey: string;
  readonly dayNumber: number;
}

@Component({
  selector: 'driveos-scheduling-calendar-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    BookingCreateDrawerComponent,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-calendar.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingCalendarPage {
  private readonly api = inject(SchedulingApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly view = signal<CalendarView>('week');
  readonly dimension = signal<PlanningDimension>('global');
  readonly selectedContextResourceId = signal<string | null>(null);
  readonly anchorDate = signal(this.startOfDay(new Date()));
  readonly bookings = signal<readonly Booking[]>([]);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly selectedBooking = signal<Booking | null>(null);
  readonly detailsOpen = signal(false);
  readonly filtersOpen = signal(false);
  readonly createBookingOpen = signal(false);
  readonly statusFilter = signal<number | null>(null);
  readonly branchFilter = signal<string | null>(null);
  readonly resourceFilter = signal<string | null>(null);
  readonly query = signal('');

  readonly canCreate = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.create),
  );
  readonly canReschedule = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.reschedule),
  );
  readonly canCancel = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.cancel),
  );
  readonly canRecordAttendance = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.attendance.record),
  );
  readonly canReplaceInstructor = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.instructorReplacement.read),
  );
  readonly canReplaceVehicle = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.vehicleReplacement.read),
  );
  readonly canTravel = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.travel.read),
  );
  readonly canConfirm = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.confirm),
  );

  readonly visibleDays = computed<readonly CalendarDay[]>(() => {
    const anchor = this.anchorDate();
    if (this.view() === 'day') return [this.toCalendarDay(anchor)];
    const start =
      this.view() === 'month' ? this.startOfMonthGrid(anchor) : this.startOfWeek(anchor);
    const count = this.view() === 'month' ? 42 : 7;
    return Array.from({ length: count }, (_, i) => this.toCalendarDay(this.addDays(start, i)));
  });

  readonly filteredBookings = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return this.bookings().filter((booking) => {
      if (this.statusFilter() !== null && booking.status !== this.statusFilter()) return false;
      if (this.branchFilter() && booking.branchId !== this.branchFilter()) return false;
      if (
        this.resourceFilter() &&
        !booking.resources.some((x) => x.calendarResourceId === this.resourceFilter())
      )
        return false;
      if (
        q &&
        !`${booking.title} ${this.bookingResourceNames(booking)}`.toLocaleLowerCase().includes(q)
      )
        return false;
      return true;
    });
  });

  readonly branches = computed(() => [
    ...new Set(
      this.resources()
        .map((x) => x.branchId)
        .filter((x): x is string => !!x),
    ),
  ]);
  readonly contextResources = computed(() => {
    const type = this.dimensionResourceType(this.dimension());
    return type === null
      ? []
      : this.resources().filter(
          (resource) => this.resourceTypeCode(resource.resourceType) === type,
        );
  });
  readonly selectedContextResource = computed(
    () =>
      this.resources().find((resource) => resource.id === this.selectedContextResourceId()) ?? null,
  );
  readonly contextBookings = computed(() => {
    const resourceId = this.selectedContextResourceId();
    if (!resourceId) return this.filteredBookings();
    return this.filteredBookings().filter((booking) =>
      booking.resources.some((resource) => resource.calendarResourceId === resourceId),
    );
  });
  readonly upcomingContextBookings = computed(() => {
    const now = Date.now();
    return this.contextBookings().filter((booking) => new Date(booking.endAtUtc).getTime() >= now);
  });
  readonly historyContextBookings = computed(() => {
    const now = Date.now();
    return this.contextBookings().filter((booking) => new Date(booking.endAtUtc).getTime() < now);
  });
  readonly contextScheduledMinutes = computed(() =>
    this.contextBookings()
      .filter((booking) => booking.status !== 4)
      .reduce(
        (total, booking) =>
          total +
          Math.max(
            0,
            (new Date(booking.endAtUtc).getTime() - new Date(booking.startAtUtc).getTime()) / 60000,
          ),
        0,
      ),
  );
  readonly contextCancelledCount = computed(
    () => this.contextBookings().filter((booking) => booking.status === 4).length,
  );
  readonly contextAlertCount = computed(() => {
    const resource = this.selectedContextResource();
    return resource && (resource.restrictionReason || resource.unavailabilityReason) ? 1 : 0;
  });
  readonly activeFilterCount = computed(
    () =>
      [
        this.statusFilter(),
        this.branchFilter(),
        this.resourceFilter(),
        this.query().trim() || null,
      ].filter(Boolean).length,
  );

  constructor() {
    const mode = this.route.snapshot.queryParamMap.get('dimension') as PlanningDimension | null;
    const resourceId = this.route.snapshot.queryParamMap.get('resourceId');
    if (mode && ['global', 'instructors', 'vehicles', 'students'].includes(mode))
      this.dimension.set(mode);
    if (resourceId) this.selectedContextResourceId.set(resourceId);
    if (
      this.route.snapshot.routeConfig?.path === 'bookings/new' ||
      this.route.snapshot.queryParamMap.get('createBooking') === '1'
    )
      this.createBookingOpen.set(true);
    this.load();
    const bookingId = this.route.snapshot.queryParamMap.get('bookingId');
    if (bookingId) {
      this.api.getBooking(bookingId).subscribe({
        next: (booking) => {
          this.selectedBooking.set(booking);
          this.detailsOpen.set(true);
        },
        error: (error: HttpErrorResponse) => this.errors.set(this.apiErrors.getMessages(error)),
      });
    }
  }

  setView(view: CalendarView): void {
    this.view.set(view);
    this.load();
  }
  setDimension(dimension: PlanningDimension): void {
    this.dimension.set(dimension);
    this.resourceFilter.set(null);
    const first =
      this.dimensionResourceType(dimension) === null
        ? null
        : (this.contextResources()[0]?.id ?? null);
    this.selectedContextResourceId.set(first);
    this.syncContextUrl();
  }
  selectContextResource(resourceId: string): void {
    this.selectedContextResourceId.set(resourceId || null);
    this.syncContextUrl();
  }
  previous(): void {
    this.anchorDate.update((date) => this.shift(date, -1));
    this.load();
  }
  next(): void {
    this.anchorDate.update((date) => this.shift(date, 1));
    this.load();
  }
  today(): void {
    this.anchorDate.set(this.startOfDay(new Date()));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    const { from, to } = this.queryWindow();
    this.api.getCalendarData(from.toISOString(), to.toISOString()).subscribe({
      next: ({ bookings, resources, errors }) => {
        this.bookings.set(bookings);
        this.resources.set(resources);
        if (this.dimension() !== 'global') {
          const valid = this.contextResources().some(
            (resource) => resource.id === this.selectedContextResourceId(),
          );
          if (!valid) this.selectedContextResourceId.set(this.contextResources()[0]?.id ?? null);
        }
        this.errors.set(errors.flatMap((e) => this.apiErrors.getMessages(e)));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  openBooking(booking: Booking): void {
    this.selectedBooking.set(booking);
    this.detailsOpen.set(true);
  }
  openReschedule(booking = this.selectedBooking()): void {
    if (!booking || !this.canReschedule()) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/bookings', booking.id, 'reschedule']);
  }
  openCancel(booking = this.selectedBooking()): void {
    if (!booking || !this.canCancel()) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/bookings', booking.id, 'cancel']);
  }
  canTakeAttendance(booking: Booking): boolean {
    if (!this.canRecordAttendance() || ![2, 3, 4].includes(booking.status)) return false;
    return Date.now() >= new Date(booking.startAtUtc).getTime() - 30 * 60_000;
  }

  openAttendance(booking = this.selectedBooking()): void {
    if (!booking || !this.canTakeAttendance(booking)) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/bookings', booking.id, 'attendance']);
  }
  openInstructorReplacement(booking = this.selectedBooking()): void {
    if (!booking || !this.canReplaceInstructor()) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/replacements/instructor'], {
      queryParams: { bookingId: booking.id },
    });
  }
  openVehicleReplacement(booking = this.selectedBooking()): void {
    if (!booking || !this.canReplaceVehicle()) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/replacements/vehicle'], {
      queryParams: { bookingId: booking.id },
    });
  }
  openTravel(booking = this.selectedBooking()): void {
    if (!booking || !this.canTravel()) return;
    this.detailsOpen.set(false);
    void this.router.navigate(['/planning/travel'], { queryParams: { bookingId: booking.id } });
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
  }
  closeFilters(): void {
    this.filtersOpen.set(false);
  }
  openCreateBooking(): void {
    this.detailsOpen.set(false);
    this.createBookingOpen.set(true);
  }
  closeCreateBooking(): void {
    this.createBookingOpen.set(false);
    if (this.route.snapshot.routeConfig?.path === 'bookings/new')
      void this.router.navigate(['/planning/calendar'], { replaceUrl: true });
  }
  onBookingCreated(): void {
    this.load();
  }
  clearFilters(): void {
    this.statusFilter.set(null);
    this.branchFilter.set(null);
    this.resourceFilter.set(null);
    this.query.set('');
  }

  bookingsForDay(day: CalendarDay): readonly Booking[] {
    return this.contextBookings()
      .filter((b) => this.localDateKey(new Date(b.startAtUtc)) === day.iso)
      .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
  }
  resourceName(id: string): string {
    return this.resources().find((x) => x.id === id)?.displayName ?? id.slice(0, 8);
  }
  bookingResourceNames(booking: Booking): string {
    return booking.resources.map((x) => this.resourceName(x.calendarResourceId)).join(' · ');
  }
  bookingsForResource(resourceId: string): readonly Booking[] {
    return this.contextBookings()
      .filter((booking) => booking.resources.some((x) => x.calendarResourceId === resourceId))
      .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
  }
  bookingStatusKey(status: number): string {
    return `scheduling.bookings.status.${status}`;
  }
  bookingTypeKey(type: number): string {
    return `scheduling.bookings.type.${type}`;
  }
  resourceTypeKey(type: string | number): string {
    return `scheduling.resources.type.${this.resourceTypeCode(type)}`;
  }
  statusClass(status: number): string {
    return (
      (
        {
          1: 'border-slate-300 bg-slate-50',
          2: 'border-blue-300 bg-blue-50',
          3: 'border-emerald-300 bg-emerald-50',
          4: 'border-rose-300 bg-rose-50',
          5: 'border-amber-300 bg-amber-50',
        } as Record<number, string>
      )[status] ?? 'border-slate-300 bg-white'
    );
  }
  isToday(day: CalendarDay): boolean {
    return day.iso === this.localDateKey(new Date());
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value ? Number(value) : null);
  }
  onBranchChange(value: string): void {
    this.branchFilter.set(value || null);
  }
  onResourceChange(value: string): void {
    this.resourceFilter.set(value || null);
  }
  onQuery(value: string): void {
    this.query.set(value);
  }

  contextTitleKey(): string {
    return `scheduling.calendar.context.${this.dimension()}.title`;
  }
  contextSubtitleKey(): string {
    return `scheduling.calendar.context.${this.dimension()}.subtitle`;
  }
  contextIcon(): string {
    return (
      {
        global: 'ph ph-globe-hemisphere-west',
        instructors: 'ph ph-chalkboard-teacher',
        vehicles: 'ph ph-car-profile',
        students: 'ph ph-student',
      } as Record<PlanningDimension, string>
    )[this.dimension()];
  }
  scheduledHours(): string {
    return (this.contextScheduledMinutes() / 60).toFixed(1);
  }
  resourceStatusKey(status: string): string {
    return `scheduling.resources.status.${status}`;
  }

  private dimensionResourceType(dimension: PlanningDimension): string | null {
    return ({ global: null, students: '1', instructors: '2', vehicles: '3' } as const)[dimension];
  }

  private resourceTypeCode(type: string | number): string {
    const value = String(type);
    return (
      (
        {
          Student: '1',
          Instructor: '2',
          Vehicle: '3',
          Room: '4',
          Branch: '5',
          Simulator: '6',
          Equipment: '7',
          ExamVehicle: '8',
          PartnerResource: '9',
          Other: '99',
        } as Record<string, string>
      )[value] ?? value
    );
  }

  private syncContextUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        dimension: this.dimension() === 'global' ? null : this.dimension(),
        resourceId: this.dimension() === 'global' ? null : this.selectedContextResourceId(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private queryWindow(): { from: Date; to: Date } {
    const anchor = this.anchorDate();
    if (this.view() === 'day')
      return { from: this.startOfDay(anchor), to: this.addDays(this.startOfDay(anchor), 1) };
    if (this.view() === 'month') {
      const from = this.startOfMonthGrid(anchor);
      return { from, to: this.addDays(from, 42) };
    }
    const from = this.startOfWeek(anchor);
    return { from, to: this.addDays(from, 7) };
  }
  private shift(date: Date, direction: number): Date {
    const amount = this.view() === 'day' ? 1 : this.view() === 'month' ? 1 : 7;
    return this.view() === 'month'
      ? new Date(date.getFullYear(), date.getMonth() + direction * amount, 1)
      : this.addDays(date, direction * amount);
  }
  private startOfWeek(date: Date): Date {
    const d = this.startOfDay(date);
    const day = d.getDay() || 7;
    return this.addDays(d, 1 - day);
  }
  private startOfMonthGrid(date: Date): Date {
    return this.startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
  }
  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  private localDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  private toCalendarDay(date: Date): CalendarDay {
    return {
      date,
      iso: this.localDateKey(date),
      shortKey: `scheduling.calendar.weekdays.${(date.getDay() + 6) % 7}`,
      dayNumber: date.getDate(),
    };
  }
}
