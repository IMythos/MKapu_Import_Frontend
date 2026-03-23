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

interface MenuItem     { path: string; label: string; icon: string; permiso: string; }
interface MenuSection  { label: string; icon: string; permisoSeccion: string; items: MenuItem[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, DrawerModule, BadgeModule,
            RouterModule, ToastModule, ConfirmDialog, TitleCasePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  providers: [ConfirmationService, MessageService],
})
export class Sidebar implements OnInit {

  visible     = true;
  activeMenu: string | null = null;
  menuSections: MenuSection[] = [];
  roleName  = 'Invitado';
  username  = '';

  private cashboxSocket  = inject(CashboxSocketService);
  private cdr            = inject(ChangeDetectorRef);
  private empresaService = inject(EmpresaService);
  empresa = this.empresaService.empresaActual;

  // ── Permisos que existen en BD pero NO tienen página en el frontend ────────
  private readonly SIN_PAGINA = new Set([
    'VENTAS', 'ALMACEN', 'PRINCIPAL',
    'VER_LIBRO_VENTAS', 'VER_REPORTES', 'VER_NOTAS_CREDITO',
    'CREAR_NOTA_CREDITO',
  ]);

  // ── Mapa permiso → datos del item (única fuente de verdad) ────────────────
  private readonly ITEM: Record<string, Omit<MenuItem, 'permiso'>> = {
    // Ventas Admin

    VER_DASHBOARD_ADMIN:     { path: '/admin/dashboard-admin',                 label: 'Dashboard',         icon: 'pi pi-home' },
    VER_CAJA:                { path: '/admin/caja',                            label: 'Caja',              icon: 'pi pi-money-bill' },
    CREAR_VENTA_ADMIN:       { path: '/admin/generar-ventas-administracion',   label: 'Crear Venta',       icon: 'pi pi-plus-circle' },
    VER_VENTAS_ADMIN:        { path: '/admin/historial-ventas-administracion', label: 'Historial Ventas',  icon: 'pi pi-list' },
    CREAR_NC:                { path: '/admin/nota-credito',                    label: 'Notas de Crédito',  icon: 'pi pi-credit-card' },
    CREAR_DESCUENTO:         { path: '/admin/descuentos',                      label: 'Descuentos',        icon: 'pi pi-tag' },
    CREAR_PROMOCION:         { path: '/admin/promociones',                     label: 'Promociones',       icon: 'pi pi-percentage' },
    CREAR_VENTA_POR_COBRAR:  { path: '/admin/ventas-por-cobrar',               label: 'Ventas por Cobrar', icon: 'pi pi-wallet' },
    CREAR_CLIENTE:              { path: '/admin/clientes',                        label: 'Clientes',              icon: 'pi pi-users' },
    CREAR_COTIZACIONES:         { path: '/admin/cotizaciones-venta',              label: 'Cotizaciones Venta',    icon: 'pi pi-id-card' },
    CREAR_COTIZACIONES_COMPRA:  { path: '/admin/cotizaciones-compra',             label: 'Cotizaciones Compra',   icon: 'pi pi-id-card' },
    CREAR_RECLAMO:              { path: '/admin/reclamos-listado',                label: 'Reclamos',              icon: 'pi pi-exclamation-circle' },
    // Almacén
    VER_DASHBOARD_ALMACEN:   { path: '/admin/dashboard-almacen',              label: 'Dashboard Almacén', icon: 'pi pi-chart-bar' },
    CREAR_ALMACEN:           { path: '/admin/almacen',                         label: 'Almacén',           icon: 'pi pi-box' },
    CREAR_REMISION:          { path: '/logistica/remision',                    label: 'Remisión',          icon: 'pi pi-truck' },
    CONTEO_INVENTARIO:       { path: '/admin/conteo-inventario',               label: 'Conteo Inventario', icon: 'pi pi-folder' },
    CREAR_MOV_INVENTARIO:    { path: '/logistica/movimiento-inventario',           label: 'Mov. Inventario',   icon: 'pi pi-database' },
    CREAR_AJUSTE_INVENTARIO: { path: '/logistica/ajuste-inventario',               label: 'Ajuste Inventario', icon: 'pi pi-cog' },
    // Administración
    CREAR_TRANSFERENCIA:     { path: '/admin/transferencia',                   label: 'Transferencias',    icon: 'pi pi-arrows-h' },
    CREAR_DESPACHO:          { path: '/admin/despacho-productos',              label: 'Despacho',          icon: 'pi pi-truck' },
    CREAR_USUARIOS:          { path: '/admin/usuarios',                        label: 'Empleados',         icon: 'pi pi-user-plus' },
    CREAR_PRODUCTOS:         { path: '/admin/gestion-productos',               label: 'Productos',         icon: 'pi pi-tags' },
    CREAR_CATEGORIAS:        { path: '/admin/categoria',                       label: 'Categorías',        icon: 'pi pi-list' },
    CREAR_SEDES:             { path: '/admin/sedes',                           label: 'Sedes',             icon: 'pi pi-building' },
    CREAR_COMISIONES:        { path: '/admin/comision',                        label: 'Comisiones',        icon: 'pi pi-wallet' },
    CREAR_MERMAS:            { path: '/admin/mermas',                          label: 'Mermas',            icon: 'pi pi-exclamation-triangle' },
    CREAR_REMATES:           { path: '/admin/remates',                         label: 'Remates',           icon: 'pi pi-tag' },
    CREAR_PROVEEDORES:       { path: '/admin/proveedores',                     label: 'Proveedores',       icon: 'pi pi-truck' },
    AGREGAR_DOCUMENTO:       { path: '/admin/documento-contador',              label: 'Documentos',        icon: 'pi pi-file' },
    CREAR_PERMISOS:          { path: '/admin/roles-permisos',                  label: 'Permisos',          icon: 'pi pi-key' },
    // Ventas usuario — mismas rutas /admin/, el permiso limita el acceso
    //borrarVER_DASHBOARD_VENTAS:    { path: '/admin/dashboard-admin',                 label: 'Dashboard',         icon: 'pi pi-chart-line' },
    //borrarCREAR_VENTA:             { path: '/admin/generar-ventas-administracion',   label: 'Generar Venta',     icon: 'pi pi-plus-circle' },
    //borrarVER_VENTAS:              { path: '/admin/historial-ventas-administracion', label: 'Historial Ventas',  icon: 'pi pi-list' },
    //borrarVER_MOVIMIENTOS:         { path: '/admin/movimiento-inventario',           label: 'Movimientos',       icon: 'pi pi-book' },
  };

