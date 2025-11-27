import { Routes } from '@angular/router';

export const MASTERDATA_ROUTES: Routes = [
  { path: '', component: () => import('./master-data.component').then(m => m.MasterDataComponent) }
];