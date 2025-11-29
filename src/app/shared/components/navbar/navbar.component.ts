import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = '';
  showDropdown = false;
  sidebarCollapsed = signal(false);

  private timeSubscription: Subscription | null = null;
  
  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.updateTime();
    this.timeSubscription = interval(1000).subscribe(() => this.updateTime());
    this.loadSidebarState();
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdown = document.querySelector('.navbar-dropdown');
    const userBtn = document.querySelector('.user-btn');
    const target = event.target as HTMLElement;
    
    if (dropdown && !dropdown.contains(target) && !userBtn?.contains(target)) {
      this.showDropdown = false;
    }
  }

  private loadSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true';
    this.sidebarCollapsed.set(saved);
    this.applySidebarState(saved);
  }

  private applySidebarState(collapsed: boolean) {
    const root = document.documentElement;
    
    // Remove attribute dulu
    root.removeAttribute('data-sidebar-collapse');
    
    // Tungah sebentar untuk reset
    setTimeout(() => {
      if (collapsed) {
        root.setAttribute('data-sidebar-collapse', 'true');
      }
      console.log(`✅ Navbar: Sidebar ${collapsed ? 'COLLAPSED' : 'EXPANDED'}`);
      console.log(`📌 Attribute: ${root.getAttribute('data-sidebar-collapse')}`);
    }, 50);
  }

  private updateTime() {
    const now = new Date();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayName = days[now.getDay() === 0 ? 6 : now.getDay() - 1];
    
    this.currentDate = `${dayName} ${now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })}`;
    
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  toggleSidebar() {
    const newState = !this.sidebarCollapsed();
    console.log(`🔄 Toggle button clicked - Current: ${this.sidebarCollapsed()}, New: ${newState}`);
    
    this.sidebarCollapsed.set(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    this.applySidebarState(newState);
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

  goToProfile() {
    this.closeDropdown();
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.closeDropdown();
    this.router.navigate(['/settings']);
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
  }
}