import { Routes } from '@angular/router';

export const ACT_AS_LOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./act-as-log/act-as-log.component').then(m => m.ActAsLogComponent)
  }
];
