import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  roles?: string[];
}


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Stock Monitoring',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      roles: ['IT', 'MANAGEMENT', 'RECEIVING', 'SHIPPING']
    },
    {
      label: 'Scan Receiving',
      icon: 'fas fa-arrow-down',
      route: '/receiving',
      roles: ['IT', 'RECEIVING']
    },
    {
      label: 'Scan Shipping',
      icon: 'fas fa-arrow-up',
      route: '/shipping',
      roles: ['IT', 'SHIPPING']
    },
    {
      label: 'Report',
      icon: 'fas fa-file-text',
      children: [
        {
          label: 'Daily Report',
          icon: 'fas fa-file',
          route: '/report/daily',
          roles: ['IT', 'MANAGEMENT']
        },
        {
          label: 'Monthly Report',
          icon: 'fas fa-file',
          route: '/report/monthly',
          roles: ['IT', 'MANAGEMENT']
        }
      ],
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'Master Data',
      icon: 'fas fa-database',
      route: '/master-data',
      roles: ['IT']
    },
    {
      label: 'Transaction',
      icon: 'fas fa-exchange-alt',
      route: '/transaction',
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'Stock',
      icon: 'fas fa-boxes',
      route: '/stock',
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'User Management',
      icon: 'fas fa-users',
      route: '/user',
      roles: ['IT']
    }
  ];

  expandedMenus: { [key: string]: boolean } = {};

  constructor(public authService: AuthService) {}

  hasPermission(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.authService.currentUser()?.position;
    return userRole ? roles.includes(userRole) : false;
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return window.location.pathname.includes(route);
  }

  toggleMenu(label: string) {
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isMenuExpanded(label: string): boolean {
    return !!this.expandedMenus[label];
  }

  sanitizeLabel(label: string) {
    return label.replace(/\s/g, '');
  }

}
