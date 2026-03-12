import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import { UserRole } from '../constants/roles.constants';

export interface Empleado {
  id_empleado: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono?: string;
  cargo: 'ADMIN' | 'VENTAS' | 'ALMACENERO' | 'LOGISTICA';
  id_sede: string;
  nombre_sede?: string;
  usuario: string;
  password?: string;
  estado: boolean;
  fecha_contratacion: Date;
}

interface ApiEmpleado {
  id_usuario: number;
  usu_nom: string;
  ape_pat: string;
  ape_mat: string;
  nombreCompleto: string;
  dni: string;
  email: string;
  celular: string;
  activo: boolean;
  id_sede: number;
  sedeNombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmpleadosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl || 'http://localhost:3000';
  private empleadoActual: Empleado | null = null;

  private empleadosMock: Empleado[] = [
   
  ];

  constructor() {
    this.inicializarSesion();
  }

  private inicializarSesion(): void {
    const sesionGuardada = localStorage.getItem('empleado_sesion');

    if (sesionGuardada) {
      try {
        this.empleadoActual = JSON.parse(sesionGuardada);
      } catch (error) {
        console.error('Error al recuperar sesión de empleado:', error);
        localStorage.removeItem('empleado_sesion');
      }
    }
  }

  private guardarSesion(): void {
    if (this.empleadoActual) {
      localStorage.setItem('empleado_sesion', JSON.stringify(this.empleadoActual));
    }
  }

  cargoToRoleId(cargo: Empleado['cargo']): UserRole {
    const map = {
      'ADMIN': UserRole.ADMIN,
      'VENTAS': UserRole.VENTAS,
      'ALMACENERO': UserRole.ALMACEN,
      'LOGISTICA': UserRole.LOGISTICA
    };
    return map[cargo];
  }

  roleIdToCargo(roleId: UserRole): Empleado['cargo'] {
    const map = {
      [UserRole.ADMIN]: 'ADMIN' as const,
      [UserRole.VENTAS]: 'VENTAS' as const,
      [UserRole.ALMACEN]: 'ALMACENERO' as const,
      [UserRole.LOGISTICA]: 'LOGISTICA' as const
    };
    return map[roleId];
  }

  private transformApiEmpleado(apiEmp: ApiEmpleado): Empleado {
    return {
      id_empleado: `EMP-${apiEmp.id_usuario}`,
      nombres: apiEmp.usu_nom,
      apellidos: `${apiEmp.ape_pat} ${apiEmp.ape_mat}`,
      dni: apiEmp.dni,
      email: apiEmp.email,
      telefono: apiEmp.celular,
      cargo: 'VENTAS',
      id_sede: `SEDE${String(apiEmp.id_sede).padStart(3, '0')}`,
      nombre_sede: apiEmp.sedeNombre,
      usuario: apiEmp.email,
      estado: apiEmp.activo,
      fecha_contratacion: new Date()
    };
  }

  getEmpleadoActual(): Empleado | null {
    return this.empleadoActual;
  }

  getSedeEmpleadoActual(): string {
    return this.empleadoActual?.id_sede || '';
  }

  getNombreCompletoEmpleadoActual(): string {
    if (!this.empleadoActual) return 'Sin asignar';
    return `${this.empleadoActual.nombres} ${this.empleadoActual.apellidos}`;
  }

  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<{ users: ApiEmpleado[], total: number }>(`${this.apiUrl}/users`).pipe(
      map(response => response.users.map(emp => this.transformApiEmpleado(emp))),
      catchError(error => {
        console.warn('API no disponible, usando datos mock:', error);
        return of(this.empleadosMock);
      })
    );
  }

  getEmpleadosPorSede(idSede: string): Empleado[] {
    return this.empleadosMock.filter((emp) => emp.id_sede === idSede && emp.estado);
  }

  getEmpleadosPorCargo(cargo: Empleado['cargo']): Empleado[] {
    return this.empleadosMock.filter((emp) => emp.cargo === cargo && emp.estado);
  }

  loginMock(usuario: string, password: string): boolean {
    const empleado = this.empleadosMock.find(
      (emp) => emp.usuario === usuario && emp.password === password && emp.estado
    );

    if (empleado) {
      this.empleadoActual = empleado;
      this.guardarSesion();
      return true;
    }

    return false;
  }

  logout(): void {
    this.empleadoActual = null;
    localStorage.removeItem('empleado_sesion');
  }

  isAutenticado(): boolean {
    return this.empleadoActual !== null;
  }

  tieneCargo(cargo: Empleado['cargo']): boolean {
    return this.empleadoActual?.cargo === cargo;
  }

  esAdmin(): boolean {
    return this.empleadoActual?.cargo === 'ADMIN';
  }

  esVentas(): boolean {
    return this.empleadoActual?.cargo === 'VENTAS';
  }

  esAlmacenero(): boolean {
    return this.empleadoActual?.cargo === 'ALMACENERO';
  }

  puedeRealizarVentas(): boolean {
    return this.empleadoActual?.cargo === 'ADMIN' || this.empleadoActual?.cargo === 'VENTAS';
  }

  puedeGestionarAlmacen(): boolean {
    return this.empleadoActual?.cargo === 'ADMIN' || this.empleadoActual?.cargo === 'ALMACENERO';
  }

  cambiarEmpleado(idEmpleado: string): boolean {
    const empleado = this.empleadosMock.find(
      (emp) => emp.id_empleado === idEmpleado && emp.estado
    );

    if (empleado) {
      this.empleadoActual = empleado;
      this.guardarSesion();
      return true;
    }

    return false;
  }

  getEtiquetaCargo(cargo: Empleado['cargo']): string {
    const etiquetas = {
      ADMIN: 'Administrador',
      VENTAS: 'Vendedor',
      ALMACENERO: 'Almacenero',
      LOGISTICA: 'Logistica'
    };
    return etiquetas[cargo];
  }

  sincronizarDesdeAuth(): void {
    const userStr = localStorage.getItem('user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        this.empleadoActual = {
          id_empleado: `EMP-${user.userId}`,
          nombres: user.username,
          apellidos: '',
          dni: '',
          email: user.email || '',
          telefono: '',
          cargo: this.roleIdToCargo(user.roleId),
          id_sede: 'SEDE001',
          nombre_sede: '',
          usuario: user.username,
          estado: true,
          fecha_contratacion: new Date()
        };
        
        this.guardarSesion();
      } catch (error) {
        console.error('Error al sincronizar empleado:', error);
      }
    }
  }
}
