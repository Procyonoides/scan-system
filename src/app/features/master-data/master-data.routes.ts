import { Routes } from '@angular/router';

export const MASTERDATA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./master-data/master-data.component').then(m => m.MasterDataComponent)
  },
  {
    path: 'record',
    loadComponent: () => import('./record/record.component').then(m => m.RecordComponent)
  },
  {
    path: 'backup',
    loadComponent: () => import('./backup/backup.component').then(m => m.BackupComponent)
  }
];