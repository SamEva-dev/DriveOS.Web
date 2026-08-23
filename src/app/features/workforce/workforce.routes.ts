import { Routes } from '@angular/router';

export const WORKFORCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/workforce-dashboard/workforce-dashboard.page').then(
        (m) => m.WorkforceDashboardPage,
      ),
    data: { titleKey: 'workforce.dashboard.title' },
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/workforce-analytics/workforce-analytics.page').then(
        (m) => m.WorkforceAnalyticsPage,
      ),
    data: { titleKey: 'workforce.analytics.title' },
  },
  {
    path: 'job-positions',
    loadComponent: () =>
      import('./pages/job-position-list/job-position-list.page').then((m) => m.JobPositionListPage),
    data: { titleKey: 'workforce.jobPositions.title' },
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./pages/employee-list/employee-list.page').then((m) => m.EmployeeListPage),
    data: { titleKey: 'workforce.employees.title' },
  },
  {
    path: 'employees/:employeeId',
    loadComponent: () =>
      import('./pages/employee-detail/employee-detail.page').then((m) => m.EmployeeDetailPage),
    data: { titleKey: 'workforce.employeeDetail.title' },
  },
];
