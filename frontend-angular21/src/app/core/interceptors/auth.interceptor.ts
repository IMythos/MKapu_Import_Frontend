import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  let requestCloned = req;
  if (token) {
    requestCloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(requestCloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        console.warn('Permisos insuficientes o sesión expirada. Cerrando sesión...');
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
