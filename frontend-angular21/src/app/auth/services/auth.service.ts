import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { User } from '../../core/interfaces/user.interface';
import { EmpleadosService } from '../../core/services/empleados.service';
import {
  AuthInterface,
  AuthInterfaceResponse,
  AuthAccountBackend,
} from '../interfaces/auth.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http             = inject(HttpClient);
  private router           = inject(Router);
  private empleadosService = inject(EmpleadosService);

  private api = environment.apiUrl || 'http://localhost:3000';
  private currentUser: User | null = null;

  constructor() {
    this.verificarSesionActiva();
  }

  // ================= SESION ACTIVA =================

  private verificarSesionActiva(): void {
    try {
      const userStr = localStorage.getItem('user');
      const token   = localStorage.getItem('token');
      if (userStr && token) {
        this.currentUser = JSON.parse(userStr);
        this.empleadosService.sincronizarDesdeAuth();
      }
    } catch (error) {
      console.error('Error al recuperar sesión:', error);
      this.logout();
    }
  }

  // ================= TRANSFORM USER =================

  private transformUser(account: AuthAccountBackend): User {
    return {
      userId:    account.usuario.id_usuario,
      username:  account.username,
      email:     account.email_emp,
      roleId:    account.roles[0]?.id_rol,
      roleName:  account.roles[0]?.nombre,
      idSede:    account.id_sede,
      sedeNombre: account.sede_nombre,
      permisos:  account.permisos.map((p) => p.nombre),
      nombres:   account.usuario.nombres,
      apellidos: `${account.usuario.ape_pat} ${account.usuario.ape_mat}`,
    };
  }

  // ================= REDIRECT POR PERMISOS =================

  private redirectByPermisos(user: User): void {
    const permisos = user.permisos;

    // Admin → sección admin
    if (permisos.includes('VENTAS')) {
      this.router.navigate(['/admin/dashboard-admin']);
      return;
    }

    // Almacén → dashboard almacén
    if (permisos.includes('ALMACEN')) {
      this.router.navigate(['/almacen/dashboard']);
      return;
    }

    // Cualquier rol con PRINCIPAL → primera ruta disponible
    if (permisos.includes('PRINCIPAL')) {
      if (permisos.includes('VER_CAJA'))              { this.router.navigate(['/ventas/caja']);              return; }
      if (permisos.includes('VER_DASHBOARD_VENTAS'))  { this.router.navigate(['/ventas/dashboard-ventas']); return; }
      if (permisos.includes('VER_LIBRO_VENTAS'))      { this.router.navigate(['/ventas/libro-ventas']);      return; }
      if (permisos.includes('VER_REPORTES'))          { this.router.navigate(['/ventas/reporte-ventas']);    return; }
      if (permisos.includes('VER_MOVIMIENTOS'))       { this.router.navigate(['/ventas/movimientos']);       return; }
      this.router.navigate(['/ventas/dashboard-ventas']);
      return;
    }

    // Sin permisos reconocidos
    this.router.navigate(['/login']);
  }

  // ================= LOGIN =================

  login(username: string, password: string): Observable<AuthInterfaceResponse> {
    const loginData: AuthInterface = { username, password };

    return this.http.post<AuthInterfaceResponse>(`${this.api}/auth/auth/login`, loginData).pipe(
      tap((response) => {
        const account         = response.account;
        const transformedUser = this.transformUser(account);

        this.currentUser = transformedUser;

        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(transformedUser));

        this.empleadosService.sincronizarDesdeAuth();

        this.redirectByPermisos(transformedUser); // ← por permisos, no por roleId
      }),
    );
  }

  // ================= LOGOUT =================

  logout(): void {
    this.currentUser = null;
    this.empleadosService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // ================= HELPERS =================

  isLoggedIn(): boolean {
    return this.currentUser !== null && !!localStorage.getItem('token');
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

  getRoleId(): number | null {
    return this.currentUser?.roleId || null;
  }

  hasPermiso(permiso: string): boolean {
    return this.currentUser?.permisos?.includes(permiso) ?? false;
  }

  isAdmin(): boolean {
    return this.hasPermiso('ADMINISTRACION');
  }

  isVentas(): boolean {
    return this.hasPermiso('PRINCIPAL') && this.hasPermiso('CREAR_VENTA');
  }

  isAlmacen(): boolean {
    return this.hasPermiso('ALMACEN');
  }
}