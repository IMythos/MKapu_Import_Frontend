import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { RoleService } from '../services/role.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router      = inject(Router);
  const roleService = inject(RoleService);

  const permisos = roleService.getPermisos();

  if (!permisos.length) {
    router.navigate(['/login']);
    return false;
  }

  const permisoRequerido: string = route.data['permiso'];

  if (!permisoRequerido) return true;

  if (permisos.includes(permisoRequerido)) return true;

  router.navigate(['/login']);
  return false;
};