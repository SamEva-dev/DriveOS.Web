import { Routes } from '@angular/router';

export const ORGANIZATIONS_ROUTES: Routes = [
  {
    path: '',

    loadComponent: () =>
      import('./pages/organization-list/organization-list.page').then(
        (component) => component.OrganizationListPage,
      ),
  },

  {
    path: 'create',
    pathMatch: 'full',
    redirectTo: '',
  },

  {
    path: ':organizationId/branches',

    loadComponent: () =>
      import('./branches/pages/branch-list/branch-list.page').then(
        (component) => component.BranchListPage,
      ),
  },

  {
    path: ':organizationId/branches/create',

    loadComponent: () =>
      import('./branches/pages/branch-create/branch-create.page').then(
        (component) => component.BranchCreatePage,
      ),
  },
  {
    path: ':organizationId/branches/:branchId/team/create',

    loadComponent: () =>
      import('./branch-assignments/pages/branch-assignment-create/branch-assignment-create.page').then(
        (component) => component.BranchAssignmentCreatePage,
      ),
  },
  {
    path: ':organizationId/branches/:branchId/team',

    loadComponent: () =>
      import('./branch-assignments/pages/branch-team/branch-team.page').then(
        (component) => component.BranchTeamPage,
      ),
  },

  {
    path: ':organizationId/branch-assignments/:assignmentId',

    loadComponent: () =>
      import('./branch-assignments/pages/branch-assignment-detail/branch-assignment-detail.page').then(
        (component) => component.BranchAssignmentDetailPage,
      ),
  },

  {
    path: ':organizationId/branches/:branchId/edit',

    loadComponent: () =>
      import('./branches/pages/branch-edit/branch-edit.page').then(
        (component) => component.BranchEditPage,
      ),
  },

  {
    path: ':organizationId/branches/:branchId/configuration-overrides',

    loadComponent: () =>
      import('./branch-configuration-overrides/pages/branch-configuration-overrides/branch-configuration-overrides.page').then(
        (component) => component.BranchConfigurationOverridesPage,
      ),
  },

  {
    path: ':organizationId/branches/:branchId',

    loadComponent: () =>
      import('./branches/pages/branch-detail/branch-detail.page').then(
        (component) => component.BranchDetailPage,
      ),
  },

  {
    path: ':organizationId/subscription',

    loadComponent: () =>
      import('./organization-subscriptions/pages/organization-subscription/organization-subscription.page').then(
        (component) => component.OrganizationSubscriptionPage,
      ),
  },

  {
    path: ':organizationId/configurations',

    loadComponent: () =>
      import('./organization-configurations/pages/organization-configurations/organization-configurations.page').then(
        (component) => component.OrganizationConfigurationsPage,
      ),
  },



  {
    path: ':organizationId/sequences',

    loadComponent: () =>
      import('./organization-sequences/pages/organization-sequences/organization-sequences.page').then(
        (component) => component.OrganizationSequencesPage,
      ),
  },

  {
    path: ':organizationId/representatives',

    loadComponent: () =>
      import('./organization-representatives/pages/organization-representatives/organization-representatives.page').then(
        (component) => component.OrganizationRepresentativesPage,
      ),
  },

  {
    path: ':organizationId/legal-profile',

    loadComponent: () =>
      import('./organization-legal-profile/pages/organization-legal-profile/organization-legal-profile.page').then(
        (component) => component.OrganizationLegalProfilePage,
      ),
  },

  {
    path: ':organizationId',

    loadComponent: () =>
      import('./pages/organization-detail/organization-detail.page').then(
        (component) => component.OrganizationDetailPage,
      ),
  },
];