  // ── Secciones fijas: definen qué permisos pertenecen a cada categoría ─────
  private readonly SECCIONES: { label: string; icon: string; permisoSeccion: string; permisos: string[] }[] = [
    {
      label: 'VENTAS', icon: 'pi pi-shopping-cart', permisoSeccion: 'VENTAS',
      permisos: ['VER_DASHBOARD_ADMIN','VER_CAJA','CREAR_VENTA_ADMIN','VER_VENTAS_ADMIN',
                 'CREAR_NC','CREAR_PROMOCION','CREAR_VENTA_POR_COBRAR',
                 'CREAR_CLIENTE','CREAR_COTIZACIONES','CREAR_COTIZACIONES_COMPRA','CREAR_RECLAMO'],
    },
    {
      label: 'ALMACÉN', icon: 'pi pi-box', permisoSeccion: 'ALMACEN',
      permisos: ['VER_DASHBOARD_ALMACEN','CREAR_ALMACEN','CREAR_REMISION',
                 'CONTEO_INVENTARIO','CREAR_MOV_INVENTARIO','CREAR_AJUSTE_INVENTARIO'],
    },
    {
      label: 'ADMINISTRADOR', icon: 'pi pi-cog', permisoSeccion: 'ADMINISTRACION',
      permisos: [ 'CREAR_PERMISOS','CREAR_TRANSFERENCIA','CREAR_DESPACHO','CREAR_PRODUCTOS',
                 'CREAR_CATEGORIAS','CREAR_SEDES','CREAR_MERMAS',
                 'CREAR_REMATES','SEGUIMIENTO_EMPLEADO','CREAR_PROVEEDORES','ADMINISTRACION'],
    },
    {
      label: 'DELIVERY', icon: 'pi pi-truck', permisoSeccion: 'ADMINISTRACION',
      permisos: ['CREAR_USUARIOS'],
    },
    {
      label: 'CONTABILIDAD', icon: 'pi pi-money-bill', permisoSeccion: 'ADMINISTRACION',
      permisos: ['AGREGAR_DOCUMENTO'],
    },
    {
      label: 'RRHH', icon: 'pi pi-users', permisoSeccion: 'ADMINISTRACION',
      permisos: ['CREAR_USUARIOS','CREAR_COMISIONES','CREAR_DESCUENTO'],
    },
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router,
    private authService: AuthService,
    private roleService: RoleService,
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadMenu();
    this.iniciarSuscripcionReactiva();
    this.cargarEmpresa();
  }

