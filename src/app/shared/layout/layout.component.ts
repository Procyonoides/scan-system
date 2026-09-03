import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { FooterComponent } from '../components/footer/footer.component';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarStateService } from '../services/sidebar-state.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit, OnDestroy {
  isMobile = signal(false);
  private breakpointSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    public sidebarState: SidebarStateService,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit() {
    this.breakpointSubscription = this.breakpointObserver
      .observe('(max-width: 768px)')
      .subscribe(state => this.isMobile.set(state.matches));
  }

  ngOnDestroy() {
    this.breakpointSubscription?.unsubscribe();
  }

  onExitActAs() {
    this.authService.exitActAs().subscribe();
  }
}