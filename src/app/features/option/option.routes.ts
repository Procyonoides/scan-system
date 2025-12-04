import { Routes } from '@angular/router';

export const OPTION_ROUTES: Routes = [
  { 
    path: '', 
    redirectTo: 'model',
    pathMatch: 'full'
  },
  { 
    path: 'model', 
    loadComponent: () => import('./option/option.component').then(m => m.OptionComponent),
    data: { tab: 'model' }
  },
  { 
    path: 'size', 
    loadComponent: () => import('./option/option.component').then(m => m.OptionComponent),
    data: { tab: 'size' }
  },
  { 
    path: 'production', 
    loadComponent: () => import('./option/option.component').then(m => m.OptionComponent),
    data: { tab: 'production' }
  }
];