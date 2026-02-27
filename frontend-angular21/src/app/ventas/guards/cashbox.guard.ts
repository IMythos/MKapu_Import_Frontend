import { Injectable, inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CashboxSocketService } from '../services/cashbox-socket.service';

export const CashboxGuard: CanActivateFn = (route, state) => {
  const cajaService = inject(CashboxSocketService);
  // solo permite ruta si la caja está activa
  const caja = cajaService.caja();
  // Permitido solo si está en "caja", o caja abierta:
  if (state.url === '/ventas/caja') return true;
  return !!caja && caja.estado === 'ABIERTA';
};