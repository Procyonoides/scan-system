import { Routes } from '@angular/router';

export const SHIPPING_ROUTES: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./scan-shipping/scan-shipping.component').then(m => m.ScanShippingComponent) 
  }
];