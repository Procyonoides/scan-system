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
    'SERVER': ['read_all', 'write_all', 'delete_all', 'admin', 'manage_users', 'manage_master_data'],
    'IT': ['read_all', 'write_all', 'delete_all', 'manage_users', 'manage_master_data'],
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
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUser.set(response.user);
        this.isAuthenticated.set(true);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => error);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  private loadUser() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      try {
        this.currentUser.set(JSON.parse(user));
        this.isAuthenticated.set(true);
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
    const userRole = this.currentUser()?.role;
    if (!userRole) return false;
    
    const rolePermissions = this.permissions[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   * @param permissions - Array of permissions to check
   * @returns boolean
   */
  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has all provided permissions
   * @param permissions - Array of permissions to check
   * @returns boolean
   */
  hasAllPermissions(...permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Get all permissions for current user
   * @returns Array of permissions
   */
  getCurrentPermissions(): string[] {
    const userRole = this.currentUser()?.role;
    return userRole ? this.permissions[userRole] || [] : [];
  }

  /**
   * Check if user has specific role
   * @param role - Role to check
   * @returns boolean
   */
  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }

  /**
   * Check if user has any of the provided roles
   * @param roles - Array of roles to check
   * @returns boolean
   */
  hasAnyRole(...roles: string[]): boolean {
    return roles.includes(this.currentUser()?.role || '');
  }
}
