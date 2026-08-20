import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import { Booking, CalendarResource, SchedulingConflict } from '../../models/scheduling.models';

type InboxTab = 'active' | 'critical' | 'overrides' | 'history';
type DrawerMode = 'detail' | 'resolve' | 'override' | null;

@Component({
  selector: 'driveos-scheduling-conflicts-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-conflicts.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingConflictsPage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly conflicts = signal<readonly SchedulingConflict[]>([]);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly bookings = signal<ReadonlyMap<string, Booking>>(new Map());
  readonly selectedConflictId = signal<string | null>(null);
  readonly selectedConflictingBooking = signal<Booking | null>(null);
  readonly drawerMode = signal<DrawerMode>(null);
  readonly inboxTab = signal<InboxTab>('active');
  readonly priorityFilter = signal<number | null>(null);
  readonly typeFilter = signal<number | null>(null);
  readonly search = signal('');

  readonly resolution = signal(1);
  readonly resolutionReason = signal('');
  readonly overrideReason = signal('');
  readonly overrideRisk = signal('');
  readonly overrideExpiresAt = signal(this.defaultExpiry());

  readonly canResolve = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.conflicts.resolve),
  );
  readonly canOverride = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.conflicts.override),
  );
  readonly selectedConflict = computed(
    () => this.conflicts().find((x) => x.id === this.selectedConflictId()) ?? null,
  );
  readonly selectedBooking = computed(() => {
    const id = this.selectedConflict()?.bookingId;
    return id ? (this.bookings().get(id) ?? null) : null;
  });

  readonly activeCount = computed(
    () => this.conflicts().filter((x) => x.status === 1 || x.status === 2).length,
  );
  readonly criticalCount = computed(
    () =>
      this.conflicts().filter((x) => (x.status === 1 || x.status === 2) && x.priority === 4).length,
  );
  readonly overrideCount = computed(() => this.conflicts().filter((x) => x.status === 3).length);
  readonly filtered = computed(() => {
    const q = this.search().trim().toLocaleLowerCase();
    return this.conflicts().filter((conflict) => {
      if (this.inboxTab() === 'active' && !(conflict.status === 1 || conflict.status === 2))
        return false;
      if (
        this.inboxTab() === 'critical' &&
        !((conflict.status === 1 || conflict.status === 2) && conflict.priority === 4)
      )
        return false;
      if (this.inboxTab() === 'overrides' && conflict.status !== 3) return false;
      if (this.inboxTab() === 'history' && !(conflict.status === 4 || conflict.status === 5))
        return false;
      if (this.priorityFilter() != null && conflict.priority !== this.priorityFilter())
        return false;
      if (this.typeFilter() != null && conflict.type !== this.typeFilter()) return false;
      if (!q) return true;
      const booking = this.bookings().get(conflict.bookingId);
      return [
        booking?.title,
        conflict.causeKey,
        conflict.details,
        this.resourceLabel(conflict.calendarResourceId),
      ].some((value) => value?.toLocaleLowerCase().includes(q));
    });
  });

  readonly types = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 99] as const;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    this.successKey.set(null);
    forkJoin({ conflicts: this.api.getConflicts(), resources: this.api.getResources() }).subscribe({
      next: ({ conflicts, resources }) => {
        this.conflicts.set(conflicts);
        this.resources.set(resources);
        const ids = [
          ...new Set(
            conflicts.flatMap((x) =>
              [x.bookingId, x.conflictingBookingId].filter((id): id is string => !!id),
            ),
          ),
        ];
        if (!ids.length) {
          this.bookings.set(new Map());
          this.loading.set(false);
          return;
        }
        forkJoin(
          ids.map((id) => this.api.getBooking(id).pipe(catchError(() => of(null)))),
        ).subscribe({
          next: (items) => {
            this.bookings.set(
              new Map(items.filter((x): x is Booking => !!x).map((x) => [x.id, x])),
            );
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  openDetail(conflict: SchedulingConflict): void {
    this.selectedConflictId.set(conflict.id);
    this.selectedConflictingBooking.set(null);
    this.drawerMode.set('detail');
    if (conflict.conflictingBookingId) {
      const cached = this.bookings().get(conflict.conflictingBookingId);
      if (cached) this.selectedConflictingBooking.set(cached);
      else
        this.api
          .getBooking(conflict.conflictingBookingId)
          .subscribe({ next: (booking) => this.selectedConflictingBooking.set(booking) });
    }
  }

  openResolve(conflict = this.selectedConflict()): void {
    if (!conflict || !this.canResolve()) return;
    this.selectedConflictId.set(conflict.id);
    this.resolution.set(conflict.suggestedActions[0] ?? 8);
    this.resolutionReason.set('');
    this.drawerMode.set('resolve');
  }

  openOverride(conflict = this.selectedConflict()): void {
    if (!conflict || !this.canOverride() || conflict.priority === 4) return;
    this.selectedConflictId.set(conflict.id);
    this.overrideReason.set('');
    this.overrideRisk.set('');
    this.overrideExpiresAt.set(this.defaultExpiry());
    this.drawerMode.set('override');
  }

  closeDrawer(): void {
    if (!this.saving()) this.drawerMode.set(null);
  }

  refreshConflict(conflict = this.selectedConflict()): void {
    if (!conflict) return;
    this.saving.set(true);
    this.errors.set([]);
    this.api.refreshConflicts(conflict.bookingId).subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerMode.set(null);
        this.successKey.set('scheduling.conflictInbox.messages.refreshed');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.errors.set(this.errorApi.getMessages(error));
      },
    });
  }

  resolveConflict(): void {
    const conflict = this.selectedConflict();
    if (!conflict || !this.resolutionReason().trim()) return;
    this.saving.set(true);
    this.errors.set([]);
    this.api
      .resolveConflict(conflict.id, {
        resolution: this.resolution(),
        reason: this.resolutionReason().trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.drawerMode.set(null);
          this.successKey.set('scheduling.conflictInbox.messages.resolved');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.errors.set(this.errorApi.getMessages(error));
        },
      });
  }

  overrideConflict(): void {
    const conflict = this.selectedConflict();
    if (
      !conflict ||
      !this.overrideReason().trim() ||
      !this.overrideRisk().trim() ||
      !this.overrideExpiresAt()
    )
      return;
    this.saving.set(true);
    this.errors.set([]);
    this.api
      .overrideConflict(conflict.id, {
        reason: this.overrideReason().trim(),
        risk: this.overrideRisk().trim(),
        expiresAtUtc: new Date(this.overrideExpiresAt()).toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.drawerMode.set(null);
          this.successKey.set('scheduling.conflictInbox.messages.overridden');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.errors.set(this.errorApi.getMessages(error));
        },
      });
  }

  openBooking(conflict = this.selectedConflict()): void {
    if (!conflict) return;
    this.router.navigate(['/planning/calendar'], {
      queryParams: { bookingId: conflict.bookingId },
    });
  }

  setTab(tab: InboxTab): void {
    this.inboxTab.set(tab);
  }
  clearFilters(): void {
    this.priorityFilter.set(null);
    this.typeFilter.set(null);
    this.search.set('');
  }
  resourceLabel(id: string | null): string {
    return id ? (this.resources().find((x) => x.id === id)?.displayName ?? id.slice(0, 8)) : '—';
  }
  typeName(type: number): string {
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
  actionName(action: number): string {
    return (
      (
        {
          1: 'Reschedule',
          2: 'ReassignInstructor',
          3: 'ReassignVehicle',
          4: 'ChangeLocation',
          5: 'AdjustMargin',
          6: 'CancelBooking',
          7: 'AcceptRiskWithReason',
          8: 'RequestDecision',
          99: 'Other',
        } as Record<number, string>
      )[action] ?? 'Other'
    );
  }
  statusName(status: number): string {
    return (
      (
        {
          1: 'Open',
          2: 'ResolutionRequested',
          3: 'Overridden',
          4: 'Resolved',
          5: 'Obsolete',
        } as Record<number, string>
      )[status] ?? 'Open'
    );
  }
  isOverrideExpired(conflict: SchedulingConflict): boolean {
    return (
      conflict.status === 3 &&
      !!conflict.overrideExpiresAtUtc &&
      new Date(conflict.overrideExpiresAtUtc).getTime() <= Date.now()
    );
  }

  private defaultExpiry(): string {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
}
