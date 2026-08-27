import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';
import { filter } from 'rxjs/operators';
import { SidebarStateService } from '../../services/sidebar-state.service';

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
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  menuItems: MenuItem[] = [
    {
      label: 'Stock Monitoring',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'Scan Receiving',
      icon: 'south',
      route: '/receiving',
      roles: ['IT', 'MANAGEMENT', 'RECEIVING']
    },
    {
      label: 'Scan Shipping',
      icon: 'north',
      route: '/shipping',
      roles: ['IT', 'MANAGEMENT', 'SHIPPING']
    },
    {
      label: 'Report',
      icon: 'description',
      children: [
        {
          label: 'Daily Report',
          icon: 'today',
          route: '/daily-report',
          roles: ['IT', 'MANAGEMENT']
        },
        {
          label: 'Monthly Report',
          icon: 'calendar_month',
          route: '/monthly-report',
          roles: ['IT', 'MANAGEMENT']
        }
      ],
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'Master Data',
      icon: 'storage',
      route: '/master-data',
      roles: ['IT', 'MANAGEMENT'],
    },
    {
      label: 'Transaction',
      icon: 'swap_horiz',
      route: '/transaction',
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'Stock',
      icon: 'inventory_2',
      route: '/stock',
      roles: ['IT', 'MANAGEMENT']
    },
    {
      label: 'User Management',
      icon: 'group',
      route: '/user',
      roles: ['IT']
    },
    {
      label: 'Log Act-as',
      icon: 'manage_accounts',
      route: '/act-as-log',
      roles: ['IT']
    }
  ];

  expandedMenus: { [key: string]: boolean } = {};

  constructor(
    public authService: AuthService,
    private router: Router,
    public sidebarState: SidebarStateService
  ) { }

  ngOnInit() {
    this.checkActiveRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkActiveRoute();
    });
  }

  hasPermission(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.authService.currentUser()?.position;
    return userRole ? roles.includes(userRole) : false;
  }

  isCollapsed(): boolean {
    return this.sidebarState.collapsed();
  }

  toggleMenu(label: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Keep the mini sidebar closed and show the submenu as a flyout.
    if (this.isCollapsed() && this.menuItems.find(m => m.label === label && m.children)) {
      this.expandedMenus[label] = true;
      return;
    }
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  onMenuEnter(item: MenuItem) {
    if (this.isCollapsed() && item.children && this.hasPermission(item.roles)) {
      this.expandedMenus[item.label] = true;
    }
  }

  onMenuLeave(item: MenuItem) {
    if (this.isCollapsed() && item.children) {
      delete this.expandedMenus[item.label];
    }
  }

  isMenuExpanded(label: string): boolean {
    return !!this.expandedMenus[label];
  }

  private checkActiveRoute() {
    const currentUrl = this.router.url;
    this.menuItems.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child =>
          child.route && currentUrl.includes(child.route)
        );
        if (isChildActive) {
          this.expandedMenus[item.label] = true;
        }
      }
    });
  }
}