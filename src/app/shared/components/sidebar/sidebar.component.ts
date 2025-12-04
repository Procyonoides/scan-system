import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
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
    // {
    //   label: 'Master Data',
    //   icon: 'fas fa-database',
    //   route: '/master-data',
    //   roles: ['IT']
    // },
    {
      label: 'Master Data',
      icon: 'fas fa-database',
      children: [
        {
          label: 'Barcode',
          icon: 'fas fa-barcode',
          route: '/master-data',
          roles: ['IT']
        },
        {
          label: 'Option',
          icon: 'fas fa-cog',
          route: '/option',
          roles: ['IT']
        }
      ],
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
  expandedMenus: { [key: string]: boolean } = {};
  private mutationObserver: MutationObserver | null = null;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSidebarState();
    this.observeAttributeChanges();
    this.checkActiveRoute();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkActiveRoute();
    });
  }

  ngOnDestroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }

  private loadSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true';
    const htmlAttr = document.documentElement.getAttribute('data-sidebar-collapse') === 'true';
    const state = saved || htmlAttr;
    this.sidebarCollapsed.set(state);
  }

  private observeAttributeChanges() {
    const root = document.documentElement;
    this.mutationObserver = new MutationObserver(() => {
      const isCollapsed = root.getAttribute('data-sidebar-collapse') === 'true';
      this.sidebarCollapsed.set(isCollapsed);
    });
    this.mutationObserver.observe(root, {
      attributes: true,
      attributeFilter: ['data-sidebar-collapse']
    });
  }

  toggleSidebar() {
    const newState = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));

    const root = document.documentElement;
    if (newState) {
      root.setAttribute('data-sidebar-collapse', 'true');
    } else {
      root.removeAttribute('data-sidebar-collapse');
    }
  }

  hasPermission(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.authService.currentUser()?.position;
    return userRole ? roles.includes(userRole) : false;
  }

  isCollapsed(): boolean {
    return this.sidebarCollapsed();
  }

  toggleMenu(label: string, event?: MouseEvent) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    // Auto expand sidebar jika collapsed dan klik parent menu
    if (this.isCollapsed() && this.menuItems.find(m => m.label === label && m.children)) {
      this.toggleSidebar();
    }
    this.expandedMenus[label] = !this.expandedMenus[label];
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