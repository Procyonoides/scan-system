import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { signal } from '@angular/core';

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
export class SidebarComponent implements OnInit {
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
          icon: 'fas fa-calendar-day',
          route: '/daily-report',
          roles: ['IT', 'MANAGEMENT']
        },
        {
          label: 'Monthly Report',
          icon: 'fas fa-calendar-alt',
          route: '/monthly-report',
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

  sidebarCollapsed = signal(false);
  hoveredMenuLabel = signal<string | null>(null);
  expandedMenus: { [key: string]: boolean } = {};

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.loadSidebarState();
  }

  private loadSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true';
    this.sidebarCollapsed.set(saved);
  }

  hasPermission(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.authService.currentUser()?.position;
    return userRole ? roles.includes(userRole) : false;
  }

  isCollapsed(): boolean {
    return this.sidebarCollapsed();
  }

  toggleSidebar() {
    const newState = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  }

  toggleMenu(label: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isMenuExpanded(label: string): boolean {
    return !!this.expandedMenus[label];
  }

  onMenuHover(label: string) {
    this.hoveredMenuLabel.set(label);
  }

  onMenuLeave() {
    setTimeout(() => {
      this.hoveredMenuLabel.set(null);
    }, 150);
  }

  shouldShowHoverMenu(label: string): boolean {
    return this.isCollapsed() && this.hoveredMenuLabel() === label;
  }
}