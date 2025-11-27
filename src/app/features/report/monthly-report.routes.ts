import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./monthly-report/monthly-report.component').then(m => m.MonthlyReportComponent) 
  }
];