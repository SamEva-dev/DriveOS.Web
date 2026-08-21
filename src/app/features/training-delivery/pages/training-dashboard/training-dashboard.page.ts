import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import {
  TrainingDashboardDrawerKind,
  TrainingDashboardTab,
  TrainingDeliveryDashboard,
  TrainingDeliveryDashboardSession,
} from '../../models/training-delivery.models';

interface DashboardKpiCard {
  readonly kind: Exclude<TrainingDashboardDrawerKind, 'session'>;
  readonly labelKey: string;
  readonly value: number | null;
  readonly icon: string;
  readonly emphasis: 'neutral' | 'primary' | 'warning' | 'danger' | 'success';
}

@Component({
  selector: 'driveos-training-dashboard-page',
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
  templateUrl: './training-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingDashboardPage {
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly apiErrors = inject(ApiErrorService);

  readonly data = signal<TrainingDeliveryDashboard | null>(null);
  readonly loading = signal(true);
  readonly translatedErrors = signal<readonly string[]>([]);
  readonly activeTab = signal<TrainingDashboardTab>('operations');
  readonly drawerKind = signal<TrainingDashboardDrawerKind | null>(null);
  readonly selectedSession = signal<TrainingDeliveryDashboardSession | null>(null);

  readonly kpis = computed<readonly DashboardKpiCard[]>(() => {
    const kpis = this.data()?.kpis;
    return [
      { kind: 'sessionsToday', labelKey: 'training.dashboard.kpis.sessionsToday', value: kpis?.sessionsToday ?? 0, icon: 'ph ph-calendar-check', emphasis: 'primary' },
      { kind: 'inProgress', labelKey: 'training.dashboard.kpis.inProgress', value: kpis?.inProgress ?? 0, icon: 'ph ph-play-circle', emphasis: 'success' },
      { kind: 'completed', labelKey: 'training.dashboard.kpis.completed', value: kpis?.completed ?? 0, icon: 'ph ph-check-circle', emphasis: 'neutral' },
      { kind: 'missingReports', labelKey: 'training.dashboard.kpis.missingReports', value: kpis?.missingReports ?? 0, icon: 'ph ph-clipboard-text', emphasis: 'warning' },
      { kind: 'lateStarts', labelKey: 'training.dashboard.kpis.lateStarts', value: kpis?.lateStarts ?? 0, icon: 'ph ph-clock-countdown', emphasis: 'warning' },
      { kind: 'absences', labelKey: 'training.dashboard.kpis.absences', value: kpis?.absences ?? 0, icon: 'ph ph-user-minus', emphasis: 'danger' },
      { kind: 'cancelled', labelKey: 'training.dashboard.kpis.cancelled', value: kpis?.cancelled ?? 0, icon: 'ph ph-calendar-x', emphasis: 'neutral' },
      { kind: 'openIncidents', labelKey: 'training.dashboard.kpis.openIncidents', value: kpis?.openIncidents ?? 0, icon: 'ph ph-warning-octagon', emphasis: 'danger' },
      { kind: 'durationsToValidate', labelKey: 'training.dashboard.kpis.durationsToValidate', value: kpis?.durationsToValidate ?? 0, icon: 'ph ph-timer', emphasis: 'warning' },
      { kind: 'syncFailures', labelKey: 'training.dashboard.kpis.syncFailures', value: kpis?.syncFailures ?? null, icon: 'ph ph-cloud-x', emphasis: 'neutral' },
    ];
  });

  readonly sessions = computed(() => this.data()?.sessions ?? []);
  readonly incidents = computed(() => this.data()?.incidents ?? []);
  readonly criticalIncidents = computed(() => this.incidents().filter((incident) => incident.severity === 4));
  readonly attentionSessions = computed(() =>
    this.sessions().filter(
      (session) =>
        this.isLateStart(session) ||
        this.isMissingReport(session) ||
        this.hasDurationVariance(session) ||
        session.hasOpenIncident,
    ),
  );

  readonly completedWithoutObjectives = computed(() =>
    this.sessions().filter((session) => session.status === 4 && !session.objectives?.trim()).length,
  );
  readonly completedWithoutAssessments = computed(() =>
    this.sessions().filter((session) => session.status === 4 && session.assessmentCount === 0).length,
  );
  readonly durationVariances = computed(() => this.sessions().filter((session) => this.hasDurationVariance(session)).length);
  readonly reportCompletionRate = computed(() => {
    const completed = this.sessions().filter((session) => session.status === 4);
    if (!completed.length) return null;
    return (completed.filter((session) => session.hasReport).length / completed.length) * 100;
  });

  readonly drawerSessions = computed(() => {
    const kind = this.drawerKind();
    const sessions = this.sessions();
    switch (kind) {
      case 'sessionsToday': return sessions;
      case 'inProgress': return sessions.filter((x) => x.status === 3 || x.status === 6);
      case 'completed': return sessions.filter((x) => x.status === 4);
      case 'missingReports': return sessions.filter((x) => this.isMissingReport(x));
      case 'lateStarts': return sessions.filter((x) => this.isLateStart(x));
      case 'absences': return sessions.filter((x) => this.isAbsence(x.attendanceStatus));
      case 'cancelled': return sessions.filter((x) => x.status === 5);
      case 'durationsToValidate': return sessions.filter((x) => this.hasDurationVariance(x));
      default: return [];
    }
  });

  constructor() {
    this.load();
  }

  load(): void {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    this.loading.set(true);
    this.translatedErrors.set([]);
    this.api.getDashboard(start.toISOString(), end.toISOString()).subscribe({
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

  setTab(tab: TrainingDashboardTab): void {
    this.activeTab.set(tab);
  }

  openKpi(kind: Exclude<TrainingDashboardDrawerKind, 'session'>): void {
    this.selectedSession.set(null);
    this.drawerKind.set(kind);
  }

  openSession(session: TrainingDeliveryDashboardSession): void {
    this.selectedSession.set(session);
    this.drawerKind.set('session');
  }

  closeDrawer(): void {
    this.drawerKind.set(null);
    this.selectedSession.set(null);
  }

  drawerTitleKey(): string {
    const kind = this.drawerKind();
    return kind ? `training.dashboard.drawers.${kind}.title` : 'training.dashboard.title';
  }

  statusKey(status: number): string {
    return `training.statuses.session.${status}`;
  }

  attendanceKey(status: number | null): string {
    return status === null ? 'training.statuses.attendance.none' : `training.statuses.attendance.${status}`;
  }

  incidentSeverityKey(severity: number): string {
    return `training.statuses.incidentSeverity.${severity}`;
  }

  incidentStatusKey(status: number): string {
    return `training.statuses.incidentStatus.${status}`;
  }

  plannedDurationMinutes(session: TrainingDeliveryDashboardSession): number {
    return Math.max(
      0,
      Math.round((new Date(session.plannedEndAtUtc).getTime() - new Date(session.plannedStartAtUtc).getTime()) / 60_000),
    );
  }

  durationDifferenceMinutes(session: TrainingDeliveryDashboardSession): number | null {
    if (session.deliveredDurationMinutes === null) return null;
    return session.deliveredDurationMinutes - this.plannedDurationMinutes(session);
  }

  isLateStart(session: TrainingDeliveryDashboardSession): boolean {
    return new Date(session.plannedStartAtUtc).getTime() < Date.now() && (session.status === 1 || session.status === 2);
  }

  isMissingReport(session: TrainingDeliveryDashboardSession): boolean {
    return session.status === 4 && !session.hasReport;
  }

  hasDurationVariance(session: TrainingDeliveryDashboardSession): boolean {
    const difference = this.durationDifferenceMinutes(session);
    return difference !== null && Math.abs(difference) >= 15;
  }

  private isAbsence(status: number | null): boolean {
    return status !== null && [3, 4, 6, 7, 8].includes(status);
  }
}
