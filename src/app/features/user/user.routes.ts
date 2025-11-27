import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  { path: '', component: () => import('./user.component').then(m => m.UserComponent) }
];