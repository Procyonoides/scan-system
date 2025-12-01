import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { filter } from 'rxjs/operators';

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
export class SidebarComponent implements OnInit, OnDestroy {
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

  expandedMenus: { [key: string]: boolean } = {};
  hoveredMenu: string | null = null;

  constructor(
    public authService: AuthService,
    public sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkActiveRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkActiveRoute();
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  hasPermission(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.authService.currentUser()?.position;
    return userRole ? roles.includes(userRole) : false;
  }

  isCollapsed(): boolean {
    return this.sidebarService.isCollapsed();
  }

  toggleMenu(label: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Jika sidebar collapsed dan menu punya children, expand sidebar dulu
    if (this.isCollapsed() && this.menuItems.find(m => m.label === label && m.children)) {
      this.sidebarService.expand();
      this.expandedMenus[label] = true;
      return;
    }

    // Toggle menu expansion
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isMenuExpanded(label: string): boolean {
    return !!this.expandedMenus[label];
  }

  onMenuMouseEnter(item: MenuItem) {
    // Hanya untuk collapsed state dengan children
    if (this.isCollapsed() && item.children) {
      this.hoveredMenu = item.label;
    }
  }

  onMenuMouseLeave() {
    this.hoveredMenu = null;
  }

  isMenuHovered(label: string): boolean {
    return this.hoveredMenu === label;
  }

  getHoverMenuPosition(label: string): any {
    if (!this.isCollapsed() || !this.hoveredMenu || this.hoveredMenu !== label) {
      return null;
    }

    // Calculate position untuk hover menu
    const element = document.querySelector(`[data-menu="${label}"]`);
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + 'px',
        left: '70px' // sidebar collapsed width
      };
    }
    return null;
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