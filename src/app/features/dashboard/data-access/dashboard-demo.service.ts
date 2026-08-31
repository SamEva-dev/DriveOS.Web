import { Injectable } from '@angular/core';

import {
  DashboardActivityItem,
  DashboardAgendaItem,
  DashboardAlertItem,
  DashboardMetric,
  DashboardQuickAction,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardDemoService {
  getMetrics(): readonly DashboardMetric[] {
    return [
      {
        code: 'students',
        labelKey: 'dashboard.metrics.activeStudents',
        value: '0',
        detailKey: 'dashboard.metrics.activeStudentsDetail',
        tone: 'primary',
        icon: 'student',
      },
      {
        code: 'sessions',
        labelKey: 'dashboard.metrics.todaySessions',
        value: '0',
        detailKey: 'dashboard.metrics.todaySessionsDetail',
        tone: 'accent',
        icon: 'calendar',
      },
      {
        code: 'instructors',
        labelKey: 'dashboard.metrics.availableInstructors',
        value: '0',
        detailKey: 'dashboard.metrics.availableInstructorsDetail',
        tone: 'success',
        icon: 'instructor',
      },
      {
        code: 'vehicles',
        labelKey: 'dashboard.metrics.availableVehicles',
        value: '0',
        detailKey: 'dashboard.metrics.availableVehiclesDetail',
        tone: 'warning',
        icon: 'vehicle',
      },
      {
        code: 'revenue',
        labelKey: 'dashboard.metrics.monthRevenue',
        value: '0 €',
        detailKey: 'dashboard.metrics.monthRevenueDetail',
        tone: 'primary',
        icon: 'wallet',
      },
      {
        code: 'alerts',
        labelKey: 'dashboard.metrics.complianceAlerts',
        value: '0',
        detailKey: 'dashboard.metrics.complianceAlertsDetail',
        tone: 'danger',
        icon: 'alert',
      },
    ];
  }

  getQuickActions(): readonly DashboardQuickAction[] {
    return [
      {
        code: 'organization',
        titleKey: 'dashboard.quickActions.organization.title',
        descriptionKey: 'dashboard.quickActions.organization.description',
        route: '/organizations',
        tone: 'primary',
        icon: 'building',
      },
      {
        code: 'student',
        titleKey: 'dashboard.quickActions.student.title',
        descriptionKey: 'dashboard.quickActions.student.description',
        route: '/students',
        tone: 'accent',
        icon: 'student',
      },
      {
        code: 'session',
        titleKey: 'dashboard.quickActions.session.title',
        descriptionKey: 'dashboard.quickActions.session.description',
        route: '/planning',
        tone: 'primary',
        icon: 'calendar',
        badgeKey: 'dashboard.quickActions.session.badge',
      },
      {
        code: 'permitAppointment',
        titleKey: 'dashboard.quickActions.permitAppointment.title',
        descriptionKey: 'dashboard.quickActions.permitAppointment.description',
        route: '/planning',
        tone: 'accent',
        icon: 'calendar',
        badgeKey: 'dashboard.quickActions.permitAppointment.badge',
      },
      {
        code: 'instructor',
        titleKey: 'dashboard.quickActions.instructor.title',
        descriptionKey: 'dashboard.quickActions.instructor.description',
        route: '/instructors',
        tone: 'accent',
        icon: 'instructor',
      },
      {
        code: 'vehicle',
        titleKey: 'dashboard.quickActions.vehicle.title',
        descriptionKey: 'dashboard.quickActions.vehicle.description',
        route: '/vehicles',
        tone: 'primary',
        icon: 'vehicle',
      },
      {
        code: 'payment',
        titleKey: 'dashboard.quickActions.payment.title',
        descriptionKey: 'dashboard.quickActions.payment.description',
        route: '/billing',
        tone: 'accent',
        icon: 'wallet',
      },
    ];
  }

  getAgenda(): readonly DashboardAgendaItem[] {
    return [];
  }

  getAlerts(): readonly DashboardAlertItem[] {
    return [];
  }

  getActivities(): readonly DashboardActivityItem[] {
    return [];
  }
}
