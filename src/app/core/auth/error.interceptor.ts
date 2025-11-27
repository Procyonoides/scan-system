import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      // Handle 401 Unauthorized
      if (error.status === 401) {
        console.warn('Token expired or unauthorized');
        authService.logout();
        router.navigate(['/auth/login']);
        return throwError(() => ({
          status: 401,
          message: 'Session expired. Please login again.'
        }));
      }

      // Handle 403 Forbidden
      if (error.status === 403) {
        console.warn('Access forbidden');
        router.navigate(['/dashboard']);
        return throwError(() => ({
          status: 403,
          message: 'You do not have permission to access this resource.'
        }));
      }

      // Handle 404 Not Found
      if (error.status === 404) {
        return throwError(() => ({
          status: 404,
          message: 'Resource not found.'
        }));
      }

      // Handle 400 Bad Request
      if (error.status === 400) {
        const errorMessage = error.error?.error || error.error?.message || 'Invalid request';
        return throwError(() => ({
          status: 400,
          message: errorMessage
        }));
      }

      // Handle 500 Server Error
      if (error.status === 500) {
        return throwError(() => ({
          status: 500,
          message: 'Server error. Please try again later.'
        }));
      }

      // Handle network errors
      if (error.status === 0) {
        return throwError(() => ({
          status: 0,
          message: 'Network error. Please check your connection.'
        }));
      }

      // Generic error handler
      return throwError(() => ({
        status: error.status,
        message: error.error?.error || 'An unexpected error occurred.'
      }));
    })
  );
};