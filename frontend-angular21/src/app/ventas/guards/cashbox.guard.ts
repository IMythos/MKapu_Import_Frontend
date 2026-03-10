import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CashboxSocketService } from '../services/cashbox-socket.service';

export const CashboxGuard: CanActivateFn = (route, state) => {
  const cajaService = inject(CashboxSocketService);
  const router      = inject(Router);

  if (state.url === '/ventas/caja') return true;

  const caja      = cajaService.caja();
  const cajaAbierta = !!caja && (caja.estado === 'ABIERTA' || caja.active === true);

  if (!cajaAbierta) {
    router.navigate(['/ventas/caja']);
    return false;
  }

  return true;
}

export const CashboxAdminGuard: CanActivateFn = (route, state) => {
  const cajaService = inject(CashboxSocketService);
  const router      = inject(Router);

  const caja        = cajaService.caja();
  const cajaAbierta = !!caja && (caja.estado === 'ABIERTA' || caja.active === true);

  if (!cajaAbierta) {
    router.navigate(['/admin/caja']); // redirige al estado de caja del admin
    return false; 
  }

  return true;
};