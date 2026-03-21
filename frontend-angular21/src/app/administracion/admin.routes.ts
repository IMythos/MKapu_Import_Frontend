import { Routes } from '@angular/router';
import { pendingChangesGuard } from '../core/guards/pending-changes.guard';
import { CashboxAdminGuard } from '../ventas/guards/cashbox.guard';
import { roleGuard } from '../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'empresa/configuracion',
    loadComponent: () =>
      import('./pages/empresa/empresa-configuracion')
        .then(m => m.EmpresaConfiguracion),
    canActivate: [roleGuard],
    data: { permiso: 'ADMINISTRACION' }, 
  },
  {
    path: 'empleados/:id/seguimiento',
    loadComponent: () =>
      import('./pages/usuarios/pages/empleado-seguimiento/seguimiento-empleado') 
        .then(m => m.SeguimientoEmpleado),
    canActivate: [roleGuard],
    data: { permiso: 'ADMINISTRACION' },
  },
  {
    path: 'dashboard-admin',
    loadComponent: () => import('./pages/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin),
    canActivate: [roleGuard],
    data: { permiso: 'VER_DASHBOARD_ADMIN' }
  },
  {
    path: 'dashboard-almacen',
    loadComponent: () => import('../almacen/pages/dashboard-almacen/dashboard-almacen').then((m) => m.DashboardAlmacen),
    canActivate: [roleGuard],
    data: { permiso: 'VER_DASHBOARD_ALMACEN' }
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./pages/notificacion-admin/notificacion-admin').then((m) => m.NotificacionAdmin),
    canActivate: [roleGuard],
    data: { permiso: 'VER_DASHBOARD_ADMIN' }
  },

  {
    path: 'usuarios',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_USUARIOS' },
    children: [
      { path: '', loadComponent: () => import('./pages/usuarios/pages/administracion-crear-usuario/administracion-crear-usuario').then((m) => m.AdministracionCrearUsuario) },
      { path: 'crear-usuario', loadComponent: () => import('./pages/usuarios/pages/administracion/administracion').then((m) => m.Administracion) },
      { path: 'editar-usuario/:id', loadComponent: () => import('./pages/usuarios/pages/administracion-editar-usuario/administracion-editar-usuario').then((m) => m.AdministracionEditarUsuario) },
    ],
  },

  {
    path: 'almacen',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_ALMACEN' },
    children: [
      { path: '', loadComponent: () => import('./pages/almacen/pages/listar-almacen/almacen').then((m) => m.AlmacenListado) },
      { path: 'crear-almacen', loadComponent: () => import('./pages/almacen/pages/agregar-almacen/agregar-almacen').then((m) => m.AlmacenCrear) },
      { path: 'editar-almacen/:id', loadComponent: () => import('./pages/almacen/pages/editar-almacen/editar-almacen').then((m) => m.AlmacenEditar) },
    ],
  },

  {
    path: 'sedes',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_SEDES' },
    children: [
      { path: '', loadComponent: () => import('./pages/sedes/pages/sedes/sedes').then((m) => m.Sedes) },
      { path: 'agregar-sede', loadComponent: () => import('./pages/sedes/pages/agregar-sede/agregar-sede').then((m) => m.AgregarSede), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-sede', loadComponent: () => import('./pages/sedes/pages/editar-sede/editar-sede').then((m) => m.EditarSede), canDeactivate: [pendingChangesGuard] },
    ],
  },

  {
    path: 'categoria',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_CATEGORIAS' },
    children: [
      { path: '', loadComponent: () => import('./pages/categoria/pages/categoria/categoria').then((m) => m.CategoriaListado) },
      { path: 'agregar-categoria', loadComponent: () => import('./pages/categoria/pages/agregar-categoria/agregar-categoria').then((m) => m.AgregarCategoria), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-categoria/:id', loadComponent: () => import('./pages/categoria/pages/editar-categoria/editar-categoria').then((m) => m.EditarCategoria), canDeactivate: [pendingChangesGuard] },
    ],
  },

  {
    path: 'roles-permisos',
    canActivate: [roleGuard],
    data: { permiso: 'ADMINISTRACION' },
    children: [
      { path: '', loadComponent: () => import('./pages/roles-permisos/pages/roles-permisos-listado/role-permission-listado.component').then((m) => m.RolePermissionListadoComponent) },
      { path: 'roles', loadComponent: () => import('./pages/roles-permisos/roles/pages/roles-listado/roles-listado.component').then((m) => m.RolesListadoComponent) },
      { path: 'agregar-rol', loadComponent: () => import('./pages/roles-permisos/roles/pages/agregar-rol/agregar-rol.component').then((m) => m.AgregarRolComponent), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-rol/:id', loadComponent: () => import('./pages/roles-permisos/roles/pages/editar-role/editar-rol.component').then((m) => m.EditarRolComponent), canDeactivate: [pendingChangesGuard] },
      { path: 'permisos', loadComponent: () => import('./pages/roles-permisos/permisos/pages/permisos-listado/permisos-listado.component').then((m) => m.PermisosListadoComponent) },
      { path: 'agregar-permiso', loadComponent: () => import('./pages/roles-permisos/permisos/pages/agregar-permiso/agregar-permiso.component').then((m) => m.AgregarPermisoComponent), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-permiso/:id', loadComponent: () => import('./pages/roles-permisos/permisos/pages/editar-permiso/editar-permiso.component').then((m) => m.EditarPermisoComponent), canDeactivate: [pendingChangesGuard] },
      { path: 'agregar-roles-permisos', loadComponent: () => import('./pages/roles-permisos/pages/agregar-roles-permisos/agregar-roles-permisos.component').then((m) => m.AgregarRolesPermisosComponent), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-roles-permisos/:id', loadComponent: () => import('./pages/roles-permisos/pages/editar-roles-permisos/editar-rol.component').then((m) => m.EditarRolComponent), canDeactivate: [pendingChangesGuard] },
    ],
  },

  {
    path: 'clientes',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_CLIENTE' },
    children: [
      { path: '', loadComponent: () => import('./pages/clientes/pages/clientes/clientes').then((m) => m.Clientes) },
      { path: 'agregar-cliente', loadComponent: () => import('./pages/clientes/pages/agregar-cliente/agregar-cliente').then((m) => m.AgregarCliente) },
      { path: 'editar-cliente/:id', loadComponent: () => import('./pages/clientes/pages/editar-cliente/editar-cliente').then((m) => m.EditarCliente) },
    ],
  },

  {
    path: 'proveedores',
    loadComponent: () => import('./pages/gestion-proveedor/proveedor-listado/proveedor-listado').then((m) => m.ProveedorListado),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_PROVEEDORES' },
    children: [
      { path: 'crear', loadComponent: () => import('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then((m) => m.ProveedorFormulario) },
      { path: 'editar/:id', loadComponent: () => import('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then((m) => m.ProveedorFormulario) },
      { path: 'ver-detalle/:id', loadComponent: () => import('./pages/gestion-proveedor/proveedor-detalles/proveedor-detalles').then((m) => m.ProveedorDetalles) },
    ],
  },

  {
    path: 'gestion-productos',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_PRODUCTOS' },
    children: [
      { path: '', loadComponent: () => import('./pages/gestion-productos/productos-listado/gestion-listado').then((m) => m.GestionListado) },
      { path: 'crear-producto', loadComponent: () => import('./pages/gestion-productos/productos-formulario/productos-formulario').then((m) => m.ProductosFormulario) },
      { path: 'editar-producto/:id', loadComponent: () => import('./pages/gestion-productos/productos-formulario/productos-formulario').then((m) => m.ProductosFormulario) },
      { path: 'ver-detalle-producto/:id', loadComponent: () => import('./pages/gestion-productos/productos-detalles/productos-detalles').then((m) => m.ProductosDetalles) },
    ],
  },

  {
    path: 'transferencia',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_TRANSFERENCIA' },
    children: [
      { path: '', loadComponent: () => import('./pages/reportes/pages/transferencia/transferencia').then((m) => m.Transferencia) },
      { path: 'nueva-transferencia', loadComponent: () => import('./pages/reportes/pages/nueva-transferencia/nueva-transferencia').then((m) => m.NuevaTransferencia) },
      { path: 'solicitud-transferencia/:id', loadComponent: () => import('./pages/reportes/pages/detalle-transferencia/detalle-transferencia').then((m) => m.DetalleTransferencia) },
    ],
  },
  { path: 'transferencias', redirectTo: 'transferencia', pathMatch: 'full' },
  { path: 'transferencias/nueva-transferencia', redirectTo: 'transferencia/nueva-transferencia', pathMatch: 'full' },
  { path: 'transferencias/solicitud-transferencia/:id', redirectTo: 'transferencia/solicitud-transferencia/:id', pathMatch: 'full' },
  { path: 'transferencias/notificacion', redirectTo: 'transferencia/notificacion', pathMatch: 'full' },

  {
    path: 'caja',
    loadComponent: () => import('../ventas/pages/caja/caja.page').then((m) => m.CajaPage),
    canActivate: [roleGuard],
    data: { permiso: 'VER_CAJA' }
  },
  {
    path: 'generar-ventas-administracion',
    loadComponent: () => import('./pages/generar-ventas-administracion/generar-ventas-administracion').then((m) => m.GenerarVentasAdministracion),
    canActivate: [roleGuard, CashboxAdminGuard],
    data: { permiso: 'CREAR_VENTA_ADMIN' }
  },
  {
    path: 'historial-ventas-administracion',
    loadComponent: () => import('./pages/historial-ventas-administracion/historial-ventas-administracion').then((m) => m.HistorialVentasAdministracion),
    canActivate: [roleGuard],
    data: { permiso: 'VER_VENTAS_ADMIN' }
  },
  {
    path: 'detalles-ventas-administracion/:id',
    loadComponent: () => import('./shared/detalles-ventas-administracion/detalles-ventas-administracion').then((m) => m.DetallesVentasAdministracion),
    canActivate: [roleGuard],
    data: { permiso: 'VER_VENTAS_ADMIN' }
  },
  {
    path: 'nota-credito',
    //canActivate: [roleGuard],
    //data: { permiso: 'CREAR_NOTA_CREDITO' },
    children: [
      { 
      path: '', // 👇 Ruta por defecto: Renderiza el listado (Ej: /admin/nota-credito)
      loadComponent: () => import('./pages/nota-credito/nota-credito').then((m) => m.NotasCreditoComponent) 
    },
    { 
      path: 'crear', // 👇 Renderiza el formulario (Ej: /admin/nota-credito/crear)
      loadComponent: () => import('./pages/nota-credito/agregar-nota-credito/agregar-nota-credito').then((m) => m.AgregarNotaCreditoComponent) 
    }
    ]
  },
  {
    path: 'ventas-por-cobrar',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_VENTA_POR_COBRAR' },
    children: [
      { path: '', loadComponent: () => import('./pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado').then((m) => m.VentasPorCobrarListadoComponent) },
      { path: 'agregar', loadComponent: () => import('./pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario').then((m) => m.VentasPorCobrarFormulario) },
      { path: 'detalles/:id', loadComponent: () => import('./pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario').then((m) => m.DetalleVentaPorCobrar) },
      { path: 'pagar/:id', loadComponent: () => import('./pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component').then((m) => m.VentasPorCobrarPagoComponent) },
    ],
  },
  { path: 'agregar-ventas-por-cobrar', redirectTo: 'ventas-por-cobrar/agregar', pathMatch: 'full' },
  { path: 'detalles-ventas-por-cobrar/:id', redirectTo: 'ventas-por-cobrar/detalles/:id', pathMatch: 'full' },
  { path: 'pagar-ventas-por-cobrar/:id', redirectTo: 'ventas-por-cobrar/pagar/:id', pathMatch: 'full' },

  {
    path: 'cotizaciones-compra',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_COTIZACIONES' },
    children: [
      { path: '', loadComponent: () => import('./pages/gestion-cotizacion-compra/gestion-listado/gestion-compras-listado').then((m) => m.GestionComprasComponent) },
      { path: 'agregar-cotizaciones', loadComponent: () => import('./pages/gestion-cotizacion-compra/gestion-formulario/cotizacion-compra-formulario').then((m) => m.CotizacionCompraFormulario) },
      { path: 'ver-detalle-cotizacion/:id', loadComponent: () => import('./pages/gestion-cotizacion-compra/detalle-gestion-formulario/detalle-cotizacion-formulario').then((m) => m.DetalleCotizacionComponent) },
    ],
  },
  {
    path: 'cotizaciones-venta',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_COTIZACIONES' },
    children: [
      { path: '', loadComponent: () => import('./pages/gestion-cotizacion-venta/gestion-listado/gestion-listado').then((m) => m.GestionCotizacionesComponent) },
      { path: 'agregar-cotizaciones', loadComponent: () => import('./pages/gestion-cotizacion-venta/gestion-formulario/cotizacion-formulario').then((m) => m.CotizacionFormulario) },
      { path: 'ver-detalle-cotizacion/:id', loadComponent: () => import('./pages/gestion-cotizacion-venta/detalle-gestion-formulario/detalle-cotizacion-formulario').then((m) => m.DetalleCotizacionComponent) },
    ],
  },


  { path: 'agregar-cotizaciones', redirectTo: 'cotizaciones/agregar', pathMatch: 'full' },
  { path: 'ver-detalle-cotizacion/:id', redirectTo: 'cotizaciones/ver-detalle-cotizacion/:id', pathMatch: 'full' },

  {
    path: 'promociones',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_PROMOCION' },
    children: [
      { path: '', loadComponent: () => import('./pages/gestion-promociones/promociones-listado/promociones-listado').then((m) => m.PromocionesListado) },
      { path: 'crear', loadComponent: () => import('./pages/gestion-promociones/promociones-formulario/promociones-formulario').then((m) => m.PromocionesFormulario) },
      { path: 'editar/:id', loadComponent: () => import('./pages/gestion-promociones/promociones-formulario/promociones-formulario').then((m) => m.PromocionesFormulario) },
      { path: 'ver-detalle/:id', loadComponent: () => import('./pages/gestion-promociones/promociones-detalles/promociones-detalles').then((m) => m.PromocionesDetalles) },
    ],
  },

  {
    path: 'descuentos',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESCUENTO' },
    children: [
      { path: '', loadComponent: () => import('./pages/descuento/pages/descuento/descuento').then((m) => m.DescuentoPage) },
      { path: 'agregar-descuento', loadComponent: () => import('./pages/descuento/pages/agregar-descuento/agregar-descuento').then((m) => m.AgregarDescuento), canDeactivate: [pendingChangesGuard] },
      { path: 'editar-descuento/:id', loadComponent: () => import('./pages/descuento/pages/editar-descuento/editar-descuento').then((m) => m.EditarDescuento), canDeactivate: [pendingChangesGuard] },
    ],
  },

  {
    path: 'comision',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_COMISIONES' },
    children: [
      { path: '', loadComponent: () => import('./pages/comision/comision').then((m) => m.Comision) },
      { path: 'regla', loadComponent: () => import('./pages/comision/comision-regla/comisionregla').then((m) => m.ComisionRegla) },
      { path: 'reportes', loadComponent: () => import('./pages/comision/comision-reportes/comisionreportes').then((m) => m.ComisionReportes) },
    ],
  },
  { path: 'comision-regla', redirectTo: 'comision/regla', pathMatch: 'full' },
  { path: 'comision-reportes', redirectTo: 'comision/reportes', pathMatch: 'full' },

  {
    path: 'mermas',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_MERMAS' },
    children: [
      { path: '', loadComponent: () => import('./pages/mermas/pages/mermas-pr/mermas-pr').then((m) => m.MermasPr) },
      { path: 'registro-merma', loadComponent: () => import('./pages/mermas/pages/mermas-registro/mermas-registro').then((m) => m.MermasRegistro) },
      { path: 'edicion-merma/:id', loadComponent: () => import('./pages/mermas/pages/mermas-listado/mermas-editar').then((m) => m.MermasEditar) },    ],
  },

  {
    path: 'remates',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_REMATES' },
    children: [
      { path: '', loadComponent: () => import('./pages/remates/pages/remates-pr/remates-pr').then((m) => m.RematesPr) },
      { path: 'registro-remate', loadComponent: () => import('./pages/remates/pages/remates-registro/remates-registro').then((m) => m.RematesRegistro) },
      { path: 'editar-remate/:id', loadComponent: () => import('./pages/remates/pages/remates-list/editar-remate').then((m) => m.EditarRemateComponent) },
    ],
  },

  {
    path: 'documento-contador',
    loadComponent: () => import('./pages/contador/pages/documento-contador/documento-contador').then((m) => m.DocumentoContador),
    canActivate: [roleGuard],
    //data: { permiso: 'AGREGAR_DOCUMENTO' }
  },

  {
    path: 'despacho-productos',
    loadComponent: () => import('./pages/despacho-productos/pages/listado-despacho/listado-despacho').then((m) => m.ListadoDespacho),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESPACHO' }
  },
  {
    path: 'despacho-productos/detalle-despacho/:id',
    loadComponent: () => import('./pages/despacho-productos/pages/detalles-despacho/detalles-despacho').then((m) => m.DetallesDespacho),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESPACHO' }
  },
  {
    path: 'despacho-productos/agregar-despacho',
    loadComponent: () => import('./pages/despacho-productos/pages/agregar-despacho/agregar-despacho').then((m) => m.AgregarDespacho),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESPACHO' }
  },
  {
    path: 'despacho-productos/confirmar-despacho',
    loadComponent: () => import('./pages/despacho-productos/pages/confirmar-despacho/confirmar-despacho').then((m) => m.ConfirmarDespacho),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESPACHO' }
  },
  {
    path: 'despacho-productos/editar-despacho/:id',
    loadComponent: () => import('./pages/despacho-productos/pages/editar-despacho/editar-despacho').then((m) => m.EditarDespacho),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_DESPACHO' }
  },
  {
    path: 'conteo-inventario',
    canActivate: [roleGuard],
    data: { permiso: 'CONTEO_INVENTARIO' },
    children: [
      { path: '', loadComponent: () => import('../logistica/pages/conteo-inventario/conteoinventario').then((m) => m.ConteoInventarios) },
      { path: 'crear', loadComponent: () => import('../logistica/pages/conteo-crear/conteocrear').then((m) => m.ConteoCrear) },
      { path: 'detalle/:id', loadComponent: () => import('../logistica/pages/conteo-detalle/conteodetalle').then((m) => m.ConteoDetalle) },
    ],
  },

  { path: 'conteo-crear', redirectTo: 'conteo-inventario/crear', pathMatch: 'full' },
  { path: 'conteo-detalle/:id', redirectTo: 'conteo-inventario/detalle/:id', pathMatch: 'full' },

  {
    path: 'reclamos-listado',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_RECLAMO' },
    children: [
      { path: '', loadComponent: () => import('../ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado').then((m) => m.ReclamosListado) },
      { path: 'crear', loadComponent: () => import('../ventas/pages/reclamos-garantia/reclamos-crear/reclamos-crear').then((m) => m.ReclamosCrear) },
      { path: 'editar/:id', loadComponent: () => import('../ventas/pages/reclamos-garantia/reclamos-editar/reclamos-editar').then((m) => m.ReclamosEditar) },
      { path: 'detalle/:id', loadComponent: () => import('../ventas/pages/reclamos-garantia/reclamos-detalles/reclamos-detalles').then((m) => m.ReclamosDetalles) },
    ],
  },

  {
    path: 'terminos-condiciones',
    loadComponent: () => import('./pages/reportes/pages/terminos-condiciones/terminos-condiciones').then((m) => m.TerminosCondicionesComponent),
    canActivate: [roleGuard],
    data: { permiso: 'ADMINISTRACION' }
  },
];
