import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';
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

  private timeSubscription: Subscription | null = null;

  constructor(
    public authService: AuthService,
    public sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit() {
    this.updateTime();
    this.timeSubscription = interval(1000).subscribe(() => this.updateTime());
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
    this.sidebarService.toggle();
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