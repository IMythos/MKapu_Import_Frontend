import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { UserRole } from '../../core/constants/roles.constants';
import { TransferRole } from '../interfaces/transferencia.interface';

interface StoredUserShape {
  userId?: number;
  id_usuario?: number;
  roleId?: number;
  roleName?: string;
  idSede?: number | string;
}

@Injectable({ providedIn: 'root' })
export class TransferUserContextService {
  private readonly authService = inject(AuthService, { optional: true });

  // TODO(aggregated-temporal): sustituir fallback localStorage cuando auth central exponga contexto uniforme.
  getCurrentUserId(defaultValue: number = 22): number {
    const authUser = this.authService?.getCurrentUser?.();
    const authUserId = Number(authUser?.userId ?? 0);
    if (authUserId > 0) {
      return authUserId;
    }

    const user = this.readStoredUser();
    const storedId = Number(user?.userId ?? user?.id_usuario ?? 0);
    return storedId > 0 ? storedId : defaultValue;
  }

  getCurrentRole(defaultValue: TransferRole = 'JEFE DE ALMACEN'): TransferRole {
    const authUser = this.authService?.getCurrentUser?.();
    const roleFromAuth = this.mapRole(authUser?.roleId, authUser?.roleName);
    if (roleFromAuth) {
      return roleFromAuth;
    }

    const user = this.readStoredUser();
    const role = this.mapRole(user?.roleId, user?.roleName);
    return role ?? defaultValue;
  }

  getCurrentHeadquarterId(): string | null {
    // Requerimiento funcional: priorizar sede del usuario logeado desde localStorage.
    const user = this.readStoredUser();
    if (user?.idSede === undefined || user?.idSede === null) {
      const authUser = this.authService?.getCurrentUser?.();
      const authSede = authUser?.idSede;
      return authSede !== undefined && authSede !== null ? String(authSede) : null;
    }

    return String(user.idSede);
  }

  isAdmin(): boolean {
    return this.getCurrentRole() === 'ADMINISTRADOR';
  }

  private mapRole(
    roleId?: number | null,
    roleName?: string | null,
  ): TransferRole | null {
    if (roleId === UserRole.ADMIN) {
      return 'ADMINISTRADOR';
    }

    if (roleId === UserRole.ALMACEN) {
      return 'JEFE DE ALMACEN';
    }

    const normalized = String(roleName ?? '').trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    if (normalized.includes('ADMIN')) {
      return 'ADMINISTRADOR';
    }

    if (normalized.includes('ALMACEN') || normalized.includes('JEFE')) {
      return 'JEFE DE ALMACEN';
    }

    return null;
  }

  private readStoredUser(): StoredUserShape | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as StoredUserShape) : null;
    } catch {
      return null;
    }
  }
}
