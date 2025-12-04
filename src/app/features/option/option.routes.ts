import { Routes } from '@angular/router';

export const OPTION_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./option/option.component').then(m => m.OptionComponent) 
  }
];