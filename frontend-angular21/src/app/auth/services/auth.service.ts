import { ApplicationRef, Injectable, NgZone, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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
  private http = inject(HttpClient);
  private router = inject(Router);
  private empleadosService = inject(EmpleadosService);
  private appRef = inject(ApplicationRef);
  private ngZone = inject(NgZone);
  public permisosActualizados$ = new BehaviorSubject<boolean>(true);
  private api = environment.apiUrl || 'http://localhost:3000';
  private currentUser: User | null = null;

  constructor() {
    this.verificarSesionActiva();
  }

  // ================= SESION ACTIVA =================

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

  // ================= TRANSFORM USER =================

  private transformUser(account: AuthAccountBackend): User {
    return {
      userId: account.usuario.id_usuario,
      username: account.username,
      email: account.email_emp,
      roleId: account.roles[0]?.id_rol,
      roleName: account.roles[0]?.nombre,
      idSede: account.id_sede,
      sedeNombre: account.sede_nombre,
      permisos: account.permisos.map((p) => p.nombre),
      nombres: account.usuario.nombres,
      apellidos: `${account.usuario.ape_pat} ${account.usuario.ape_mat}`,
    };
  }

  private redirectByPermisos(user: User): void {
    const permisos = user.permisos || [];

    if (permisos.includes('VER_DASHBOARD_ADMIN')) {
      this.router.navigate(['/admin/dashboard-admin']);
      return;
    }
    if (permisos.includes('VER_DASHBOARD_ALMACEN')) {
      this.router.navigate(['/logistica/dashboard']);
      return;
    }
    if (permisos.includes('VER_DASHBOARD_VENTAS')) {
      this.router.navigate(['/ventas/dashboard-ventas']);
      return;
    }

    const rutasSalvavidas: Record<string, string> = {
      VER_CAJA: '/ventas/caja',
      CREAR_VENTA_ADMIN: '/admin/generar-ventas-administracion',
      VER_VENTAS_ADMIN: '/admin/historial-ventas-administracion',
      CREAR_VENTA: '/ventas/generar-ventas',
      VER_VENTAS: '/ventas/historial-ventas',
      CREAR_VENTA_POR_COBRAR: '/ventas/ventas-por-cobrar',
      VER_LIBRO_VENTAS: '/ventas/libro-ventas',
      VER_REPORTES: '/ventas/reporte-ventas',
      CREAR_CLIENTE: '/admin/clientes',
      CREAR_COTIZACIONES: '/ventas/cotizaciones',
      CREAR_PROMOCION: '/ventas/promociones',
      CREAR_DESCUENTO: '/admin/descuentos',
      CREAR_NC: '/ventas/nota-credito',
      CREAR_RECLAMO: '/ventas/reclamos-listado',
      CONTEO_INVENTARIO: '/logistica/conteo-inventario',
      CREAR_MOV_INVENTARIO: '/logistica/movimiento-inventario',
      VER_MOVIMIENTOS: '/ventas/movimiento-inventario',
      CREAR_AJUSTE_INVENTARIO: '/logistica/ajuste-inventario',
      CREAR_REMISION: '/logistica/remision',
      CREAR_ALMACEN: '/admin/almacen',
      CREAR_TRANSFERENCIA: '/admin/transferencia',
      CREAR_DESPACHO: '/admin/despacho-productos',
      CREAR_PRODUCTOS: '/admin/gestion-productos',
      CREAR_CATEGORIAS: '/admin/categoria',
      CREAR_PROVEEDORES: '/admin/proveedores',
      CREAR_COMISIONES: '/admin/comision',
      CREAR_MERMAS: '/admin/mermas',
      CREAR_REMATES: '/ventas/remates',
      CREAR_SEDES: '/admin/sedes',
      CREAR_USUARIOS: '/admin/usuarios',
      ADMINISTRACION: '/admin/roles-permisos',
    };

    for (const [permiso, ruta] of Object.entries(rutasSalvavidas)) {
      if (permisos.includes(permiso)) {
        this.router.navigate([ruta]);
        return;
      }
    }

    console.warn('El usuario está autenticado pero no tiene permisos para ninguna vista.');
    this.logout();
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

        this.redirectByPermisos(transformedUser);
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
  refrescarPermisosSilenciosamente() {
    const token = this.getToken();
    if (!token) {
      return;
    }
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.ngZone.run(() => {
      this.http.get<any>(`${this.api}/auth/auth/refresh-profile`, { headers }).subscribe({
        next: (res) => {
          if (res && res.account) {
            const updatedUser = this.transformUser(res.account);
            this.currentUser = updatedUser;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('permisos', JSON.stringify(updatedUser.permisos));

            this.permisosActualizados$.next(true);

            setTimeout(() => this.appRef.tick(), 0);
          }
        },
        error: (err) => console.error('❌ Error refrescando perfil:', err),
      });
    });
  }
}
