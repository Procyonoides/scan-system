import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
    },

    // Protected Routes (dengan layout)
    {
        path: '',
        component: LayoutComponent,
        canActivate: [authGuard],
        children: [
        {
            path: 'dashboard',
            loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
        },
        {
            path: 'receiving',
            canActivate: [roleGuard],
            data: { roles: ['RECEIVING', 'IT'] },
            loadChildren: () => import('./features/receiving/receiving.routes').then(m => m.RECEIVING_ROUTES)
        },
        {
            path: 'shipping',
            canActivate: [roleGuard],
            data: { roles: ['SHIPPING', 'IT'] },
            loadChildren: () => import('./features/shipping/shipping.routes').then(m => m.SHIPPING_ROUTES)
        },
        {
            path: 'daily-report',
            canActivate: [roleGuard],
            data: { roles: ['MANAGEMENT', 'IT'] },
            loadChildren: () => import('./features/report/daily-report.routes').then(m => m.REPORT_ROUTES)
        },
        {
            path: 'monthly-report',
            canActivate: [roleGuard],
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
            canActivate: [roleGuard],
            data: { roles: ['IT'] },
            loadChildren: () => import('./features/master-data/master-data.routes').then(m => m.MASTERDATA_ROUTES)
        },
        {
            path: 'user',
            canActivate: [roleGuard],
            data: { roles: ['IT'] },
            loadChildren: () => import('./features/user/user.routes').then(m => m.USER_ROUTES)
        },
        {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
        }
        ]
    },

    // Default redirect
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    }
];
