import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, catchError } from 'rxjs';

import { AuthorizationService } from '../../../core/auth/authorization.service';
import { TenantContextService } from '../../../core/tenancy/tenant-context.service';
import { CrmDashboardApiService } from '../../crm/data-access/crm-dashboard-api.service';
import { StudentsApiService } from '../../students/data-access/students-api.service';
import { WorkforceApiService } from '../../workforce/data-access/workforce-api.service';
import {
  DashboardActivityItem,
  DashboardAgendaItem,
  DashboardAlertItem,
  DashboardMetric,
  DashboardQuickAction,
  DashboardSnapshot,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly authorization = inject(AuthorizationService);
  private readonly tenant = inject(TenantContextService);
  private readonly students = inject(StudentsApiService);
  private readonly crm = inject(CrmDashboardApiService);
  private readonly workforce = inject(WorkforceApiService);

  load(month: number, year: number): Observable<DashboardSnapshot> {
    const fromUtc = new Date(Date.UTC(year, month, 1)).toISOString();
    const toUtc = new Date(Date.UTC(year, month + 1, 1)).toISOString();
    const branchId = this.tenant.branchId() ?? undefined;
    const student$ = this.authorization.hasPermission('Students.Dashboard.Read')
      ? this.students.getDashboard(branchId).pipe(catchError(() => of(null)))
      : of(null);
    const crm$ = this.authorization.hasPermission('Crm.Dashboard.Read')
      ? this.crm
          .get(branchId ? 'branch' : 'organization', branchId, { fromUtc, toUtc })
          .pipe(catchError(() => of(null)))
      : of(null);
    const workforce$ = this.authorization.hasPermission('Workforce.Dashboard.Read')
      ? this.workforce.getDashboard(30).pipe(catchError(() => of(null)))
      : of(null);

    return forkJoin({ student: student$, crm: crm$, workforce: workforce$ }).pipe(
      map(({ student, crm, workforce }) => {
        const complianceAlerts = workforce
          ? workforce.compliance.instructorAuthorizationsExpired +
            workforce.compliance.instructorAuthorizationsExpiringSoon +
            workforce.compliance.employeeDocumentsExpired +
            workforce.compliance.employeeDocumentsExpiringSoon
          : null;
        const metrics: readonly DashboardMetric[] = [
          this.metric('students', 'dashboard.metrics.activeStudents', student?.activeStudents, 'primary', 'student'),
          this.metric('sessions', 'dashboard.metrics.todaySessions', crm?.kpis.upcomingAppointments, 'accent', 'calendar'),
          this.metric('instructors', 'dashboard.metrics.availableInstructors', workforce?.headcount.active, 'success', 'instructor'),
          this.metric('documents', 'dashboard.metrics.pendingDocuments', student?.pendingDocuments, 'warning', 'document'),
          this.metric('followups', 'dashboard.metrics.overdueFollowUps', crm?.kpis.overdueFollowUps, 'warning', 'calendar'),
          this.metric('alerts', 'dashboard.metrics.complianceAlerts', complianceAlerts, 'danger', 'alert'),
        ];
        const agenda: readonly DashboardAgendaItem[] = (crm?.upcomingAppointments ?? []).slice(0, 6).map((item) => ({
          id: item.id,
          startTime: item.startsAtUtc,
          endTime: item.endsAtUtc,
          title: `${item.firstName} ${item.lastName}`.trim(),
          description: item.type,
          status: item.status,
        }));
        const alerts: readonly DashboardAlertItem[] = [
          ...(workforce?.alerts ?? []).slice(0, 6).map((item) => ({
            id: item.referenceId ?? `${item.kind}-${item.dueDate ?? 'current'}`,
            messageKey: item.messageKey,
            parameters: item.parameters,
            severity: this.severity(item.severity),
            route: '/workforce/dashboard',
          })),
        ];
        const activities: readonly DashboardActivityItem[] = (crm?.recentActivities ?? []).slice(0, 6).map((item) => ({
          id: item.id,
          title: `${item.firstName} ${item.lastName}`.trim(),
          description: item.subject,
          occurredAtUtc: item.occurredAtUtc,
          icon: 'chart',
        }));
        return { metrics, quickActions: this.quickActions(), agenda, alerts, activities };
      }),
    );
  }

  private metric(code: string, labelKey: string, value: number | null | undefined, tone: DashboardMetric['tone'], icon: DashboardMetric['icon']): DashboardMetric {
    return { code, labelKey, value: value == null ? '—' : String(value), detailKey: value == null ? 'dashboard.metrics.unavailable' : 'dashboard.metrics.liveData', tone, icon };
  }

  private severity(value: string): DashboardAlertItem['severity'] {
    const normalized = value.toLowerCase();
    return normalized === 'critical' || normalized === 'danger' ? 'danger' : normalized === 'warning' ? 'warning' : 'info';
  }

  private quickActions(): readonly DashboardQuickAction[] {
    return [
      { code: 'organization', titleKey: 'dashboard.quickActions.organization.title', descriptionKey: 'dashboard.quickActions.organization.description', route: '/organizations', tone: 'primary', icon: 'building' },
      { code: 'student', titleKey: 'dashboard.quickActions.student.title', descriptionKey: 'dashboard.quickActions.student.description', route: '/students', tone: 'accent', icon: 'student' },
      { code: 'session', titleKey: 'dashboard.quickActions.session.title', descriptionKey: 'dashboard.quickActions.session.description', route: '/planning', tone: 'primary', icon: 'calendar', badgeKey: 'dashboard.quickActions.session.badge' },
      { code: 'instructor', titleKey: 'dashboard.quickActions.instructor.title', descriptionKey: 'dashboard.quickActions.instructor.description', route: '/workforce/employees', tone: 'accent', icon: 'instructor' },
      { code: 'payment', titleKey: 'dashboard.quickActions.payment.title', descriptionKey: 'dashboard.quickActions.payment.description', route: '/billing', tone: 'accent', icon: 'wallet' },
    ];
  }
}
