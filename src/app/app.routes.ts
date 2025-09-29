import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/timer/timer.page').then((m) => m.TimerPage),
  },
  {
    path: 'manage',
    loadComponent: () => import('./pages/manage/manage.page').then((m) => m.ManagePage),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
  },
  { path: '**', redirectTo: '' },
];
