import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingDashboardService } from '../../data-access/scheduling-dashboard.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import { SchedulingDashboardData } from '../../models/scheduling.models';

@Component({
  selector: 'driveos-scheduling-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingDashboardPage {
  private readonly dashboardService = inject(SchedulingDashboardService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);

  readonly data = signal<SchedulingDashboardData | null>(null);
  readonly loading = signal(true);
  readonly translatedErrors = signal<readonly string[]>([]);
  readonly quickActionsOpen = signal(false);

  readonly canCreateBooking = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.create),
  );
  readonly canSearchSlots = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.slotSearch),
  );
  readonly canManageWaitingList = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.waitingList.manage),
  );

  readonly todayBookings = computed(() =>
    [...(this.data()?.bookings ?? [])]
      .filter((booking) => booking.status !== 4)
      .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc)),
  );
  readonly activeConflicts = computed(() =>
    (this.data()?.conflicts ?? []).filter(
      (conflict) => conflict.status === 1 || conflict.status === 2,
    ),
  );
  readonly criticalConflicts = computed(() =>
    this.activeConflicts().filter((conflict) => conflict.priority === 4),
  );
  readonly activeWaitingList = computed(() =>
    (this.data()?.waitingList ?? []).filter((entry) => [1, 2, 3, 4, 5].includes(entry.status)),
  );
  readonly unavailableResources = computed(() =>
    (this.data()?.resources ?? []).filter((resource) => resource.status !== 'Active'),
  );
  readonly saturation = computed(
    () => this.data()?.capacity?.summary.saturationRatePercent ?? null,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.translatedErrors.set([]);
    this.dashboardService.load().subscribe({
      next: ({ data, errors }) => {
        this.data.set(data);
        this.translatedErrors.set(this.translateErrors(errors));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.translatedErrors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  openQuickActions(): void {
    this.quickActionsOpen.set(true);
  }

  closeQuickActions(): void {
    this.quickActionsOpen.set(false);
  }

  conflictPriorityKey(priority: number): string {
    return `scheduling.conflicts.priority.${priority}`;
  }

  resourceStatusKey(status: string): string {
    return `scheduling.resources.status.${status}`;
  }

  bookingStatusKey(status: number): string {
    return `scheduling.bookings.status.${status}`;
  }

  private translateErrors(errors: readonly HttpErrorResponse[]): readonly string[] {
    return [...new Set(errors.flatMap((error) => this.apiErrors.getMessages(error)))];
  }
}
