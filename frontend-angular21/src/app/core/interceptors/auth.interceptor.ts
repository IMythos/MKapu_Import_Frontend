import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);
  console.log('🚀 Interceptando petición hacia:', req.url);
  console.log('🔑 Token encontrado en localStorage:', token);

  let authReq = req;
  if (token && !req.url.includes('/auth/login')) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        console.warn('⚠️ Token expirado o inválido. Redirigiendo al login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};