  private cargarEmpresa(): void {
    this.empresaService.getEmpresa().subscribe({
      error: (err) => console.error('Error cargando empresa en sidebar:', err),
    });
  }

  private iniciarSuscripcionReactiva(): void {
    this.authService.permisosActualizados$.subscribe(() => {
      this.loadUserInfo();
      this.loadMenu();
      this.cdr.detectChanges();
    });
  }

  private loadUserInfo(): void {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user    = JSON.parse(raw);
      this.username = user.username;
      this.roleName = user.roleName ?? 'Invitado';
    }
  }

  private loadMenu(): void {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;

    const permisosRaw: string[] = user?.permisos || [];
    const roleName: string      = user?.roleName  || 'Invitado';

    if (!permisosRaw.length) { this.menuSections = []; return; }

    // Expandir CREAR_COTIZACIONES en dos entradas para mostrar ambas páginas
    const permisos = permisosRaw.includes('CREAR_COTIZACIONES')
      ? [...permisosRaw, 'CREAR_COTIZACIONES_COMPRA']
      : permisosRaw;

    const esAdmin = roleName.toUpperCase() === 'ADMINISTRADOR';

    if (esAdmin) {
      this.menuSections = this.SECCIONES
        .map(s => ({
          label: s.label, icon: s.icon, permisoSeccion: s.permisoSeccion,
          items: s.permisos
            .filter(p => permisos.includes(p) && this.ITEM[p])
            .map(p => ({ permiso: p, ...this.ITEM[p] })),
        }))
        .filter(s => s.items.length > 0);
    } else {
      const cubiertos = new Set(this.SECCIONES.flatMap(s => s.permisos));
      const items: MenuItem[] = permisos
        .filter(p => !this.SIN_PAGINA.has(p) && this.ITEM[p])
        .map(p => ({ permiso: p, ...this.ITEM[p] }));

      this.menuSections = items.length > 0
        ? [{ label: roleName.toUpperCase(), icon: 'pi pi-user', permisoSeccion: 'ROL', items }]
        : [];
    }
  }

  toggleMenu(menu: string): void {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  navigateTo(event: Event, path: string): void {
    const requierenCaja = ['/ventas/generar-ventas', '/admin/generar-ventas-administracion'];
    if (requierenCaja.includes(path)) {
      const caja = this.cashboxSocket.caja();
      if (!caja || caja.estado !== 'ABIERTA') {
        event.preventDefault();
        event.stopPropagation();
        this.messageService.add({
          severity: 'warn', summary: 'Caja Cerrada',
          detail: 'Debes abrir la caja antes de poder realizar ventas.', life: 3500,
        });
      }
    }
  }

  confirm2(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Alerta', icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar', acceptLabel: 'Aceptar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.authService.logout();
        this.messageService.add({ severity: 'success', summary: 'Confirmación', detail: 'Cierre de sesión exitoso' });
        setTimeout(() => this.router.navigate(['/login']), 1000);
      },
      reject: () => {
        this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'Cierre de sesión cancelado' });
      },
    });
  }
}
