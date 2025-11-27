import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  currentDate = new Date();
  currentTime = '';
  showDropdown = false;
  
  constructor(public authService: AuthService) {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    this.currentTime = new Date().toLocaleTimeString();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
  }

}
