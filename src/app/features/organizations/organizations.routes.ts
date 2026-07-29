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
          component
            .OrganizationListPage,
      ),
  },

  {
    path: 'create',

    loadComponent: () =>
      import(
        './pages/organization-create/organization-create.page'
      ).then(
        component =>
          component
            .OrganizationCreatePage,
      ),
  },

  {
    path:
      ':organizationId/branches',

    loadComponent: () =>
      import(
        './branches/pages/branch-list/branch-list.page'
      ).then(
        component =>
          component.BranchListPage,
      ),
  },

  {
    path:
      ':organizationId/branches/create',

    loadComponent: () =>
      import(
        './branches/pages/branch-create/branch-create.page'
      ).then(
        component =>
          component.BranchCreatePage,
      ),
  },

  {
    path:
      ':organizationId/branches/:branchId/edit',

    loadComponent: () =>
      import(
        './branches/pages/branch-edit/branch-edit.page'
      ).then(
        component =>
          component.BranchEditPage,
      ),
  },

  {
    path:
      ':organizationId/branches/:branchId',

    loadComponent: () =>
      import(
        './branches/pages/branch-detail/branch-detail.page'
      ).then(
        component =>
          component.BranchDetailPage,
      ),
  },

  {
    path:
      ':organizationId',

    loadComponent: () =>
      import(
        './pages/organization-detail/organization-detail.page'
      ).then(
        component =>
          component
            .OrganizationDetailPage,
      ),
  },
];
