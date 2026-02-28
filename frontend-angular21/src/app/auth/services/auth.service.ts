// src/app/auth/services/auth.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { UserRole } from '../../core/constants/roles.constants';
import { User } from '../../core/interfaces/user.interface'; // ✅ Asegúrate que esté
import { EmpleadosService } from '../../core/services/empleados.service';
import {
  AuthInterface,
  AuthInterfaceResponse,
  AuthAccountBackend,
} from '../interfaces/auth.interface';

import { ROLE_NAME_TO_ID } from '../../core/constants/roles.constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private empleadosService = inject(EmpleadosService);

  private api = environment.apiUrl || 'http://localhost:3000';
  private currentUser: User | null = null;
  constructor() {
    this.verificarSesionActiva();
  }

  private verificarSesionActiva(): void {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (userStr && token) {
        this.currentUser = JSON.parse(userStr);
        this.empleadosService.sincronizarDesdeAuth();
      }
    } catch (error) {
      console.error('Error al recuperar sesión:', error);
      this.logout();
    }
  }

  private mapRoleToRoleId(rolNombre: string): UserRole {
    const normalizedRole = rolNombre.toLowerCase();
    const roleId = ROLE_NAME_TO_ID[normalizedRole];

    if (!roleId) {
      console.error('Rol no reconocido:', rolNombre);
      throw new Error(`Rol "${rolNombre}" no es válido`);
    }

    return roleId;
  }

  private transformUser(account: AuthAccountBackend): User {
    return {
      userId: account.usuario.id_usuario,
      username: account.username,
      email: account.email_emp,
      roleId: account.roles[0]?.id_rol,
      roleName: account.roles[0]?.nombre,
      idSede: account.id_sede, // ✅
      sedeNombre: account.sede_nombre, // ✅
      permisos: account.permisos.map((p) => p.nombre),
      nombres: account.usuario.nombres, // ✅
      apellidos: `${account.usuario.ape_pat} ${account.usuario.ape_mat}`, // ✅
    };
  }

  private redirectByRole(roleId: UserRole): void {
    const routes: Record<UserRole, string> = {
      [UserRole.ADMIN]: '/admin/dashboard-admin',
      [UserRole.VENTAS]: '/ventas/caja',
      [UserRole.ALMACEN]: '/almacen/dashboard',
      [UserRole.LOGISTICA]: '/logistica/dashboard',
    };

    const route = routes[roleId];
    this.router.navigate([route]);
  }

  login(username: string, password: string): Observable<AuthInterfaceResponse> {
    const loginData: AuthInterface = { username, password };

    return this.http.post<AuthInterfaceResponse>(`${this.api}/auth/auth/login`, loginData).pipe(
      tap((response) => {
        const account = response.account;
        const transformedUser = this.transformUser(account);

        this.currentUser = transformedUser;

        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(transformedUser));

        this.empleadosService.sincronizarDesdeAuth();

        this.redirectByRole(transformedUser.roleId);
      }),
    );
  }

  logout(): void {
    this.currentUser = null;
    this.empleadosService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.currentUser !== null && !!localStorage.getItem('token');
  }

  getRole(): string | null {
    if (!this.currentUser) return null;

    const roleNames: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'admin',
      [UserRole.VENTAS]: 'ventas',
      [UserRole.ALMACEN]: 'almacen',
      [UserRole.LOGISTICA]: 'logistica',
    };

    return roleNames[this.currentUser.roleId as UserRole] || null; // ✅ Cast
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUsername(): string | null {
    return this.currentUser?.username || null;
  }

  getEmail(): string | null {
    return this.currentUser?.email || null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRoleId(): UserRole | null {
    return this.currentUser?.roleId || null;
  }

  isAdmin(): boolean {
    return this.currentUser?.roleId === UserRole.ADMIN;
  }

  isVentas(): boolean {
    return this.currentUser?.roleId === UserRole.VENTAS;
  }

  isAlmacen(): boolean {
    return this.currentUser?.roleId === UserRole.ALMACEN;
  }
}
