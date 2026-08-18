import { Routes } from '@angular/router';

export const STUDENTS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/student-dashboard/student-dashboard.page').then(
        (m) => m.StudentDashboardPage,
      ),
    data: { titleKey: 'students.dashboard.title' },
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./pages/student-list/student-list.page').then((m) => m.StudentListPage),
    data: { titleKey: 'students.list.title' },
  },
  {
    path: 'enrollments/new',
    loadComponent: () =>
      import('./pages/direct-enrollment/direct-enrollment.page').then(
        (m) => m.DirectEnrollmentPage,
      ),
    data: { titleKey: 'students.directEnrollment.title' },
  },
  {
    path: ':studentId',
    loadComponent: () =>
      import('./pages/student-shell/student-shell.page').then((m) => m.StudentShellPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/student-overview/student-overview.page').then(
            (m) => m.StudentOverviewPage,
          ),
      },
      {
        path: 'profile/edit',
        loadComponent: () =>
          import('./pages/student-identity-edit/student-identity-edit.page').then(
            (m) => m.StudentIdentityEditPage,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/student-profile/student-profile.page').then((m) => m.StudentProfilePage),
      },
      { path: 'enrollment', pathMatch: 'full', redirectTo: 'enrollment/administration' },
      {
        path: 'enrollment/administration',
        loadComponent: () =>
          import('./pages/student-enrollment/student-enrollment.page').then(
            (m) => m.StudentEnrollmentPage,
          ),
        data: { section: 'summary' },
      },
      {
        path: 'enrollment/checklist',
        loadComponent: () =>
          import('./pages/student-enrollment/student-enrollment.page').then(
            (m) => m.StudentEnrollmentPage,
          ),
        data: { section: 'checklist' },
      },
      {
        path: 'enrollment/documents',
        loadComponent: () =>
          import('./pages/student-enrollment/student-enrollment.page').then(
            (m) => m.StudentEnrollmentPage,
          ),
        data: { section: 'documents' },
      },
      {
        path: 'contracts',
        loadComponent: () =>
          import('../contracts/pages/student-contracts/student-contracts.page').then(
            (m) => m.StudentContractsPage,
          ),
      },
      {
        path: 'finance',
        loadComponent: () =>
          import('../funding-billing/pages/student-finance/student-finance.page').then(
            (m) => m.StudentFinancePage,
          ),
      },
      { path: 'assignments', pathMatch: 'full', redirectTo: 'assignments/branches' },
      {
        path: 'assignments/branches',
        loadComponent: () =>
          import('./pages/student-assignments/student-assignments.page').then(
            (m) => m.StudentAssignmentsPage,
          ),
        data: { section: 'branches' },
      },
      {
        path: 'assignments/instructors',
        loadComponent: () =>
          import('./pages/student-assignments/student-assignments.page').then(
            (m) => m.StudentAssignmentsPage,
          ),
        data: { section: 'instructors' },
      },
      {
        path: 'assignments/history',
        loadComponent: () =>
          import('./pages/student-assignments/student-assignments.page').then(
            (m) => m.StudentAssignmentsPage,
          ),
        data: { section: 'history' },
      },
      {
        path: 'statuses',
        loadComponent: () =>
          import('./pages/student-statuses/student-statuses.page').then(
            (m) => m.StudentStatusesPage,
          ),
      },
      { path: 'mobility', pathMatch: 'full', redirectTo: 'mobility/internal-transfers' },
      {
        path: 'mobility/internal-transfers',
        loadComponent: () =>
          import('./pages/student-mobility/student-mobility.page').then(
            (m) => m.StudentMobilityPage,
          ),
        data: { section: 'internal' },
      },
      {
        path: 'mobility/external-transfers',
        loadComponent: () =>
          import('./pages/student-mobility/student-mobility.page').then(
            (m) => m.StudentMobilityPage,
          ),
        data: { section: 'external' },
      },
      { path: 'lifecycle', pathMatch: 'full', redirectTo: 'lifecycle/suspensions' },
      {
        path: 'lifecycle/suspensions',
        loadComponent: () =>
          import('./pages/student-lifecycle/student-lifecycle.page').then(
            (m) => m.StudentLifecyclePage,
          ),
        data: { section: 'suspensions' },
      },
      {
        path: 'lifecycle/reactivations',
        loadComponent: () =>
          import('./pages/student-lifecycle/student-lifecycle.page').then(
            (m) => m.StudentLifecyclePage,
          ),
        data: { section: 'reactivations' },
      },
      {
        path: 'lifecycle/closure',
        loadComponent: () =>
          import('./pages/student-lifecycle/student-lifecycle.page').then(
            (m) => m.StudentLifecyclePage,
          ),
        data: { section: 'closures' },
      },
    ],
  },
];
