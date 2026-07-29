import {
  Routes,
} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './core/layout/app-shell.component'
      ).then(
        component =>
          component.AppShellComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'organizations',
        pathMatch: 'full',
      },
      {
        path: 'organizations',
        loadChildren: () =>
          import(
            './features/organizations/organizations.routes'
          ).then(
            module =>
              module.ORGANIZATION_ROUTES,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.dashboard',
        },
      },
      {
        path: 'students',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.students',
        },
      },
      {
        path: 'planning',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.planning',
        },
      },
      {
        path: 'instructors',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.instructors',
        },
      },
      {
        path: 'vehicles',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.vehicles',
        },
      },
      {
        path: 'billing',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.billing',
        },
      },
      {
        path: 'settings',
        loadComponent: () =>
          import(
            './shared/pages/coming-soon/coming-soon.page'
          ).then(
            component =>
              component.ComingSoonPage,
          ),
        data: {
          titleKey: 'navigation.settings',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'organizations',
  },
];
