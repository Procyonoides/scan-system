import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
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
  imports: [CommonModule, RouterModule, MatIconModule],
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
  openFlyout: string | null = null;
  flyoutPosition: { top: number; left: number } = { top: 0, left: 0 };

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

  isParentActive(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => child.route && this.router.url === child.route);
  }

  toggleMenu(label: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.isCollapsed()) {
      const wrapper = (event?.currentTarget as HTMLElement)?.closest('.submenu-wrapper') as HTMLElement | null;
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect();
        this.flyoutPosition = { top: rect.top, left: rect.right + 4 };
      }
      this.openFlyout = this.openFlyout === label ? null : label;
      return;
    }
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  onMenuEnter(item: MenuItem, event: MouseEvent) {
    if (this.isCollapsed() && item.children && this.hasPermission(item.roles)) {
      const wrapper = event.currentTarget as HTMLElement;
      const rect = wrapper.getBoundingClientRect();
      this.flyoutPosition = { top: rect.top, left: rect.right + 4 };
      this.openFlyout = item.label;
    }
  }

  onMenuLeave(item: MenuItem) {
    if (this.isCollapsed() && this.openFlyout === item.label) {
      this.openFlyout = null;
    }
  }

  isMenuExpanded(label: string): boolean {
    return this.isCollapsed() ? this.openFlyout === label : !!this.expandedMenus[label];
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