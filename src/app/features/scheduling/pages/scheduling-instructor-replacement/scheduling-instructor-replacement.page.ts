import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  InstructorReplacementApplyResult,
  InstructorReplacementPreview,
  InstructorReplacementRequest,
  InstructorReplacementSuggestion,
} from '../../models/scheduling.models';

type ReplacementStep = 'scope' | 'suggestions' | 'impacts' | 'confirmation';

@Component({
  selector: 'driveos-scheduling-instructor-replacement-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    RouterLink,
    RouterLinkActive,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-instructor-replacement.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingInstructorReplacementPage {
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
  readonly success = signal<InstructorReplacementApplyResult | null>(null);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly bookings = signal<readonly Booking[]>([]);
  readonly suggestions = signal<readonly InstructorReplacementSuggestion[]>([]);
  readonly preview = signal<InstructorReplacementPreview | null>(null);
  readonly selectedCandidate = signal<InstructorReplacementSuggestion | null>(null);
  readonly candidateDrawerOpen = signal(false);
  readonly confirmationDrawerOpen = signal(false);
  readonly step = signal<ReplacementStep>('scope');

  readonly previousInstructorId = signal('');
  readonly mode = signal(1);
  readonly fromLocal = signal(this.localInput(new Date()));
  readonly toLocal = signal(this.localInput(new Date(Date.now() + 14 * 86400000)));
  readonly selectedBookingIds = signal<readonly string[]>([]);
  readonly reason = signal('');
  readonly accessExpiresLocal = signal('');
  readonly operationId = signal(crypto.randomUUID());

  readonly canRead = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.instructorReplacement.read),
  );
  readonly canAssign = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.instructorReplacement.assign),
  );
  readonly instructors = computed(() =>
    this.resources().filter((x) => this.resourceType(x.resourceType) === 'Instructor'),
  );
  readonly vehicles = computed(() =>
    this.resources().filter((x) =>
      ['Vehicle', 'ExamVehicle'].includes(this.resourceType(x.resourceType)),
    ),
  );
  readonly relevantBookings = computed(() => {
    const instructorId = this.previousInstructorId();
    const resourceIds = new Set(
      this.instructors()
        .filter((x) => x.externalResourceId === instructorId)
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
  readonly affectedStudentIds = computed(() => [
    ...new Set(
      this.selectedBookings().flatMap((b) =>
        b.participants.filter((p) => p.participantType === 1).map((p) => p.externalParticipantId),
      ),
    ),
  ]);
  readonly affectedVehicleIds = computed(() => {
    const resourceById = new Map(this.resources().map((r) => [r.id, r]));
    return [
      ...new Set(
        this.selectedBookings().flatMap((b) =>
          b.resources
            .map((r) => resourceById.get(r.calendarResourceId))
            .filter(
              (r): r is CalendarResource =>
                !!r && ['Vehicle', 'ExamVehicle'].includes(this.resourceType(r.resourceType)),
            )
            .map((r) => r.externalResourceId),
        ),
      ),
    ];
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
      !!this.previousInstructorId() &&
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
    { value: 4, key: 'allFutureSessions' },
    { value: 5, key: 'temporaryAssignment' },
    { value: 6, key: 'permanentReassignment' },
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
          const instructorResource = booking?.resources
            .map((r) => resources.find((x) => x.id === r.calendarResourceId))
            .find((x) => x && this.resourceType(x.resourceType) === 'Instructor');
          if (instructorResource)
            this.previousInstructorId.set(instructorResource.externalResourceId);
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

  setPreviousInstructor(id: string): void {
    this.previousInstructorId.set(id);
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
      .suggestInstructorReplacements({
        previousInstructorId: this.previousInstructorId(),
        bookingIds: this.selectedBookingIds(),
        trainingCategory:
          this.trainingCategories().length === 1 ? this.trainingCategories()[0] : '',
      })
      .subscribe({
        next: (suggestions) => {
          this.suggestions.set(suggestions);
          this.searching.set(false);
          this.step.set('suggestions');
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  inspect(candidate: InstructorReplacementSuggestion): void {
    this.selectedCandidate.set(candidate);
    this.candidateDrawerOpen.set(true);
  }

  choose(candidate: InstructorReplacementSuggestion): void {
    this.selectedCandidate.set(candidate);
    this.candidateDrawerOpen.set(false);
    this.previewReplacement();
  }

  previewReplacement(): void {
    const request = this.buildRequest(false);
    if (!request) return;
    this.previewing.set(true);
    this.errors.set([]);
    this.api.previewInstructorReplacement(request).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.previewing.set(false);
        this.step.set('impacts');
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as InstructorReplacementPreview | undefined;
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
    this.api.applyInstructorReplacement(request).subscribe({
      next: (result) => {
        this.success.set(result);
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

  resourceName(resourceId: string): string {
    return this.resources().find((x) => x.id === resourceId)?.displayName ?? resourceId.slice(0, 8);
  }
  instructorName(id: string): string {
    return (
      this.instructors().find((x) => x.externalResourceId === id)?.displayName ?? id.slice(0, 8)
    );
  }
  branchName(id: string | null): string {
    return id ? (this.resources().find((x) => x.branchId === id)?.branchId ?? id.slice(0, 8)) : '—';
  }
  factorKey(value: string): string {
    return value.startsWith('availability:')
      ? 'scheduling.instructorReplacement.factors.availability'
      : `scheduling.instructorReplacement.factors.${this.normalizeToken(value)}`;
  }
  reviewKey(value: string): string {
    return `scheduling.instructorReplacement.externalReviews.${this.normalizeToken(value)}`;
  }
  blockingKey(value: string): string {
    const suffix = value.includes(':') ? value.split(':').slice(-1)[0] : value;
    return `scheduling.instructorReplacement.blocking.${this.normalizeToken(suffix)}`;
  }
  bookingDurationMinutes(b: Booking): number {
    return Math.max(
      0,
      Math.round((new Date(b.endAtUtc).getTime() - new Date(b.startAtUtc).getTime()) / 60000),
    );
  }

  private applyModeSelection(): void {
    const items = this.relevantBookings();
    if (!items.length) return;
    if (this.mode() === 1 && this.selectedBookingIds().length !== 1)
      this.selectedBookingIds.set([items[0].id]);
    if ([3, 4, 5, 6].includes(this.mode())) this.selectedBookingIds.set(items.map((x) => x.id));
  }

  private buildRequest(requireReason: boolean): InstructorReplacementRequest | null {
    const candidate = this.selectedCandidate();
    if (!candidate || !this.previousInstructorId() || !this.selectedBookingIds().length)
      return null;
    if (requireReason && !this.reason().trim()) return null;
    return {
      operationId: this.operationId(),
      previousInstructorId: this.previousInstructorId(),
      replacementInstructorId: candidate.instructorId,
      mode: this.mode(),
      bookingIds: this.selectedBookingIds(),
      trainingCategory: this.trainingCategories().length === 1 ? this.trainingCategories()[0] : '',
      reason: this.reason().trim() || 'preview',
      accessExpiresAtUtc: this.accessExpiresLocal() ? this.toIso(this.accessExpiresLocal()) : null,
    };
  }

  private resetResults(): void {
    this.suggestions.set([]);
    this.preview.set(null);
    this.selectedCandidate.set(null);
    this.success.set(null);
    this.operationId.set(crypto.randomUUID());
  }
  private loadAfterApply(): void {
    const ids = new Set(this.selectedBookingIds());
    this.bookings.update((xs) => xs.filter((x) => !ids.has(x.id)));
  }
  private toIso(value: string): string | null {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  private localInput(date: Date): string {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  }
  private resourceType(value: string | number): string {
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
    };
    return typeof value === 'number'
      ? (map[String(value)] ?? String(value))
      : (map[value] ?? value);
  }
  private normalizeToken(value: string): string {
    return value
      .replace(/[:.\-]/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toLowerCase();
  }
}
