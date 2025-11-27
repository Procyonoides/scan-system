import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  { path: '', component: () => import('./report.component').then(m => m.ReportComponent) }
];