import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPage,
      ),
  },
  {
    path: 'check-email',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/check-email/check-email.page').then((m) => m.CheckEmailPage),
  },
  {
    path: 'confirm-email',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/confirm-email/confirm-email.page').then(
        (m) => m.ConfirmEmailPage,
      ),
  },
  {
    path: 'forbidden',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-shell.component').then((component) => component.AppShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'organizations',
        loadChildren: () =>
          import('./features/organizations/organizations.routes').then(
            (module) => module.ORGANIZATIONS_ROUTES,
          ),
      },
      {
        path: 'crm',
        loadChildren: () => import('./features/crm/crm.routes').then((module) => module.CRM_ROUTES),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.page').then(
            (component) => component.DashboardPage,
          ),
        data: {
          titleKey: 'navigation.dashboard',
        },
      },
      {
        path: 'students',
        loadChildren: () =>
          import('./features/students/students.routes').then((module) => module.STUDENTS_ROUTES),
      },
      {
        path: 'pedagogy',
        loadChildren: () =>
          import('./features/pedagogy/pedagogy.routes').then((module) => module.PEDAGOGY_ROUTES),
      },
      {
        path: 'planning',
        loadChildren: () =>
          import('./features/scheduling/scheduling.routes').then(
            (module) => module.SCHEDULING_ROUTES,
          ),
      },
      {
        path: 'field/sync',
        redirectTo: 'training/sync',
        pathMatch: 'full',
      },
      {
        path: 'training',
        loadChildren: () =>
          import('./features/training-delivery/training-delivery.routes').then(
            (module) => module.TRAINING_DELIVERY_ROUTES,
          ),
      },
      {
        path: 'exams',
        loadChildren: () =>
          import('./features/exams/exams.routes').then((module) => module.EXAMS_ROUTES),
      },
      {
        path: 'workforce',
        loadChildren: () =>
          import('./features/workforce/workforce.routes').then(
            (module) => module.WORKFORCE_ROUTES,
          ),
      },
      {
        path: 'instructors',
        redirectTo: 'workforce/employees',
        pathMatch: 'full',
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.vehicles',
        },
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.billing',
        },
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((module) => module.SETTINGS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
