import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent) 
  }
];