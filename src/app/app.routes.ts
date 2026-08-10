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
        loadChildren: () =>
          import('./features/crm/crm.routes').then((module) => module.CRM_ROUTES),
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
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.students',
        },
      },
      {
        path: 'planning',
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.planning',
        },
      },
      {
        path: 'instructors',
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.instructors',
        },
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
        loadComponent: () =>
          import('./shared/pages/coming-soon/coming-soon.page').then(
            (component) => component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.settings',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
