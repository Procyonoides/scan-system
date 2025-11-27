import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
    },
    {
        path: 'receiving',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['RECEIVING', 'IT'] },
        loadChildren: () => import('./features/receiving/receiving.routes').then(m => m.RECEIVING_ROUTES)
    },
    {
        path: 'shipping',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['SHIPPING', 'IT'] },
        loadChildren: () => import('./features/shipping/shipping.routes').then(m => m.SHIPPING_ROUTES)
    },
    {
        path: 'report',
        canActivate: [authGuard],
        data: { roles: ['MANAGEMENT', 'IT'] },
        loadChildren: () => import('./features/report/monthly-report.routes').then(m => m.REPORT_ROUTES)
    },
    {
        path: 'transaction',
        canActivate: [authGuard],
        loadChildren: () => import('./features/transaction/transaction.routes').then(m => m.TRANSACTION_ROUTES)
    },
    {
        path: 'stock',
        canActivate: [authGuard],
        loadChildren: () => import('./features/stock/stock.routes').then(m => m.STOCK_ROUTES)
    },
    {
        path: 'master-data',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['IT'] },
        loadChildren: () => import('./features/master-data/master-data.routes').then(m => m.MASTERDATA_ROUTES)
    },
    {
        path: 'user',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['IT'] },
        loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
    }
];
