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
  const userPosition = authService.currentUser()?.position;

  if (requiredRoles && requiredRoles.length > 0) {
    if (!userPosition || !requiredRoles.includes(userPosition)) {
      console.warn(`Access denied for position: ${userPosition}. Required positions: ${requiredRoles.join(', ')}`);
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};