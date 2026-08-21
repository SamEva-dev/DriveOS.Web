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
import { TrainingDeliveryDashboardSession } from '../../models/training-delivery.models';

type PeriodPreset = 'today' | 'week' | 'month';
type AttentionFilter = 'all' | 'reports' | 'incidents' | 'duration' | 'late';

@Component({
  selector: 'driveos-training-sessions-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, DriveOsButtonComponent, DriveOsDrawerComponent, DriveOsEmptyStateComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './training-sessions.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingSessionsPage {
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly router = inject(Router);

  readonly sessions = signal<readonly TrainingDeliveryDashboardSession[]>([]);
  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly period = signal<PeriodPreset>('week');
  readonly query = signal('');
  readonly status = signal<number | null>(null);
  readonly attendance = signal<number | null>(null);
  readonly attention = signal<AttentionFilter>('all');
  readonly filtersOpen = signal(false);
  readonly selectedSession = signal<TrainingDeliveryDashboardSession | null>(null);
  readonly detailsOpen = signal(false);

  readonly activeFilterCount = computed(() => [this.status(), this.attendance(), this.attention() !== 'all' ? this.attention() : null, this.query().trim() || null].filter((x) => x !== null).length);
  readonly filteredSessions = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return this.sessions().filter((session) => {
      if (this.status() !== null && session.status !== this.status()) return false;
      if (this.attendance() !== null && session.attendanceStatus !== this.attendance()) return false;
      if (q && !`${session.studentDisplayName} ${session.trainingCategory ?? ''} ${session.meetingPoint ?? ''}`.toLocaleLowerCase().includes(q)) return false;
      switch (this.attention()) {
        case 'reports': return this.isMissingReport(session);
        case 'incidents': return session.hasOpenIncident;
        case 'duration': return this.hasDurationVariance(session);
        case 'late': return this.isLate(session);
        default: return true;
      }
    });
  });
  readonly totalCompleted = computed(() => this.filteredSessions().filter((x) => x.status === 4).length);
  readonly totalInProgress = computed(() => this.filteredSessions().filter((x) => x.status === 3 || x.status === 6).length);
  readonly totalAttention = computed(() => this.filteredSessions().filter((x) => this.isMissingReport(x) || x.hasOpenIncident || this.hasDurationVariance(x) || this.isLate(x)).length);

  constructor() { this.load(); }

  setPeriod(period: PeriodPreset): void { this.period.set(period); this.load(); }
  updateQuery(value: string): void { this.query.set(value); }
  setStatus(value: string): void { this.status.set(value === '' ? null : Number(value)); }
  setAttendance(value: string): void { this.attendance.set(value === '' ? null : Number(value)); }
  setAttention(value: string): void { this.attention.set(value as AttentionFilter); }
  resetFilters(): void { this.query.set(''); this.status.set(null); this.attendance.set(null); this.attention.set('all'); }
  openSession(session: TrainingDeliveryDashboardSession): void { this.selectedSession.set(session); this.detailsOpen.set(true); }
  closeDetails(): void { this.detailsOpen.set(false); this.selectedSession.set(null); }
  openFullSession(sessionId: string): void { void this.router.navigate(['/training/sessions', sessionId]); }

  load(): void {
    const { start, end } = this.window();
    this.loading.set(true); this.errors.set([]);
    this.api.getDashboard(start.toISOString(), end.toISOString()).subscribe({
      next: (data) => { this.sessions.set(data.sessions); this.loading.set(false); },
      error: (error: HttpErrorResponse) => { this.errors.set(this.apiErrors.getMessages(error)); this.loading.set(false); },
    });
  }

  statusKey(status: number): string { return `training.statuses.session.${status}`; }
  attendanceKey(status: number | null): string { return status === null ? 'training.statuses.attendance.none' : `training.statuses.attendance.${status}`; }
  plannedDurationMinutes(s: TrainingDeliveryDashboardSession): number { return Math.max(0, Math.round((new Date(s.plannedEndAtUtc).getTime() - new Date(s.plannedStartAtUtc).getTime()) / 60000)); }
  durationDifferenceMinutes(s: TrainingDeliveryDashboardSession): number | null { return s.deliveredDurationMinutes === null ? null : s.deliveredDurationMinutes - this.plannedDurationMinutes(s); }
  isMissingReport(s: TrainingDeliveryDashboardSession): boolean { return s.status === 4 && !s.hasReport; }
  isLate(s: TrainingDeliveryDashboardSession): boolean { return new Date(s.plannedStartAtUtc).getTime() < Date.now() && (s.status === 1 || s.status === 2); }
  hasDurationVariance(s: TrainingDeliveryDashboardSession): boolean { const d=this.durationDifferenceMinutes(s); return d !== null && Math.abs(d) >= 15; }
  hasAttention(s: TrainingDeliveryDashboardSession): boolean { return this.isMissingReport(s) || s.hasOpenIncident || this.hasDurationVariance(s) || this.isLate(s); }

  private window(): { start: Date; end: Date } {
    const now = new Date(); const start = new Date(now); start.setHours(0,0,0,0); const end = new Date(start);
    if (this.period() === 'today') end.setDate(end.getDate()+1);
    else if (this.period() === 'week') { start.setDate(start.getDate()-3); end.setDate(end.getDate()+8); }
    else { start.setDate(1); end.setMonth(end.getMonth()+1,1); }
    return { start, end };
  }
}
