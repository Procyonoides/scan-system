import { Routes } from '@angular/router';

export const MASTERDATA_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./master-data/master-data.component').then(m => m.MasterDataComponent) 
  }
];