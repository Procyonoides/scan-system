import { Routes } from '@angular/router';

export const STOCK_ROUTES: Routes = [
  { path: '', component: () => import('./stock.component').then(m => m.StockComponent) }
];