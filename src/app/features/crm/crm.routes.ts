import { Routes } from '@angular/router';

export const CRM_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/crm-home/crm-home.page').then((m) => m.CrmHomePage),
    data: {
      titleKey: 'CRM & Admissions',
    },
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./pages/lead-pipeline/lead-pipeline.page').then((m) => m.LeadPipelinePage),
    data: { titleKey: 'crm.pipeline.title' },
  },
  {
    path: 'leads',
    loadComponent: () =>
      import('./pages/lead-list/lead-list.page').then((m) => m.LeadListPage),
    data: { titleKey: 'crm.leads.title' },
  },
  {
    path: 'leads/new',
    loadComponent: () =>
      import('./pages/lead-create/lead-create.page').then((m) => m.LeadCreatePage),
    data: { titleKey: 'crm.leads.create.title' },
  },
  {
    path: 'leads/:leadId',
    loadComponent: () =>
      import('./pages/lead-detail/lead-detail.page').then((m) => m.LeadDetailPage),
    data: { titleKey: 'crm.leads.detail.title' },
  },
];
