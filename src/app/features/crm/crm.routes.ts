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
    path: 'activities',
    loadComponent: () =>
      import('./pages/activity-list/activity-list.page').then((m) => m.ActivityListPage),
    data: { titleKey: 'crm.activities.title' },
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./pages/lead-pipeline/lead-pipeline.page').then((m) => m.LeadPipelinePage),
    data: { titleKey: 'crm.pipeline.title' },
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/task-list/task-list.page').then((m) => m.TaskListPage),
    data: { titleKey: 'crm.tasks.title' },
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
    path: 'assessments/:appointmentId/perform',
    loadComponent: () =>
      import('./pages/assessment-perform/assessment-perform.page').then(
        (m) => m.AssessmentPerformPage,
      ),
    data: { titleKey: 'crm.assessments.perform.title' },
  },
  {
    path: 'assessments/:appointmentId/result',
    loadComponent: () =>
      import('./pages/assessment-result/assessment-result.page').then(
        (m) => m.AssessmentResultPage,
      ),
    data: { titleKey: 'crm.assessments.result.title' },
  },
  {
    path: 'leads/:leadId/offers/new',
    loadComponent: () =>
      import('./pages/offer-create/offer-create.page').then((m) => m.OfferCreatePage),
    data: { titleKey: 'crm.offers.create.title' },
  },
  {
    path: 'leads/:leadId/offers/compare',
    loadComponent: () =>
      import('./pages/offer-compare/offer-compare.page').then((m) => m.OfferComparePage),
    data: { titleKey: 'crm.offers.compare.title' },
  },
  {
    path: 'offers/:offerId/send',
    loadComponent: () =>
      import('./pages/offer-send/offer-send.page').then((m) => m.OfferSendPage),
    data: { titleKey: 'crm.offers.send.title' },
  },
  {
    path: 'offers/:offerId',
    loadComponent: () =>
      import('./pages/offer-detail/offer-detail.page').then((m) => m.OfferDetailPage),
    data: { titleKey: 'crm.offers.detail.title' },
  },
  {
    path: 'leads/:leadId/convert',
    loadComponent: () =>
      import('./pages/lead-convert/lead-convert.page').then((m) => m.LeadConvertPage),
    data: { titleKey: 'crm.conversion.title' },
  },
  {
    path: 'leads/:leadId/status',
    loadComponent: () =>
      import('./pages/lead-status/lead-status.page').then((m) => m.LeadStatusPage),
    data: { titleKey: 'crm.leadStatus.title' },
  },
  {
    path: 'leads/:leadId',
    loadComponent: () =>
      import('./pages/lead-detail/lead-detail.page').then((m) => m.LeadDetailPage),
    data: { titleKey: 'crm.leads.detail.title' },
  },
];
