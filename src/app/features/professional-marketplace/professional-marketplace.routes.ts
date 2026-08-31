import { Routes } from '@angular/router';

export const PROFESSIONAL_MARKETPLACE_ROUTES: Routes = [
  {
    path: 'my-dashboard',
    loadComponent: () =>
      import('./pages/my-professional-dashboard/my-professional-dashboard.page').then(
        (m) => m.MyProfessionalDashboardPage,
      ),
    data: { titleKey: 'professionalMarketplace.myDashboard.title' },
  },
  {
    path: 'my-service-entries',
    loadComponent: () =>
      import('./pages/my-professional-service-entries/my-professional-service-entries.page').then(
        (m) => m.MyProfessionalServiceEntriesPage,
      ),
    data: { titleKey: 'professionalMarketplace.myServiceEntries.title' },
  },
  {
    path: 'my-students',
    loadComponent: () =>
      import('./pages/my-professional-students/my-professional-students.page').then(
        (m) => m.MyProfessionalStudentsPage,
      ),
    data: { titleKey: 'professionalMarketplace.myStudents.title' },
  },
  {
    path: 'my-missions',
    loadComponent: () =>
      import('./pages/my-professional-missions/my-professional-missions.page').then(
        (m) => m.MyProfessionalMissionsPage,
      ),
    data: { titleKey: 'professionalMarketplace.myMissions.title' },
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/marketplace-analytics/marketplace-analytics.page').then(
        (m) => m.MarketplaceAnalyticsPage,
      ),
    data: { titleKey: 'professionalMarketplace.analytics.title' },
  },
  {
    path: 'professionals/:profileId',
    loadComponent: () =>
      import('./pages/professional-profile/professional-profile.page').then(
        (m) => m.ProfessionalProfilePage,
      ),
    data: { titleKey: 'professionalMarketplace.profile360.title' },
  },
  {
    path: 'professionals',
    loadComponent: () =>
      import('./pages/professional-search/professional-search.page').then(
        (m) => m.ProfessionalSearchPage,
      ),
    data: { titleKey: 'professionalMarketplace.search.title' },
  },
  {
    path: 'opportunities',
    loadComponent: () =>
      import('./pages/professional-opportunities/professional-opportunities.page').then(
        (m) => m.ProfessionalOpportunitiesPage,
      ),
    data: { titleKey: 'professionalMarketplace.opportunities.title' },
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/marketplace-dashboard/marketplace-dashboard.page').then(
        (m) => m.MarketplaceDashboardPage,
      ),
    data: { titleKey: 'professionalMarketplace.dashboard.title' },
  },
];
