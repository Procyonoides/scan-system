import { CanActivateFn, Router } from '@angular/router';
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const requiredRoles = route.data['roles'] as string[];
  const userRole = authService.currentUser()?.role;

  if (requiredRoles && requiredRoles.length > 0) {
    if (!userRole || !requiredRoles.includes(userRole)) {
      console.warn(`Access denied for role: ${userRole}. Required roles: ${requiredRoles.join(', ')}`);
      router.navigate(['/dashboard']); // Redirect to dashboard jika tidak punya akses
      return false;
    }
  }

  return true;
};