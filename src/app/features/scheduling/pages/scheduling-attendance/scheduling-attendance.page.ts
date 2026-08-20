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
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  Booking,
  BookingAttendance,
  BookingAttendanceRequest,
  CalendarResource,
} from '../../models/scheduling.models';

type AttendanceMode = 'quick' | 'details' | 'history';

@Component({
  selector: 'driveos-scheduling-attendance-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-attendance.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingAttendancePage {
  private readonly api = inject(SchedulingApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly booking = signal<Booking | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly mode = signal<AttendanceMode>('quick');
  readonly correctionOpen = signal(false);
  readonly overrideOpen = signal(false);

  readonly status = signal(1);
  readonly arrivalLocal = signal('');
  readonly departureLocal = signal('');
  readonly delayMinutes = signal(0);
  readonly reason = signal('');
  readonly evidenceDocumentId = signal('');
  readonly followUpAction = signal(0);
  readonly overrideReason = signal('');
  readonly operationId = signal(crypto.randomUUID());

  readonly canRecord = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.attendance.record),
  );
  readonly canCorrect = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.attendance.updateWithinWindow),
  );
  readonly canOverride = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.attendance.override),
  );
  readonly currentAttendance = computed(() => this.booking()?.attendance ?? null);
  readonly history = computed(() =>
    [...(this.booking()?.attendanceHistory ?? [])].sort((a, b) =>
      b.recordedAtUtc.localeCompare(a.recordedAtUtc),
    ),
  );
  readonly isCorrection = computed(() => !!this.currentAttendance());
  readonly studentName = computed(
    () => this.resourceNameByType('Student') ?? this.resourceNameByParticipantType(1) ?? '—',
  );
  readonly instructorName = computed(() => this.resourceNameByType('Instructor') ?? '—');
  readonly canSave = computed(() => {
    const allowed = this.currentAttendance() ? this.canCorrect() : this.canRecord();
    if (!allowed || this.saving() || !this.booking()) return false;
    if ([1, 2, 5].includes(this.status()) && !this.arrivalLocal()) return false;
    if (this.status() === 2 && this.delayMinutes() <= 0) return false;
    return true;
  });

  readonly statuses = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
  readonly quickStatuses = [1, 2, 3] as const;
  readonly followUps = [0, 1, 2, 3, 4, 5, 6] as const;

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.bookingId) {
      this.loading.set(false);
      this.errors.set(['scheduling.attendance.validation.bookingRequired']);
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
        if (booking.attendance) this.prefill(booking.attendance);
        else this.prefillDefaults(booking);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  selectQuickStatus(value: number): void {
    this.status.set(value);
    if (value === 1) {
      this.delayMinutes.set(0);
      if (!this.arrivalLocal()) this.arrivalLocal.set(this.toLocalInput(new Date().toISOString()));
    }
    if (value === 2 && this.delayMinutes() <= 0) this.delayMinutes.set(5);
    if (value === 3) {
      this.arrivalLocal.set('');
      this.departureLocal.set('');
    }
  }

  save(): void {
    if (!this.canSave()) return;
    if (this.currentAttendance()) {
      if (this.canCorrect()) this.correctionOpen.set(true);
      return;
    }
    this.persist(false);
  }

  confirmCorrection(): void {
    if (!this.canCorrect() || this.saving()) return;
    this.correctionOpen.set(false);
    this.persist(false, true);
  }

  confirmOverride(): void {
    if (!this.canOverride() || !this.overrideReason().trim() || this.saving()) return;
    this.overrideOpen.set(false);
    this.persist(true, true);
  }

  private persist(overrideApplied: boolean, correction = false): void {
    const request = this.buildRequest();
    this.saving.set(true);
    this.errors.set([]);
    const operation = overrideApplied
      ? this.api.overrideBookingAttendance(this.bookingId, {
          ...request,
          overrideReason: this.overrideReason().trim(),
        })
      : correction
        ? this.api.correctBookingAttendance(this.bookingId, request)
        : this.api.recordBookingAttendance(this.bookingId, request);

    operation.subscribe({
      next: () => {
        this.operationId.set(crypto.randomUUID());
        this.overrideReason.set('');
        this.saving.set(false);
        this.load();
        this.mode.set('history');
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  openOverride(): void {
    if (this.canOverride()) this.overrideOpen.set(true);
  }
  closeCorrection(): void {
    if (!this.saving()) this.correctionOpen.set(false);
  }
  closeOverride(): void {
    if (!this.saving()) this.overrideOpen.set(false);
  }

  goReschedule(): void {
    void this.router.navigate(['/planning/bookings', this.bookingId, 'reschedule']);
  }
  goBack(): void {
    void this.router.navigate(['/planning/calendar'], {
      queryParams: { bookingId: this.bookingId },
    });
  }

  statusKey(value: number): string {
    return `scheduling.attendance.status.${value}`;
  }
  chargeKey(value: number): string {
    return `scheduling.attendance.chargeDecision.${value}`;
  }
  creditKey(value: number): string {
    return `scheduling.attendance.creditDecision.${value}`;
  }
  followUpKey(value: number): string {
    return `scheduling.attendance.followUp.${value}`;
  }

  private buildRequest(): BookingAttendanceRequest {
    return {
      operationId: this.operationId(),
      status: this.status(),
      arrivalTimeUtc: this.fromLocalInput(this.arrivalLocal()),
      departureTimeUtc: this.fromLocalInput(this.departureLocal()),
      delayMinutes: Math.max(0, Number(this.delayMinutes()) || 0),
      reason: this.reason().trim() || null,
      evidenceDocumentId: this.asGuidOrNull(this.evidenceDocumentId()),
      followUpAction: this.followUpAction(),
    };
  }

  private prefill(attendance: BookingAttendance): void {
    this.status.set(attendance.status);
    this.arrivalLocal.set(this.toLocalInput(attendance.arrivalTimeUtc));
    this.departureLocal.set(this.toLocalInput(attendance.departureTimeUtc));
    this.delayMinutes.set(attendance.delayMinutes);
    this.reason.set(attendance.reason ?? '');
    this.evidenceDocumentId.set(attendance.evidenceDocumentId ?? '');
    this.followUpAction.set(attendance.followUpAction);
  }

  private prefillDefaults(booking: Booking): void {
    const now = new Date();
    const start = new Date(booking.startAtUtc);
    if (Math.abs(now.getTime() - start.getTime()) <= 30 * 60_000) {
      this.arrivalLocal.set(this.toLocalInput(now.toISOString()));
    }
  }

  private resourceNameByType(type: string): string | null {
    const booking = this.booking();
    if (!booking) return null;
    const ids = new Set(booking.resources.map((x) => x.calendarResourceId));
    return (
      this.resources().find(
        (x) => ids.has(x.id) && String(x.resourceType).toLowerCase() === type.toLowerCase(),
      )?.displayName ?? null
    );
  }

  private resourceNameByParticipantType(type: number): string | null {
    const participant = this.booking()?.participants.find((x) => x.participantType === type);
    return participant?.externalParticipantId ?? null;
  }

  private toLocalInput(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private fromLocalInput(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }
  private asGuidOrNull(value: string): string | null {
    const normalized = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      normalized,
    )
      ? normalized
      : null;
  }
}
