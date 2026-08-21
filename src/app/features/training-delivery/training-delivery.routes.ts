import { Routes } from '@angular/router';

export const TRAINING_DELIVERY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/training-delivery-shell/training-delivery-shell.component').then(
        (m) => m.TrainingDeliveryShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/training-dashboard/training-dashboard.page').then(
            (m) => m.TrainingDashboardPage,
          ),
        data: { titleKey: 'training.dashboard.title' },
      },
      {
        path: 'my-day',
        loadComponent: () =>
          import('./pages/training-my-day/training-my-day.page').then(
            (m) => m.TrainingMyDayPage,
          ),
        data: { titleKey: 'training.myDay.title' },
      },
      {
        path: 'sync',
        loadComponent: () =>
          import('./pages/training-field-sync/training-field-sync.page').then(
            (m) => m.TrainingFieldSyncPage,
          ),
        data: { titleKey: 'training.sync.title' },
      },
      {
        path: 'pending-reports',
        loadComponent: () =>
          import('./pages/training-pending-reports/training-pending-reports.page').then(
            (m) => m.TrainingPendingReportsPage,
          ),
        data: { titleKey: 'training.pendingReports.title' },
      },
      {
        path: 'group-sessions/:sessionId',
        loadComponent: () => import('./pages/group-training-session/group-training-session.page').then((m) => m.GroupTrainingSessionPage),
        data: { titleKey: 'training.groupSession.title' },
      },
      {
        path: 'sessions/:sessionId/report/revision',
        loadComponent: () =>
          import('./pages/training-session-report-revision/training-session-report-revision.page').then(
            (m) => m.TrainingSessionReportRevisionPage,
          ),
        data: { titleKey: 'training.reportRevision.title' },
      },
      {
        path: 'sessions/:sessionId/report',
        loadComponent: () =>
          import('./pages/training-session-report/training-session-report.page').then(
            (m) => m.TrainingSessionReportPage,
          ),
        data: { titleKey: 'training.reportWorkflow.title' },
      },
      {
        path: 'sessions/:sessionId',
        loadComponent: () =>
          import('./pages/training-session-detail/training-session-detail.page').then(
            (m) => m.TrainingSessionDetailPage,
          ),
        data: { titleKey: 'training.sessionDetail.title' },
      },
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/training-sessions/training-sessions.page').then(
            (m) => m.TrainingSessionsPage,
          ),
        data: { titleKey: 'training.sessions.title' },
      },
    ],
  },
];
