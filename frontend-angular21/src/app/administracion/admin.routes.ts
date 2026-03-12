import { Routes } from '@angular/router';
import { pendingChangesGuard } from '../core/guards/pending-changes.guard';
import { CashboxAdminGuard } from '../ventas/guards/cashbox.guard';

export const ADMIN_ROUTES: Routes = [

  /* =======================
      DASHBOARD
  ======================= */
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard-admin',
    loadComponent: () =>
      import('./pages/dashboard-admin/dashboard-admin').then((m) => m.DashboardAdmin),
  },
  {
    path: 'dashboard-almacen',
    loadComponent: () =>
      import('../almacen/pages/dashboard-almacen/dashboard-almacen').then((m) => m.DashboardAlmacen),
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./pages/notificacion-admin/notificacion-admin').then((m) => m.NotificacionAdmin),
  },

  /* =======================
      USUARIOS
  ======================= */
  {
    path: 'usuarios',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/usuarios/pages/administracion-crear-usuario/administracion-crear-usuario').then(
            (m) => m.AdministracionCrearUsuario,
          ),
      },
      {
        path: 'crear-usuario',
        loadComponent: () =>
          import('./pages/usuarios/pages/administracion/administracion').then((m) => m.Administracion),
      },
      {
        path: 'editar-usuario/:id',
        loadComponent: () =>
          import('./pages/usuarios/pages/administracion-editar-usuario/administracion-editar-usuario').then(
            (m) => m.AdministracionEditarUsuario,
          ),
      },
    ],
  },

  /* =======================
      ALMACÉN
  ======================= */
  {
    path: 'almacen',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/almacen/pages/listar-almacen/almacen').then((m) => m.AlmacenListado),
      },
      {
        path: 'crear-almacen',
        loadComponent: () =>
          import('./pages/almacen/pages/agregar-almacen/agregar-almacen').then((m) => m.AlmacenCrear),
      },
      {
        path: 'editar-almacen/:id',
        loadComponent: () =>
          import('./pages/almacen/pages/editar-almacen/editar-almacen').then((m) => m.AlmacenEditar),
      },
    ],
  },

  /* =======================
      SEDES
  ======================= */
  {
    path: 'sedes',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/sedes/pages/sedes/sedes').then((m) => m.Sedes),
      },
      {
        path: 'agregar-sede',
        loadComponent: () =>
          import('./pages/sedes/pages/agregar-sede/agregar-sede').then((m) => m.AgregarSede),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-sede',
        loadComponent: () =>
          import('./pages/sedes/pages/editar-sede/editar-sede').then((m) => m.EditarSede),
        canDeactivate: [pendingChangesGuard],
      },
    ],
  },

  /* =======================
      CATEGORÍAS
  ======================= */
  {
    path: 'categoria',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/categoria/pages/categoria/categoria').then((m) => m.CategoriaListado),
      },
      {
        path: 'agregar-categoria',
        loadComponent: () =>
          import('./pages/categoria/pages/agregar-categoria/agregar-categoria').then((m) => m.AgregarCategoria),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-categoria/:id',
        loadComponent: () =>
          import('./pages/categoria/pages/editar-categoria/editar-categoria').then((m) => m.EditarCategoria),
        canDeactivate: [pendingChangesGuard],
      },
    ],
  },

  /* =======================
      ROLES Y PERMISOS
  ======================= */
  {
    path: 'roles-permisos',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/roles-permisos/pages/roles-permisos-listado/role-permission-listado.component').then(
            (m) => m.RolePermissionListadoComponent,
          ),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles-permisos/roles/pages/roles-listado/roles-listado.component').then(
            (m) => m.RolesListadoComponent,
          ),
      },
      {
        path: 'agregar-rol',
        loadComponent: () =>
          import('./pages/roles-permisos/roles/pages/agregar-rol/agregar-rol.component').then(
            (m) => m.AgregarRolComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-rol/:id',
        loadComponent: () =>
          import('./pages/roles-permisos/roles/pages/editar-role/editar-rol.component').then(
            (m) => m.EditarRolComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./pages/roles-permisos/permisos/pages/permisos-listado/permisos-listado.component').then(
            (m) => m.PermisosListadoComponent,
          ),
      },
      {
        path: 'agregar-permiso',
        loadComponent: () =>
          import('./pages/roles-permisos/permisos/pages/agregar-permiso/agregar-permiso.component').then(
            (m) => m.AgregarPermisoComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-permiso/:id',
        loadComponent: () =>
          import('./pages/roles-permisos/permisos/pages/editar-permiso/editar-permiso.component').then(
            (m) => m.EditarPermisoComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'agregar-roles-permisos',
        loadComponent: () =>
          import('./pages/roles-permisos/pages/agregar-roles-permisos/agregar-roles-permisos.component').then(
            (m) => m.AgregarRolesPermisosComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-roles-permisos/:id',
        loadComponent: () =>
          import('./pages/roles-permisos/pages/editar-roles-permisos/editar-rol.component').then(
            (m) => m.EditarRolComponent,
          ),
        canDeactivate: [pendingChangesGuard],
      },
    ],
  },

  /* =======================
      CLIENTES
  ======================= */
  {
    path: 'clientes',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/clientes/pages/clientes/clientes').then((m) => m.Clientes),
      },
      {
        path: 'agregar-cliente',
        loadComponent: () =>
          import('./pages/clientes/pages/agregar-cliente/agregar-cliente').then((m) => m.AgregarCliente),
      },
      {
        path: 'editar-cliente/:id',
        loadComponent: () =>
          import('./pages/clientes/pages/editar-cliente/editar-cliente').then((m) => m.EditarCliente),
      },
    ],
  },

  /* =======================
      PROVEEDORES
  ======================= */
  {
    path: 'proveedores',
    loadComponent: () =>
      import('./pages/gestion-proveedor/proveedor-listado/proveedor-listado').then((m) => m.ProveedorListado),
    children: [
      {
        path: 'crear',
        loadComponent: () =>
          import('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then(
            (m) => m.ProveedorFormulario,
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then(
            (m) => m.ProveedorFormulario,
          ),
      },
      {
        path: 'ver-detalle/:id',
        loadComponent: () =>
          import('./pages/gestion-proveedor/proveedor-detalles/proveedor-detalles').then(
            (m) => m.ProveedorDetalles,
          ),
      },
    ],
  },

  /* =======================
      GESTIÓN DE PRODUCTOS
  ======================= */
  {
    path: 'gestion-productos',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/gestion-productos/productos-listado/gestion-listado').then((m) => m.GestionListado),
      },
      {
        path: 'crear-producto',
        loadComponent: () =>
          import('./pages/gestion-productos/productos-formulario/productos-formulario').then(
            (m) => m.ProductosFormulario,
          ),
      },
      {
        path: 'editar-producto/:id',
        loadComponent: () =>
          import('./pages/gestion-productos/productos-formulario/productos-formulario').then(
            (m) => m.ProductosFormulario,
          ),
      },
      {
        path: 'ver-detalle-producto/:id',
        loadComponent: () =>
          import('./pages/gestion-productos/productos-detalles/productos-detalles').then(
            (m) => m.ProductosDetalles,
          ),
      },
    ],
  },

  /* =======================
      TRANSFERENCIAS
  ======================= */
  {
    path: 'transferencia',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/reportes/pages/transferencia/transferencia').then((m) => m.Transferencia),
      },
      {
        path: 'nueva-transferencia',
        loadComponent: () =>
          import('./pages/reportes/pages/nueva-transferencia/nueva-transferencia').then(
            (m) => m.NuevaTransferencia,
          ),
      },
      {
        path: 'solicitud-transferencia/:id',
        loadComponent: () =>
          import('./pages/reportes/pages/detalle-transferencia/detalle-transferencia').then(
            (m) => m.DetalleTransferencia,
          ),
      },
    ],
  },
  { path: 'transferencias',                              redirectTo: 'transferencia',                                    pathMatch: 'full' },
  { path: 'transferencias/nueva-transferencia',          redirectTo: 'transferencia/nueva-transferencia',                pathMatch: 'full' },
  { path: 'transferencias/solicitud-transferencia/:id',  redirectTo: 'transferencia/solicitud-transferencia/:id',        pathMatch: 'full' },
  { path: 'transferencias/notificacion',                 redirectTo: 'transferencia/notificacion',                       pathMatch: 'full' },

  /* =======================
      VENTAS ADMINISTRACIÓN
  ======================= */
  {
    path: 'caja',
    loadComponent: () =>
      import('../ventas/pages/caja/caja.page').then((m) => m.CajaPage),
  },
  {
    path: 'generar-ventas-administracion',
    loadComponent: () =>
      import('./pages/generar-ventas-administracion/generar-ventas-administracion').then(
        (m) => m.GenerarVentasAdministracion,
      ),
    canActivate: [CashboxAdminGuard],
  },
  {
    path: 'historial-ventas-administracion',
    loadComponent: () =>
      import('./pages/historial-ventas-administracion/historial-ventas-administracion').then(
        (m) => m.HistorialVentasAdministracion,
      ),
  },
  {
    path: 'detalles-ventas-administracion/:id',
    loadComponent: () =>
      import('./shared/detalles-ventas-administracion/detalles-ventas-administracion').then(
        (m) => m.DetallesVentasAdministracion,
      ),
  },

  /* =======================
      VENTAS POR COBRAR
  ======================= */
  {
    path: 'ventas-por-cobrar',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado').then(
            (m) => m.VentasPorCobrarListadoComponent,
          ),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('./pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario').then(
            (m) => m.VentasPorCobrarFormulario,
          ),
      },
      {
        path: 'detalles/:id',
        loadComponent: () =>
          import('./pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario').then(
            (m) => m.DetalleVentaPorCobrar,
          ),
      },
      {
        path: 'pagar/:id',
        loadComponent: () =>
          import('./pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component').then(
            (m) => m.VentasPorCobrarPagoComponent,
          ),
      },
    ],
  },
  // Redirects para mantener compatibilidad con rutas antiguas planas
  { path: 'agregar-ventas-por-cobrar',       redirectTo: 'ventas-por-cobrar/agregar',       pathMatch: 'full' },
  { path: 'detalles-ventas-por-cobrar/:id',  redirectTo: 'ventas-por-cobrar/detalles/:id',  pathMatch: 'full' },
  { path: 'pagar-ventas-por-cobrar/:id',     redirectTo: 'ventas-por-cobrar/pagar/:id',     pathMatch: 'full' },

  /* =======================
      COTIZACIONES
  ======================= */
  {
    path: 'cotizaciones',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/gestion-cotizacion/gestion-listado/gestion-listado').then(
            (m) => m.GestionCotizacionesComponent,
          ),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('./pages/gestion-cotizacion/gestion-formulario/cotizacion-formulario').then(
            (m) => m.CotizacionFormulario,
          ),
      },
      {
        path: 'ver-detalle/:id',
        loadComponent: () =>
          import('./pages/gestion-cotizacion/detalle-gestion-formulario/detalle-cotizacion-formulario').then(
            (m) => m.DetalleCotizacionComponent,
          ),
      },
    ],
  },
  { path: 'agregar-cotizaciones',        redirectTo: 'cotizaciones/agregar',        pathMatch: 'full' },
  { path: 'ver-detalle-cotizacion/:id',  redirectTo: 'cotizaciones/ver-detalle/:id', pathMatch: 'full' },

  /* =======================
      PROMOCIONES
  ======================= */
  {
    path: 'promociones',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/gestion-promociones/promociones-listado/promociones-listado').then(
            (m) => m.PromocionesListado,
          ),
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('./pages/gestion-promociones/promociones-formulario/promociones-formulario').then(
            (m) => m.PromocionesFormulario,
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./pages/gestion-promociones/promociones-formulario/promociones-formulario').then(
            (m) => m.PromocionesFormulario,
          ),
      },
      {
        path: 'ver-detalle/:id',
        loadComponent: () =>
          import('./pages/gestion-promociones/promociones-detalles/promociones-detalles').then(
            (m) => m.PromocionesDetalles,
          ),
      },
    ],
  },

  /* =======================
      DESCUENTOS
  ======================= */
  {
    path: 'descuentos',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/descuento/pages/descuento/descuento').then((m) => m.DescuentoPage),
      },
      {
        path: 'agregar-descuento',
        loadComponent: () =>
          import('./pages/descuento/pages/agregar-descuento/agregar-descuento').then((m) => m.AgregarDescuento),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-descuento/:id',
        loadComponent: () =>
          import('./pages/descuento/pages/editar-descuento/editar-descuento').then((m) => m.EditarDescuento),
        canDeactivate: [pendingChangesGuard],
      },
    ],
  },

  /* =======================
      COMISIONES
  ======================= */
  {
    path: 'comision',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/comision/comision').then((m) => m.Comision),
      },
      {
        path: 'regla',
        loadComponent: () =>
          import('./pages/comision/comision-regla/comisionregla').then((m) => m.ComisionRegla),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/comision/comision-reportes/comisionreportes').then((m) => m.ComisionReportes),
      },
    ],
  },
  { path: 'comision-regla',    redirectTo: 'comision/regla',    pathMatch: 'full' },
  { path: 'comision-reportes', redirectTo: 'comision/reportes', pathMatch: 'full' },

  /* =======================
      MERMAS
  ======================= */
  {
    path: 'mermas',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mermas/pages/mermas-pr/mermas-pr').then((m) => m.MermasPr),
      },
      {
        path: 'registro-merma',
        loadComponent: () =>
          import('./pages/mermas/pages/mermas-registro/mermas-registro').then((m) => m.MermasRegistro),
      },
      {
        path: 'edicion-merma-remate',
        loadComponent: () =>
          import('./pages/mermas-remates/pages/mermas-remates-edc/mermas-remates-edc').then(
            (m) => m.MermasRematesEdcComponent,
          ),
      },
    ],
  },

  /* =======================
      REMATES
  ======================= */
  {
    path: 'remates',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/remates/pages/remates-pr/remates-pr').then((m) => m.RematesPr),
      },
      {
        path: 'registro-remate',
        loadComponent: () =>
          import('./pages/remates/pages/remates-registro/remates-registro').then((m) => m.RematesRegistro),
      },
    ],
  },
  /* =======================
    DESPACHO PRODUCTOS
  ======================= */
  {
    path: 'despacho-productos',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/despacho-productos/pages/listado-despacho/listado-despacho').then(
            (m) => m.ListadoDespacho,
          ),
      },

      {
        path: 'agregar-despacho',
        loadComponent: () =>
          import('./pages/despacho-productos/pages/agregar-despacho/agregar-despacho').then(
            (m) => m.AgregarDespacho,
          ),
      },
      {
        path: 'detalle-despacho/:id',
        loadComponent: () =>
          import('./pages/despacho-productos/pages/detalles-despacho/detalles-despacho').then(
            (m) => m.DetallesDespacho,
          ),
      },
      {
        path: 'editar-despacho/:id',
        loadComponent: () =>
          import('./pages/despacho-productos/pages/editar-despacho/editar-despacho').then(
            (m) => m.EditarDespacho,
          ),
      },
    ],
  },
  /* =======================
      CONTEO DE INVENTARIO
  ======================= */
  {
    path: 'conteo-inventario',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../logistica/pages/conteo-inventario/conteoinventario').then((m) => m.ConteoInventarios),
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('../logistica/pages/conteo-crear/conteocrear').then((m) => m.ConteoCrear),
      },
      {
        path: 'detalle/:id',
        loadComponent: () =>
          import('../logistica/pages/conteo-detalle/conteodetalle').then((m) => m.ConteoDetalle),
      },
    ],
  },
  { path: 'conteo-crear',        redirectTo: 'conteo-inventario/crear',       pathMatch: 'full' },
  { path: 'conteo-detalle/:id',  redirectTo: 'conteo-inventario/detalle/:id', pathMatch: 'full' },

  /* =======================
      RECLAMOS Y GARANTÍAS
  ======================= */
  {
    path: 'reclamos-listado',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado').then(
            (m) => m.ReclamosListado,
          ),
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('../ventas/pages/reclamos-garantia/reclamos-crear/reclamos-crear').then(
            (m) => m.ReclamosCrear,
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('../ventas/pages/reclamos-garantia/reclamos-editar/reclamos-editar').then(
            (m) => m.ReclamosEditar,
          ),
      },
      {
        path: 'detalle/:id',
        loadComponent: () =>
          import('../ventas/pages/reclamos-garantia/reclamos-detalles/reclamos-detalles').then(
            (m) => m.ReclamosDetalles,
          ),
      },
    ],
  },

  /* =======================
      TÉRMINOS Y CONDICIONES
  ======================= */
  {
    path: 'terminos-condiciones',
    loadComponent: () =>
      import('./pages/reportes/pages/terminos-condiciones/terminos-condiciones').then(
        (m) => m.TerminosCondicionesComponent,
      ),
  },




];