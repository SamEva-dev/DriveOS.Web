import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
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
  BookingCancellation,
  BookingCancellationPreview,
  CancelBookingRequest,
  OverrideCancelBookingRequest,
} from '../../models/scheduling.models';

type CancelStep = 'reason' | 'policy' | 'notifications' | 'confirmation';

@Component({
  selector: 'driveos-scheduling-cancel-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-cancel.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingCancelPage {
  private readonly api = inject(SchedulingApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly bookingId = this.route.snapshot.paramMap.get('bookingId') ?? '';
  readonly loading = signal(true);
  readonly previewing = signal(false);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly booking = signal<Booking | null>(null);
  readonly preview = signal<BookingCancellationPreview | null>(null);
  readonly result = signal<BookingCancellation | null>(null);
  readonly step = signal<CancelStep>('reason');
  readonly overrideOpen = signal(false);

  readonly initiator = signal(4);
  readonly reasonCode = signal(7);
  readonly reasonDetails = signal('');
  readonly notificationDecision = signal(1);
  readonly overrideReason = signal('');
  readonly operationId = signal(crypto.randomUUID());

  readonly canCancel = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.cancel),
  );
  readonly canOverride = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.cancelOverride),
  );
  readonly isAlreadyCancelled = computed(
    () => this.booking()?.status === 4 || !!this.booking()?.cancellation,
  );
  readonly canPreview = computed(() => {
    if (!this.booking() || this.isAlreadyCancelled()) return false;
    if (this.reasonCode() === 10 && !this.reasonDetails().trim()) return false;
    return !this.previewing() && !this.saving();
  });
  readonly canSubmit = computed(
    () => this.canCancel() && !!this.preview() && !this.saving() && !this.isAlreadyCancelled(),
  );
  readonly noticeHours = computed(() =>
    Math.max(0, Math.floor((this.preview()?.noticeDurationMinutes ?? 0) / 60)),
  );
  readonly noticeMinutesRemainder = computed(() =>
    Math.max(0, (this.preview()?.noticeDurationMinutes ?? 0) % 60),
  );

  readonly steps: readonly { id: CancelStep; key: string; icon: string }[] = [
    { id: 'reason', key: 'scheduling.cancel.steps.reason', icon: 'ph ph-note-pencil' },
    { id: 'policy', key: 'scheduling.cancel.steps.policy', icon: 'ph ph-shield-check' },
    { id: 'notifications', key: 'scheduling.cancel.steps.notifications', icon: 'ph ph-bell' },
    { id: 'confirmation', key: 'scheduling.cancel.steps.confirmation', icon: 'ph ph-check-circle' },
  ];

  readonly initiators = [1, 2, 3, 4, 5, 6, 7] as const;
  readonly reasons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
  readonly notifications = [1, 2, 3] as const;

  constructor() {
    this.load();
  }

  load(): void {
    if (!this.bookingId) {
      this.loading.set(false);
      this.errors.set(['scheduling.cancel.validation.bookingRequired']);
      return;
    }
    this.loading.set(true);
    this.api.getBooking(this.bookingId).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.result.set(booking.cancellation ?? null);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  setStep(step: CancelStep): void {
    this.step.set(step);
  }

  previewCancellation(): void {
    if (!this.canPreview()) return;
    this.previewing.set(true);
    this.errors.set([]);
    this.api
      .previewBookingCancellation(this.bookingId, {
        initiator: this.initiator(),
        initiatorId: null,
        reasonCode: this.reasonCode(),
        reasonDetails: this.normalizedDetails(),
      })
      .subscribe({
        next: (preview) => {
          this.preview.set(preview);
          this.previewing.set(false);
          this.step.set('policy');
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.apiErrors.getMessages(error));
          this.previewing.set(false);
        },
      });
  }

  cancel(): void {
    if (!this.canSubmit()) return;
    this.submit(false);
  }

  openOverride(): void {
    if (!this.canOverride() || !this.preview()) return;
    this.overrideReason.set('');
    this.overrideOpen.set(true);
  }

  closeOverride(): void {
    if (!this.saving()) this.overrideOpen.set(false);
  }

  applyOverride(): void {
    if (!this.overrideReason().trim() || !this.canOverride()) return;
    this.submit(true);
  }

  backToBooking(): void {
    void this.router.navigate(['/planning/calendar'], {
      queryParams: { bookingId: this.bookingId },
    });
  }

  initiatorKey(value: number): string {
    return `scheduling.cancel.initiators.${value}`;
  }
  reasonKey(value: number): string {
    return `scheduling.cancel.reasons.${value}`;
  }
  notificationKey(value: number): string {
    return `scheduling.cancel.notifications.${value}`;
  }
  creditDecisionKey(value: number): string {
    return `scheduling.cancel.creditDecisions.${value}`;
  }
  feeDecisionKey(value: number): string {
    return `scheduling.cancel.feeDecisions.${value}`;
  }

  private submit(overrideApplied: boolean): void {
    const preview = this.preview();
    if (!preview) return;
    this.saving.set(true);
    this.errors.set([]);
    const base: CancelBookingRequest = {
      operationId: this.operationId(),
      initiator: this.initiator(),
      initiatorId: null,
      reasonCode: this.reasonCode(),
      reasonDetails: this.normalizedDetails(),
      notificationDecision: this.notificationDecision(),
    };
    const request$ = overrideApplied
      ? this.api.overrideCancelBooking(this.bookingId, {
          ...base,
          overrideReason: this.overrideReason().trim(),
        } as OverrideCancelBookingRequest)
      : this.api.cancelBooking(this.bookingId, base);

    request$.subscribe({
      next: (result) => {
        this.result.set(result);
        this.saving.set(false);
        this.overrideOpen.set(false);
        this.step.set('confirmation');
        this.api
          .getBooking(this.bookingId)
          .subscribe({ next: (booking) => this.booking.set(booking) });
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private normalizedDetails(): string | null {
    const value = this.reasonDetails().trim();
    return value || null;
  }
}
