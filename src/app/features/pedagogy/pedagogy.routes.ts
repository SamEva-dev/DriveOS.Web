import { Routes } from '@angular/router';
export const PEDAGOGY_ROUTES: Routes = [
  { path: '', redirectTo: 'curricula', pathMatch: 'full' },
  {
    path: 'curricula',
    loadComponent: () =>
      import('./pages/curriculum-admin/curriculum-admin.page').then((m) => m.CurriculumAdminPage),
    data: { titleKey: 'pedagogy.curricula.title' },
  },
];
