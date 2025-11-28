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
  
  constructor(public authService: AuthService, private router: Router) {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  ngOnInit() {
    this.updateTime();
    this.timeSubscription = interval(1000).subscribe(() => this.updateTime());
    this.checkSidebarState();
  }

  ngOnDestroy() {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdown = document.querySelector('.nav-user-menu');
    const target = event.target as HTMLElement;
    
    if (dropdown && !dropdown.contains(target)) {
      this.showDropdown = false;
    }
  }

  private checkSidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      this.sidebarCollapsed.set(true);
      document.documentElement.setAttribute('data-sidebar-collapse', 'true');
    } else {
      this.sidebarCollapsed.set(false);
      document.documentElement.removeAttribute('data-sidebar-collapse');
    }
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
    console.log('toggleSidebar called');
    const newState = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(newState);
    
    if (newState) {
      document.documentElement.setAttribute('data-sidebar-collapse', 'true');
      localStorage.setItem('sidebarCollapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapse');
      localStorage.setItem('sidebarCollapsed', 'false');
    }
    console.log('Sidebar collapsed:', newState);
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
    this.authService.logout();
  }

  onLogoutClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.logout();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown() {
    this.showDropdown = false;
  }

}
