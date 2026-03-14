import { Injectable } from '@angular/core';
import { User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class RoleService {

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getRoleName(): string {
    return this.getCurrentUser()?.roleName ?? 'Invitado';
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && !!localStorage.getItem('token');
  }

  getCurrentUserRole(): string | null {
    return this.getCurrentUser()?.roleName ?? null;
  }

  getPermisos(): string[] {
    return this.getCurrentUser()?.permisos ?? [];
  }

  hasPermiso(permiso: string): boolean {
    return this.getPermisos().includes(permiso);
  }
  
}