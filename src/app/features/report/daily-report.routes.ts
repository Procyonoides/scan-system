import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./daily-report/daily-report.component').then(m => m.DailyReportComponent) 
  }
];