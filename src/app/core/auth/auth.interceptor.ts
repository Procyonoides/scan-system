import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔐 Auth Interceptor called:', {
    url: req.url,
    method: req.method,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 30)}...` : 'NO TOKEN'
  });

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('✅ Token added to request headers:', cloned.headers.get('Authorization')?.substring(0, 30) + '...');
    
    return next(cloned).pipe(
      tap({
        next: (event) => {
          console.log('✅ Request successful:', req.url);
        },
        error: (error) => {
          console.error('❌ Request failed:', {
            url: req.url,
            status: error.status,
            message: error.message,
            error: error.error
          });
        }
      })
    );
  }
  
  console.warn('⚠️ No token found - Request sent without authentication');
  return next(req);
};