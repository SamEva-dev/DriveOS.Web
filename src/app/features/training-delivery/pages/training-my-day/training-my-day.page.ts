import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import { TrainingDeliveryDashboard, TrainingDeliveryDashboardSession } from '../../models/training-delivery.models';

@Component({
  selector: 'driveos-training-my-day-page',
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
  templateUrl: './training-my-day.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingMyDayPage {
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly router = inject(Router);

  readonly selectedDate = signal(this.startOfDay(new Date()));
  readonly data = signal<TrainingDeliveryDashboard | null>(null);
  readonly loading = signal(true);
  readonly translatedErrors = signal<readonly string[]>([]);
  readonly selectedSession = signal<TrainingDeliveryDashboardSession | null>(null);

  readonly sessions = computed(() => this.data()?.sessions ?? []);
  readonly completedCount = computed(() => this.sessions().filter((x) => x.status === 4).length);
  readonly remainingCount = computed(() => this.sessions().filter((x) => ![4, 5].includes(x.status)).length);
  readonly attentionCount = computed(() => this.sessions().filter((x) => this.requiresAttention(x)).length);
  readonly deliveredMinutes = computed(() => this.sessions().reduce((sum, x) => sum + (x.deliveredDurationMinutes ?? 0), 0));

  readonly activeSession = computed(() => {
    const inProgress = this.sessions().find((x) => x.status === 3 || x.status === 6);
    if (inProgress) return inProgress;

    const now = Date.now();
    return this.sessions().find((x) => {
      const start = new Date(x.plannedStartAtUtc).getTime();
      const end = new Date(x.plannedEndAtUtc).getTime();
      return start <= now && now < end && ![4, 5].includes(x.status);
    }) ?? null;
  });

  readonly nextSession = computed(() => {
    const now = Date.now();
    return this.sessions().find((x) => new Date(x.plannedStartAtUtc).getTime() > now && ![4, 5].includes(x.status)) ?? null;
  });

  constructor() {
    this.load();
  }

  load(): void {
    const start = this.startOfDay(this.selectedDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    this.loading.set(true);
    this.translatedErrors.set([]);
    this.api.getMyDay(start.toISOString(), end.toISOString()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.translatedErrors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  previousDay(): void {
    this.changeDay(-1);
  }

  nextDay(): void {
    this.changeDay(1);
  }

  today(): void {
    this.selectedDate.set(this.startOfDay(new Date()));
    this.load();
  }

  openSession(session: TrainingDeliveryDashboardSession): void {
    this.selectedSession.set(session);
  }

  closeDrawer(): void {
    this.selectedSession.set(null);
  }

  openFullSession(sessionId: string): void {
    void this.router.navigate(['/training/sessions', sessionId]);
  }

  statusKey(status: number): string {
    return `training.statuses.session.${status}`;
  }

  attendanceKey(status: number | null): string {
    return status === null ? 'training.statuses.attendance.none' : `training.statuses.attendance.${status}`;
  }

  plannedDurationMinutes(session: TrainingDeliveryDashboardSession): number {
    return Math.max(0, Math.round((new Date(session.plannedEndAtUtc).getTime() - new Date(session.plannedStartAtUtc).getTime()) / 60_000));
  }

  isLate(session: TrainingDeliveryDashboardSession): boolean {
    return new Date(session.plannedStartAtUtc).getTime() < Date.now() && (session.status === 1 || session.status === 2);
  }

  requiresAttention(session: TrainingDeliveryDashboardSession): boolean {
    return this.isLate(session) || session.hasOpenIncident || (session.status === 4 && !session.hasReport);
  }

  isToday(): boolean {
    const today = this.startOfDay(new Date());
    return this.selectedDate().getTime() === today.getTime();
  }

  private changeDay(offset: number): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() + offset);
    this.selectedDate.set(this.startOfDay(next));
    this.load();
  }

  private startOfDay(value: Date): Date {
    const result = new Date(value);
    result.setHours(0, 0, 0, 0);
    return result;
  }
}
