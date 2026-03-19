import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

import { AuthService } from '../../auth/services/auth.service';
import { RoleService } from '../../core/services/role.service';
import { CashboxSocketService } from '../../ventas/services/cashbox-socket.service';
import { EmpresaService } from '../../administracion/services/empresa.service';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  permiso: string;
}

interface MenuSection {
  label: string;
  icon: string;
  permisoSeccion: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    DrawerModule,
    BadgeModule,
    RouterModule,
    ToastModule,
    ConfirmDialog,
    TitleCasePipe,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  providers: [ConfirmationService, MessageService],
})
export class Sidebar implements OnInit {

  visible = true;
  activeMenu: string | null = null;
  menuSections: MenuSection[] = [];
  roleName: string = 'Invitado';
  username: string = '';

  private cashboxSocket = inject(CashboxSocketService);
  private cdr = inject(ChangeDetectorRef);
  private empresaService = inject(EmpresaService);
  empresa = this.empresaService.empresaActual;

  private readonly SIDEBAR_ROUTES: MenuSection[] = [
    {
      label: 'VENTAS',
      icon: 'pi pi-shopping-cart',
      permisoSeccion: 'VENTAS',
      items: [
        { path: '/admin/dashboard-admin',                 label: 'Dashboard',                  icon: 'pi pi-home',               permiso: 'VER_DASHBOARD_ADMIN' },
        { path: '/admin/caja',                            label: 'Caja',                       icon: 'pi pi-money-bill',         permiso: 'VER_CAJA' },
        { path: '/admin/generar-ventas-administracion',   label: 'Crear Venta', icon: 'pi pi-plus-circle',        permiso: 'CREAR_VENTA_ADMIN' },
        { path: '/admin/historial-ventas-administracion', label: 'Historial Ventas',     icon: 'pi pi-list',               permiso: 'VER_VENTAS_ADMIN' },
        { path: '/admin/nota-credito',                    label: 'Notas de Crédito',           icon: 'pi pi-credit-card',        permiso: 'CREAR_NC' },
        { path: '/admin/descuentos',                      label: 'Descuentos',                 icon: 'pi pi-tag',                permiso: 'CREAR_DESCUENTO' },
        { path: '/admin/promociones',                     label: 'Promociones',                icon: 'pi pi-percentage',         permiso: 'CREAR_PROMOCION' },
        { path: '/admin/ventas-por-cobrar',               label: 'Ventas por Cobrar',          icon: 'pi pi-wallet',             permiso: 'CREAR_VENTA_POR_COBRAR' },
        { path: '/admin/clientes',                        label: 'Clientes',                   icon: 'pi pi-users',              permiso: 'CREAR_CLIENTE' },
        { path: '/admin/cotizaciones',                    label: 'Cotizaciones',               icon: 'pi pi-id-card',            permiso: 'CREAR_COTIZACIONES' },
        { path: '/admin/reclamos-listado',                label: 'Reclamos',                   icon: 'pi pi-exclamation-circle', permiso: 'CREAR_RECLAMO' },
        { path: '/admin/notas-credito',                   label: 'Notas de Credito',           icon: 'pi pi-id-card',            permiso: 'VER_NOTAS_CREDITO' }
      ]
    },

    // ================= ALMACÉN =================
    {
      label: 'ALMACÉN',
      icon: 'pi pi-box',
      permisoSeccion: 'ALMACEN',
      items: [
        { path: '/admin/dashboard-almacen',         label: 'Dashboard Almacén',     icon: 'pi pi-chart-bar', permiso: 'VER_DASHBOARD_ALMACEN' },
        { path: '/admin/almacen',                   label: 'Almacén',               icon: 'pi pi-box',       permiso: 'CREAR_ALMACEN' },
        { path: '/logistica/remision',              label: 'Remisión',              icon: 'pi pi-truck',     permiso: 'CREAR_REMISION' },
        { path: '/logistica/conteo-inventario',     label: 'Conteo Inventario',     icon: 'pi pi-folder',    permiso: 'CONTEO_INVENTARIO' },
        { path: '/logistica/movimiento-inventario', label: 'Movimiento Inventario', icon: 'pi pi-database',  permiso: 'CREAR_MOV_INVENTARIO' },
        { path: '/logistica/ajuste-inventario',     label: 'Ajuste Inventario',     icon: 'pi pi-cog',       permiso: 'CREAR_AJUSTE_INVENTARIO' },
      ]
    },

    // ================= ADMINISTRACIÓN =================
    {
      label: 'ADMINISTRACIÓN',
      icon: 'pi pi-cog',
      permisoSeccion: 'ADMINISTRACION',
      items: [
        { path: '/admin/transferencia',      label: 'Transferencias', icon: 'pi pi-arrows-h',             permiso: 'CREAR_TRANSFERENCIA' },
        { path: '/admin/despacho-productos', label: 'Despacho',       icon: 'pi pi-truck',                permiso: 'CREAR_DESPACHO' },
        { path: '/admin/usuarios',           label: 'Empleados',      icon: 'pi pi-user-plus',            permiso: 'CREAR_USUARIOS' },
        { path: '/admin/roles-permisos',     label: 'Permisos',       icon: 'pi pi-key',                  permiso: 'ADMINISTRACION' },
        { path: '/admin/gestion-productos',  label: 'Productos',      icon: 'pi pi-tags',                 permiso: 'CREAR_PRODUCTOS' },
        { path: '/admin/categoria',          label: 'Categorías',     icon: 'pi pi-list',                 permiso: 'CREAR_CATEGORIAS' },
        { path: '/admin/sedes',              label: 'Sedes',          icon: 'pi pi-building',             permiso: 'CREAR_SEDES' },
        { path: '/admin/comision',           label: 'Comisiones',     icon: 'pi pi-wallet',               permiso: 'CREAR_COMISIONES' },
        { path: '/admin/mermas',             label: 'Mermas',         icon: 'pi pi-exclamation-triangle', permiso: 'CREAR_MERMAS' },
        { path: '/admin/remates',            label: 'Remates',        icon: 'pi pi-tag',                  permiso: 'CREAR_REMATES' },
        { path: '/admin/proveedores',        label: 'Proveedores',    icon: 'pi pi-truck',                permiso: 'CREAR_PROVEEDORES' },
      ]
    },

    // ================= SECCIÓN PRINCIPAL =================
    {
      label: 'PRINCIPAL', 
      icon: 'pi pi-shopping-cart',
      permisoSeccion: 'PRINCIPAL',
      items: [
        { path: '/ventas/caja',              label: 'Estado Caja',       icon: 'pi pi-wallet',             permiso: 'VER_CAJA' },
        { path: '/ventas/dashboard-ventas',  label: 'Dashboard',         icon: 'pi pi-chart-line',         permiso: 'VER_DASHBOARD_VENTAS' },
        { path: '/ventas/generar-ventas',    label: 'Generar Venta',     icon: 'pi pi-plus-circle',        permiso: 'CREAR_VENTA' },
        { path: '/ventas/historial-ventas',  label: 'Historial Ventas',  icon: 'pi pi-list',               permiso: 'VER_VENTAS' },
        { path: '/ventas/reclamos-listado',  label: 'Reclamos',          icon: 'pi pi-exclamation-circle', permiso: 'CREAR_RECLAMO' },
        { path: '/ventas/nota-credito',      label: 'Notas de Crédito',  icon: 'pi pi-credit-card',        permiso: 'CREAR_NC' },
        { path: '/ventas/promociones',       label: 'Promociones',       icon: 'pi pi-percentage',         permiso: 'CREAR_PROMOCION' },
        { path: '/ventas/reporte-ventas',    label: 'Reporte de Ventas', icon: 'pi pi-chart-bar',          permiso: 'VER_REPORTES' },
        { path: '/ventas/ventas-por-cobrar', label: 'Ventas por Cobrar', icon: 'pi pi-wallet',             permiso: 'CREAR_VENTA_POR_COBRAR' },
        { path: '/ventas/cotizaciones',      label: 'Cotizaciones',      icon: 'pi pi-file',               permiso: 'CREAR_COTIZACIONES' },
        { path: '/ventas/remates',           label: 'Remates',           icon: 'pi pi-tag',                permiso: 'CREAR_REMATES' },
        { path: '/logistica/movimiento-inventario',       label: 'Movimientos',       icon: 'pi pi-book',              permiso: 'VER_MOVIMIENTOS' },
      ]
    },
  ];

