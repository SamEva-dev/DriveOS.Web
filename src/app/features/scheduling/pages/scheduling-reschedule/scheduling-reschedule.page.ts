import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  BookingRescheduleImpact,
  BookingRescheduleRequest,
  CalendarResource,
  SlotSearchSuggestion,
} from '../../models/scheduling.models';

type RescheduleStep =
  'reason' | 'slot' | 'resources' | 'impacts' | 'notifications' | 'confirmation';

@Component({
  selector: 'driveos-scheduling-reschedule-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-reschedule.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingReschedulePage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly previewing = signal(false);
  readonly searching = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly booking = signal<Booking | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly impact = signal<BookingRescheduleImpact | null>(null);
  readonly slotSuggestions = signal<readonly SlotSearchSuggestion[]>([]);
  readonly slotWarnings = signal<readonly string[]>([]);
  readonly step = signal<RescheduleStep>('reason');
  readonly searchDrawerOpen = signal(false);

  readonly reason = signal('');
  readonly startAt = signal('');
  readonly endAt = signal('');
  readonly branchId = signal('');
  readonly keepInstructor = signal(true);
  readonly keepVehicle = signal(true);
  readonly selectedInstructorResourceId = signal('');
  readonly selectedVehicleResourceId = signal('');
  readonly selectedRoomResourceId = signal('');
  readonly operationId = signal(crypto.randomUUID());

  readonly searchFrom = signal('');
  readonly searchTo = signal('');
  readonly searchDurationMinutes = signal(60);
  readonly searchMaxSuggestions = signal(8);

  readonly canReschedule = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.reschedule),
  );
  readonly instructors = computed(() =>
    this.resources().filter((x) => this.resourceTypeCode(x.resourceType) === '2'),
  );
  readonly vehicles = computed(() =>
    this.resources().filter(
      (x) =>
        this.resourceTypeCode(x.resourceType) === '3' ||
        this.resourceTypeCode(x.resourceType) === '8',
    ),
  );
  readonly rooms = computed(() =>
    this.resources().filter((x) => this.resourceTypeCode(x.resourceType) === '4'),
  );
  readonly students = computed(() =>
    this.resources().filter((x) => this.resourceTypeCode(x.resourceType) === '1'),
  );
  readonly selectedResources = computed(() => {
    const booking = this.booking();
    if (!booking) return [] as { calendarResourceId: string; quantity: number }[];
    const original = new Map(booking.resources.map((x) => [x.calendarResourceId, x.quantity]));
    const replaceByType = (type: string, selectedId: string, keep: boolean): void => {
      const currentIds = this.resources()
        .filter((x) => this.resourceTypeCode(x.resourceType) === type)
        .map((x) => x.id);
      if (!keep) currentIds.forEach((id) => original.delete(id));
      if (selectedId) original.set(selectedId, 1);
    };
    replaceByType('2', this.selectedInstructorResourceId(), this.keepInstructor());
    const vehicleIds = this.resources()
      .filter((x) => ['3', '8'].includes(this.resourceTypeCode(x.resourceType)))
      .map((x) => x.id);
    if (!this.keepVehicle()) vehicleIds.forEach((id) => original.delete(id));
    if (this.selectedVehicleResourceId()) original.set(this.selectedVehicleResourceId(), 1);
    const roomIds = this.resources()
      .filter((x) => this.resourceTypeCode(x.resourceType) === '4')
      .map((x) => x.id);
    if (this.selectedRoomResourceId()) {
      roomIds.forEach((id) => original.delete(id));
      original.set(this.selectedRoomResourceId(), 1);
    }
    return [...original.entries()].map(([calendarResourceId, quantity]) => ({
      calendarResourceId,
      quantity,
    }));
  });
  readonly changes = computed(() => {
    const booking = this.booking();
    if (!booking) return [] as readonly string[];
    const changes: string[] = [];
    if (
      new Date(this.startAt()).toISOString() !== new Date(booking.startAtUtc).toISOString() ||
      new Date(this.endAt()).toISOString() !== new Date(booking.endAtUtc).toISOString()
    )
      changes.push('time');
    if ((this.branchId() || null) !== booking.branchId) changes.push('branch');
    const oldIds = booking.resources
      .map((x) => `${x.calendarResourceId}:${x.quantity}`)
      .sort()
      .join('|');
    const newIds = this.selectedResources()
      .map((x) => `${x.calendarResourceId}:${x.quantity}`)
      .sort()
      .join('|');
    if (oldIds !== newIds) changes.push('resources');
    return changes;
  });
  readonly canPreview = computed(
    () =>
      !!this.booking() &&
      !!this.reason().trim() &&
      !!this.toIso(this.startAt()) &&
      !!this.toIso(this.endAt()) &&
      this.toIso(this.endAt())! > this.toIso(this.startAt())!,
  );
  readonly canApply = computed(
    () => this.canReschedule() && !!this.impact()?.canConfirm && !this.saving(),
  );

  readonly steps: readonly { id: RescheduleStep; key: string; icon: string }[] = [
    { id: 'reason', key: 'scheduling.reschedule.steps.reason', icon: 'ph ph-note-pencil' },
    { id: 'slot', key: 'scheduling.reschedule.steps.slot', icon: 'ph ph-calendar-dots' },
    { id: 'resources', key: 'scheduling.reschedule.steps.resources', icon: 'ph ph-cube' },
    { id: 'impacts', key: 'scheduling.reschedule.steps.impacts', icon: 'ph ph-warning-circle' },
    { id: 'notifications', key: 'scheduling.reschedule.steps.notifications', icon: 'ph ph-bell' },
    {
      id: 'confirmation',
      key: 'scheduling.reschedule.steps.confirmation',
      icon: 'ph ph-check-circle',
    },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.bookingId) {
      this.loading.set(false);
      this.errors.set(['scheduling.reschedule.validation.bookingRequired']);
      return;
    }
    this.loading.set(true);
    forkJoin({
      booking: this.api.getBooking(this.bookingId),
      resources: this.api.getResources(),
    }).subscribe({
      next: ({ booking, resources }) => {
        this.booking.set(booking);
        this.resources.set(resources);
        this.startAt.set(this.toLocalDateTime(new Date(booking.startAtUtc)));
        this.endAt.set(this.toLocalDateTime(new Date(booking.endAtUtc)));
        this.branchId.set(booking.branchId ?? '');
        this.searchFrom.set(this.toLocalDateTime(new Date(booking.startAtUtc)));
        this.searchTo.set(
          this.toLocalDateTime(
            new Date(new Date(booking.startAtUtc).getTime() + 14 * 24 * 60 * 60 * 1000),
          ),
        );
        this.searchDurationMinutes.set(
          Math.max(
            15,
            Math.round(
              (new Date(booking.endAtUtc).getTime() - new Date(booking.startAtUtc).getTime()) /
                60000,
            ),
          ),
        );
        this.selectedInstructorResourceId.set(
          this.firstBookingResourceByTypes(booking, ['2']) ?? '',
        );
        this.selectedVehicleResourceId.set(
          this.firstBookingResourceByTypes(booking, ['3', '8']) ?? '',
        );
        this.selectedRoomResourceId.set(this.firstBookingResourceByTypes(booking, ['4']) ?? '');
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  setStep(step: RescheduleStep): void {
    this.step.set(step);
  }

  preview(): void {
    const request = this.buildRequest();
    if (!request) return;
    this.previewing.set(true);
    this.errors.set([]);
    this.api.previewBookingReschedule(this.bookingId, request).subscribe({
      next: (impact) => {
        this.impact.set(impact);
        this.previewing.set(false);
        this.step.set('impacts');
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.previewing.set(false);
      },
    });
  }

  apply(): void {
    const request = this.buildRequest();
    if (!request || !this.canApply()) return;
    this.saving.set(true);
    this.errors.set([]);
    this.api.rescheduleBooking(this.bookingId, request).subscribe({
      next: (impact) => {
        this.impact.set(impact);
        this.saving.set(false);
        this.successKey.set(
          impact.alreadyApplied
            ? 'scheduling.reschedule.messages.alreadyApplied'
            : 'scheduling.reschedule.messages.success',
        );
        this.step.set('confirmation');
        this.api
          .getBooking(this.bookingId)
          .subscribe({ next: (booking) => this.booking.set(booking) });
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  openSearch(): void {
    this.slotSuggestions.set([]);
    this.slotWarnings.set([]);
    this.searchDrawerOpen.set(true);
  }
  closeSearch(): void {
    if (!this.searching()) this.searchDrawerOpen.set(false);
  }

  searchSlots(): void {
    const booking = this.booking();
    if (!booking) return;
    const student = booking.participants.find(
      (x) => x.participantType === 1,
    )?.externalParticipantId;
    const fromUtc = this.toIso(this.searchFrom());
    const toUtc = this.toIso(this.searchTo());
    if (!student || !fromUtc || !toUtc || toUtc <= fromUtc) {
      this.errors.set(['scheduling.reschedule.validation.search']);
      return;
    }
    const preferredInstructor = this.keepInstructor()
      ? this.externalResourceId(this.selectedInstructorResourceId())
      : null;
    const preferredVehicle = this.keepVehicle()
      ? this.externalResourceId(this.selectedVehicleResourceId())
      : null;
    this.searching.set(true);
    this.api
      .searchSlots({
        studentId: student,
        bookingType: booking.bookingType,
        durationMinutes: this.searchDurationMinutes(),
        fromUtc,
        toUtc,
        branchId: this.branchId() || null,
        preferredInstructorId: preferredInstructor,
        preferredVehicleId: preferredVehicle,
        requireVehicle: !!this.selectedVehicleResourceId(),
        requireRoom: !!this.selectedRoomResourceId(),
        stepMinutes: 15,
        maxSuggestions: this.searchMaxSuggestions(),
        trainingCategory: booking.trainingCategory,
        preferContinuity: true,
      })
      .subscribe({
        next: (result) => {
          this.slotSuggestions.set(result.suggestions);
          this.slotWarnings.set(result.warnings);
          this.searching.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  chooseSuggestion(suggestion: SlotSearchSuggestion): void {
    this.startAt.set(this.toLocalDateTime(new Date(suggestion.startAtUtc)));
    this.endAt.set(this.toLocalDateTime(new Date(suggestion.endAtUtc)));
    this.branchId.set(suggestion.branchId ?? this.branchId());
    if (suggestion.instructorCalendarResourceId) {
      this.keepInstructor.set(false);
      this.selectedInstructorResourceId.set(suggestion.instructorCalendarResourceId);
    }
    if (suggestion.vehicleCalendarResourceId) {
      this.keepVehicle.set(false);
      this.selectedVehicleResourceId.set(suggestion.vehicleCalendarResourceId);
    }
    if (suggestion.roomCalendarResourceId)
      this.selectedRoomResourceId.set(suggestion.roomCalendarResourceId);
    this.impact.set(null);
    this.searchDrawerOpen.set(false);
    this.step.set('resources');
  }

  backToBooking(): void {
    void this.router.navigate(['/planning/calendar'], {
      queryParams: { bookingId: this.bookingId },
    });
  }
  backToCalendar(): void {
    void this.router.navigate(['/planning/calendar']);
  }

  setReason(value: string): void {
    this.reason.set(value);
    this.impact.set(null);
  }
  setStart(value: string): void {
    this.startAt.set(value);
    this.impact.set(null);
  }
  setEnd(value: string): void {
    this.endAt.set(value);
    this.impact.set(null);
  }
  setBranch(value: string): void {
    this.branchId.set(value);
    this.impact.set(null);
  }
  setKeepInstructor(value: boolean): void {
    this.keepInstructor.set(value);
    this.impact.set(null);
  }
  setKeepVehicle(value: boolean): void {
    this.keepVehicle.set(value);
    this.impact.set(null);
  }
  setInstructor(value: string): void {
    this.selectedInstructorResourceId.set(value);
    this.impact.set(null);
  }
  setVehicle(value: string): void {
    this.selectedVehicleResourceId.set(value);
    this.impact.set(null);
  }
  setRoom(value: string): void {
    this.selectedRoomResourceId.set(value);
    this.impact.set(null);
  }

  resourceName(id: string | null): string {
    return id ? (this.resources().find((x) => x.id === id)?.displayName ?? id.slice(0, 8)) : '—';
  }
  branchLabel(id: string | null): string {
    return id
      ? (this.resources().find(
          (x) =>
            this.resourceTypeCode(x.resourceType) === '5' &&
            (x.id === id || x.externalResourceId === id),
        )?.displayName ?? id.slice(0, 8))
      : '—';
  }
  impactStateClass(state: string): string {
    return state === 'blocked'
      ? 'bg-rose-50 text-rose-700'
      : state === 'external-review'
        ? 'bg-amber-50 text-amber-700'
        : state === 'changed' || state === 'required'
          ? 'bg-blue-50 text-blue-700'
          : 'bg-emerald-50 text-emerald-700';
  }
  conflictTypeKey(type: number): string {
    return `scheduling.conflicts.${this.conflictTypeName(type)}`;
  }
  reasonKey(reason: string): string {
    return reason.startsWith('scheduling.') ? reason : `scheduling.slotSearch.reasons.${reason}`;
  }
  private conflictTypeName(type: number): string {
    return (
      (
        {
          1: 'InstructorOverlap',
          2: 'StudentOverlap',
          3: 'VehicleOverlap',
          4: 'RoomOverlap',
          5: 'TravelTimeConflict',
          6: 'QualificationConflict',
          7: 'WorkingTimeViolation',
          8: 'DocumentRestriction',
          9: 'FinancialRestriction',
          10: 'MaintenanceConflict',
          11: 'LocationConflict',
          12: 'CapacityConflict',
          13: 'ResourceUnavailable',
          14: 'AdministrativeBlock',
          15: 'CreditInsufficient',
          99: 'Other',
        } as Record<number, string>
      )[type] ?? 'Other'
    );
  }

  private buildRequest(): BookingRescheduleRequest | null {
    const startAtUtc = this.toIso(this.startAt());
    const endAtUtc = this.toIso(this.endAt());
    if (!this.reason().trim() || !startAtUtc || !endAtUtc || endAtUtc <= startAtUtc) {
      this.errors.set(['scheduling.reschedule.validation.required']);
      return null;
    }
    return {
      operationId: this.operationId(),
      startAtUtc,
      endAtUtc,
      branchId: this.branchId() || null,
      resources: this.selectedResources(),
      reason: this.reason().trim(),
    };
  }

  private firstBookingResourceByTypes(booking: Booking, types: readonly string[]): string | null {
    return (
      booking.resources.find((x) =>
        types.includes(
          this.resourceTypeCode(
            this.resources().find((r) => r.id === x.calendarResourceId)?.resourceType ?? '99',
          ),
        ),
      )?.calendarResourceId ?? null
    );
  }
  private externalResourceId(calendarResourceId: string): string | null {
    return this.resources().find((x) => x.id === calendarResourceId)?.externalResourceId ?? null;
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
  private toLocalDateTime(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
  private toIso(value: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
}
