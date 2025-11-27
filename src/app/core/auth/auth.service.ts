import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, User } from '../models/user.model';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface UserPermissions {
  [key: string]: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  currentUser = signal<User | null>(null);
  isAuthenticated = signal(false);

  private permissions: UserPermissions = {
    'IT': ['read_all', 'write_all', 'delete_all', 'admin', 'manage_users', 'manage_master_data'],
    'MANAGEMENT': ['read_all', 'view_reports'],
    'RECEIVING': ['read', 'receive_scan', 'view_stock'],
    'SHIPPING': ['read', 'shipping_scan', 'view_stock']
  };

  constructor(private http: HttpClient, private router: Router) { 
    this.loadUser();
  }

  login(credentials: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          console.log('✅ Login successful:', response.user.username);
          this.router.navigate(['/dashboard']);
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        const errorMessage = error.error?.error || error.error?.message || 'Login failed';
        return throwError(() => ({
          success: false,
          error: errorMessage,
          status: error.status
        }));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    console.log('✅ Logged out');
    this.router.navigate(['/auth/login']);
  }

  private loadUser() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      try {
        this.currentUser.set(JSON.parse(user));
        this.isAuthenticated.set(true);
        console.log('✅ User loaded from localStorage');
      } catch (e) {
        console.error('Error parsing user data:', e);
        this.logout();
      }
    }
  }

  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Check if user has specific permission
   * @param permission - Permission to check
   * @returns boolean
   */
  hasPermission(permission: string): boolean {
    const userPosition = this.currentUser()?.position;
    if (!userPosition) return false;
    
    const positionPermissions = this.permissions[userPosition] || [];
    return positionPermissions.includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   */
  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has all provided permissions
   */
  hasAllPermissions(...permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Get all permissions for current user
   */
  getCurrentPermissions(): string[] {
    const userPosition = this.currentUser()?.position;
    return userPosition ? this.permissions[userPosition] || [] : [];
  }

  /**
   * Check if user has specific position
   */
  hasPosition(position: string): boolean {
    return this.currentUser()?.position === position;
  }

  /**
   * Check if user has any of the provided positions
   */
  hasAnyPosition(...positions: string[]): boolean {
    return positions.includes(this.currentUser()?.position || '');
  }
}