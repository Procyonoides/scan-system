import { Routes } from '@angular/router';

export const TRANSACTION_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./transaction/transaction.component').then(m => m.TransactionComponent) 
  }
];