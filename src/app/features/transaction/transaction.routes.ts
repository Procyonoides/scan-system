import { Routes } from '@angular/router';

export const TRANSACTION_ROUTES: Routes = [
  { path: '', component: () => import('./transaction.component').then(m => m.TransactionComponent) }
];