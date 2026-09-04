import { Routes } from '@angular/router';

export const FLEET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/fleet-dashboard/fleet-dashboard.page').then((m) => m.FleetDashboardPage),
    data: { titleKey: 'fleet.title' },
  },
];
