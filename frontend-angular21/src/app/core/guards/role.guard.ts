import { inject } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { RoleService } from '../services/role.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);
  const roleService = inject(RoleService);

  const permisos = roleService.getPermisos();

  if (!permisos.length) {
    router.navigate(['/login']);
    return false;
  }

  const permisoRequerido = route.data['permiso'];

  if (!permisoRequerido) return true;

  let tienePermiso = false;
  if (Array.isArray(permisoRequerido)) {
    tienePermiso = permisoRequerido.some((p) => permisos.includes(p));
  } else {
    tienePermiso = permisos.includes(permisoRequerido);
  }

  if (tienePermiso) return true;

  console.warn(`[Guard] Acceso denegado a: ${state.url}`);

  if (permisos.includes('VER_CAJA') && state.url !== '/ventas/caja') {
    router.navigate(['/ventas/caja']);
  } else if (permisos.includes('VER_DASHBOARD_ADMIN') && state.url !== '/admin/dashboard-admin') {
    router.navigate(['/admin/dashboard-admin']);
  } else if (permisos.includes('VER_DASHBOARD_ALMACEN') && state.url !== '/logistica/dashboard') {
    router.navigate(['/logistica/dashboard']);
  } else {
    router.navigate(['/login']);
  }

  return false;
};
