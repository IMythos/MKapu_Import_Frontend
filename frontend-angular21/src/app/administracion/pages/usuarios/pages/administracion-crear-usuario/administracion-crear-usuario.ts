import { Component, AfterViewInit, ChangeDetectorRef, signal , OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { UsuarioService } from '../../../../services/usuario.service';
import { UsuarioInterfaceResponse } from '../../../../interfaces/usuario.interface';
import { AuthService } from '../../../../../auth/services/auth.service';
import { SedeService } from '../../../../services/sede.service';
import {RoleService} from "../../../../services/role.service";
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';

interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-administracion-crear-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    CardModule,
    InputTextModule,
    SelectModule,
    RouterModule,
    ToastModule,         
    MessageModule,        
    ConfirmDialogModule, 
    DialogModule          
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './administracion-crear-usuario.html',
  styleUrls: ['./administracion-crear-usuario.css']
})
export class AdministracionCrearUsuario implements AfterViewInit, OnInit {


  ngOnInit(): void {
  this.cargandoUsuarios = true;
  const currentUser = this.authService.getCurrentUser();
  if (currentUser?.idSede) {
    this.filtroSede = currentUser.idSede;
  } else {
    this.filtroSede = null;
  }
  this.cdr.detectChanges();

  forkJoin({
    sedes    : this.sedeService.getSedes(),
    usuarios : this.usuarioService.getUsuariosPorEstado(true),
    roles    : this.roleService.loadRoles(), // ← agregar
  }).subscribe({
    next: ({ sedes, usuarios, roles }) => {
      this.Sede = [
        { label: 'Todas', value: null },
        ...sedes.headquarters.map(s => ({
          label: s.nombre,
          value: s.id_sede,
        })),
      ];

      // Roles desde BD — solo activos, opción "Todos" al inicio
      this.Rol = [
        { label: 'Todos', value: null },
        ...roles
          .filter(r => r.activo)
          .map(r => ({
            label: r.nombre.toUpperCase(),
            value: r.nombre.toUpperCase(),
          })),
      ];

      this.allUsers = usuarios.users;
      this.cargandoUsuarios = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.cargandoUsuarios = false;
      this.errorUsuarios = 'Error al cargar datos';
    },
  });
}

  private allUsers: UsuarioInterfaceResponse[] = [];
  cargandoUsuarios = false;
  errorUsuarios = '';
  filtroDni      = '';
  filtroEstado   : boolean | null = true;  
  filtroSede     : number | null  = null;   // Sede seleccionada por defecto
  filtroRol      : string | null  = null;  
  estados: SelectOption[] = [
    { label: 'Todos',    value: null  },
    { label: 'Activo',   value: true  },
    { label: 'Inactivo', value: false }
  ];

  Sede: SelectOption[] = [];

  Rol: SelectOption[] = [
    { label: 'Todos',         value: null           },
    { label: 'ADMINISTRADOR', value: 'ADMINISTRADOR' },
    { label: 'ALMACEN',       value: 'ALMACEN'       },
    { label: 'VENTAS',        value: 'VENTAS'        }
  ];

  dialogVisible = false;
  usuarioSeleccionado = signal<UsuarioInterfaceResponse | null>(null);

  // ── getter: filtra el array maestro ────────────────────────────────────────
  get usuariosFiltrados(): UsuarioInterfaceResponse[] {
    let result = [...this.allUsers];

    // Filtro DNI
    if (this.filtroDni.trim()) {
      result = result.filter(u =>
        (u.dni || '').includes(this.filtroDni.trim())
      );
    }

    // Filtro Sede — usa id_sede (campo real de la interfaz)
    if (this.filtroSede !== null) {
      result = result.filter(u => u.id_sede === this.filtroSede);
    }

    // Filtro Rol — compara contra rolNombre (campo real de la interfaz)
    if (this.filtroRol !== null) {
      result = result.filter(u => {
        const rol = (u.rolNombre || u.rol_nombre || u.rol || u.role || '').toUpperCase();
        return rol === this.filtroRol;
      });
    }
    return result;
  }

  get totalusers(): number {
    return this.usuariosFiltrados.length;
  }

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private sedeService: SedeService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private roleService: RoleService
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.inicializar());
  }

  private inicializar(): void {
    this.cargandoUsuarios = true;
    setTimeout(() => {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.idSede) {
        this.filtroSede = currentUser.idSede;
      } else {
        this.filtroSede = null;
      }

      forkJoin({
        sedes    : this.sedeService.getSedes(),
        usuarios : this.usuarioService.getUsuariosPorEstado(true),
        roles    : this.roleService.loadRoles(), // ← agregar
      }).subscribe({
        next: ({ sedes, usuarios, roles }) => {
          this.Sede = [
            { label: 'Todas', value: null },
            ...sedes.headquarters.map(s => ({
              label: s.nombre,
              value: s.id_sede,
            })),
          ];

          this.Rol = [
            { label: 'Todos', value: null },
            ...roles
              .filter(r => r.activo)
              .map(r => ({
                label: r.nombre.toUpperCase(),
                value: r.nombre.toUpperCase(),
              })),
          ];

          this.allUsers = usuarios.users;
          this.cargandoUsuarios = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargandoUsuarios = false;
          this.errorUsuarios = 'Error al cargar datos';
        },
      });
    }, 2000);
  }

  // Recarga backend según filtro estado
  onEstadoChange(): void {
    this.cargandoUsuarios = true;
    const request$ =
      this.filtroEstado === null
        ? this.usuarioService.getUsuarios()
        : this.usuarioService.getUsuariosPorEstado(this.filtroEstado);

    request$.subscribe({
      next: (resp) => {
        this.allUsers = resp.users;
        this.cargandoUsuarios = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoUsuarios = false;
        this.errorUsuarios = 'Error al filtrar usuarios';
      }
    });
  }

  // Sede y Rol → el getter reacciona solo al cambio de variable
  onSedeChange(): void {}
  onRolChange(): void {}
  aplicarFiltros(): void {}

  limpiarFiltro(): void {
    // Pone la sede por defecto del usuario
    const currentUser = this.authService.getCurrentUser();
    this.filtroDni    = '';
    this.filtroEstado = true;
    this.filtroSede   = currentUser?.idSede ?? null;
    this.filtroRol    = null;
    this.onEstadoChange();
  }

  nuevoUsuario(): void {
    this.router.navigate(['/admin/usuarios/crear-usuario']);
  }

  // Modal y acciones como en sedes
  verDetalle(usuario: UsuarioInterfaceResponse): void {
    this.usuarioSeleccionado.set(usuario);
    this.dialogVisible = true;
  }

  confirmToggleStatus(usuario: UsuarioInterfaceResponse): void {
    const nextStatus = !usuario.activo;
    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';
    const acceptSeverity = nextStatus ? 'success' : 'danger';
    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} el usuario ${usuario.usu_nom} (${usuario.dni})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: acceptSeverity as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.usuarioService.updateUsuarioStatus(usuario.id_usuario, { activo: nextStatus }).subscribe({
          next: () => {
            usuario.activo = nextStatus;
            this.messageService.add({
              severity: 'success',
              summary: nextStatus ? 'Usuario activado' : 'Usuario desactivado',
              detail: nextStatus
                ? `Se activó el usuario ${usuario.usu_nom}.`
                : `Se desactivó el usuario ${usuario.usu_nom}.`,
            });
            this.onEstadoChange();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado del usuario.',
            });
          },
        });
      },
    });
  }
}