import {
  Routes,
} from '@angular/router';

export const ORGANIZATION_ROUTES:
  Routes = [
  {
    path: '',
    loadComponent: () =>
      import(
        './pages/organization-list/organization-list.page'
      ).then(
        component =>
          component.OrganizationListPage,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import(
        './pages/organization-create/organization-create.page'
      ).then(
        component =>
          component.OrganizationCreatePage,
      ),
  },
  {
    path: ':organizationId',
    loadComponent: () =>
      import(
        './pages/organization-detail/organization-detail.page'
      ).then(
        component =>
          component.OrganizationDetailPage,
      ),
  },
];