  // ================= CONSTRUCTOR =================

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService,
    private roleService: RoleService
  ) {}

  // ================= INIT =================

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadMenu();
    this.iniciarSuscripcionReactiva();
  }

  private iniciarSuscripcionReactiva(): void {
    this.authService.permisosActualizados$.subscribe(() => {
      console.log('🔄 Sidebar detectó nuevos permisos. Redibujando menú...');
      this.loadUserInfo();
      this.loadMenu();
      this.cdr.detectChanges();
    });
  }

  // ================= CARGAR USUARIO =================

  private loadUserInfo(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.username = user.username;
      this.roleName = user.roleName ?? 'Invitado';
    }
  }

  // ================= CARGAR MENU =================

  private loadMenu(): void {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const permisos = user?.permisos || [];
    const roleName = user?.roleName || 'Invitado';

    if (!permisos.length) {
      console.warn('⚠️ No hay permisos activos');
      this.menuSections = [];
      return;
    }

    this.menuSections = this.SIDEBAR_ROUTES
      .map(section => {
        const itemsPermitidos = section.items.filter(item => permisos.includes(item.permiso));
        
        return {
          ...section,
          label: section.permisoSeccion === 'PRINCIPAL' ? roleName : section.label,
          items: itemsPermitidos
        };
      })
      .filter(section => section.items.length > 0);
  }

  toggleMenu(menu: string): void {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  // ================= VALIDACION CAJA =================

  navigateTo(event: Event, path: string): void {
    const rutasQueRequierenCajaAbierta = [
      '/ventas/generar-ventas',
      '/admin/generar-ventas-administracion',
    ];

    if (rutasQueRequierenCajaAbierta.includes(path)) {
      const caja = this.cashboxSocket.caja();

      // Si la caja no está abierta, nadie (ni siquiera el administrador root) puede crear ventas.
      if (!caja || caja.estado !== 'ABIERTA') {
        event.preventDefault();
        event.stopPropagation();
        this.messageService.add({
          severity: 'warn',
          summary: 'Caja Cerrada',
          detail: 'Debes abrir la caja antes de poder realizar ventas.',
          life: 3500
        });
      }
    }
  }

  // ================= LOGOUT =================

  confirm2(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Alerta',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Aceptar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },

      accept: () => {
        this.authService.logout();
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmación',
          detail: 'Cierre de sesión exitoso'
        });
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Cierre de sesión cancelado'
        });
      }
    });
  }
}