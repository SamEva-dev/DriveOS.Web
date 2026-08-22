import { Routes } from '@angular/router';
export const EXAMS_ROUTES: Routes = [{ path:'', loadComponent:()=>import('./components/exams-shell/exams-shell.component').then(m=>m.ExamsShellComponent), children:[
  {path:'',redirectTo:'dashboard',pathMatch:'full'},
  {path:'dashboard',loadComponent:()=>import('./pages/exams-dashboard/exams-dashboard.page').then(m=>m.ExamsDashboardPage),data:{titleKey:'exams.dashboard.title'}},
  {path:'readiness',loadComponent:()=>import('./pages/exams-readiness/exams-readiness.page').then(m=>m.ExamsReadinessPage),data:{titleKey:'exams.readiness.title'}},
  {path:'places',loadComponent:()=>import('./pages/exams-places/exams-places.page').then(m=>m.ExamsPlacesPage),data:{titleKey:'exams.places.title'}},
  {path:'registrations',loadComponent:()=>import('./pages/exams-registrations/exams-registrations.page').then(m=>m.ExamsRegistrationsPage),data:{titleKey:'exams.registrations.title'}},
  {path:'operations',loadComponent:()=>import('./pages/exams-operations/exams-operations.page').then(m=>m.ExamsOperationsPage),data:{titleKey:'exams.operations.title'}},
  {path:'results',loadComponent:()=>import('./pages/exams-results/exams-results.page').then(m=>m.ExamsResultsPage),data:{titleKey:'exams.results.title'}},
]}];
