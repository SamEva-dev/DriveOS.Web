import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  { path: '', redirectTo: 'integrations/france/livret-numerique', pathMatch: 'full' },
  {
    path: 'integrations/france/livret-numerique',
    loadComponent: () =>
      import('./pages/regulatory-integrations/regulatory-integrations.page').then(
        (m) => m.RegulatoryIntegrationsPage,
      ),
    data: { titleKey: 'settings.regulatoryIntegrations.title' },
  },
];
