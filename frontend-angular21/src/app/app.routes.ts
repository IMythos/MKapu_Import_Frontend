import { Routes } from '@angular/router';
import { Login } from './auth/pages/login/login';
import { Main } from './layout/main/main';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

import { pendingChangesGuard } from './core/guards/pending-changes.guard';
import { CashboxGuard, CashboxAdminGuard } from './ventas/guards/cashbox.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [

      // ================= DASHBOARD =================
      {
        path: 'admin/dashboard-admin',
        loadComponent: () => import('./administracion/pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin),
      },
      {
        path: 'admin/dashboard-almacen',
        loadComponent: () => import('./almacen/pages/dashboard-almacen/dashboard-almacen').then(m => m.DashboardAlmacen),
      },
      {
        path: 'almacen/dashboard',
        loadComponent: () => import('./almacen/pages/dashboard-almacen/dashboard-almacen').then(m => m.DashboardAlmacen),
      },
      {
        path: 'ventas/dashboard-ventas',
        loadComponent: () => import('./administracion/pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdmin),
      },

      // ================= CAJA =================
      {
        path: 'ventas/caja',
        loadComponent: () => import('./ventas/pages/caja/caja.page').then(m => m.CajaPage),
      },
      {
        path: 'admin/caja',
        loadComponent: () => import('./ventas/pages/caja/caja.page').then(m => m.CajaPage),
      },

      // ================= VENTAS =================
      {
        path: 'ventas/generar-ventas',
        canActivate: [CashboxGuard],
        loadComponent: () => import('./administracion/pages/generar-ventas-administracion/generar-ventas-administracion').then(m => m.GenerarVentasAdministracion),
      },
      {
        path: 'admin/generar-ventas-administracion',
        canActivate: [CashboxAdminGuard],
        loadComponent: () => import('./administracion/pages/generar-ventas-administracion/generar-ventas-administracion').then(m => m.GenerarVentasAdministracion),
      },
      {
        path: 'ventas/historial-ventas',
        canActivate: [CashboxGuard],
        loadComponent: () => import('./administracion/pages/historial-ventas-administracion/historial-ventas-administracion').then(m => m.HistorialVentasAdministracion),
      },
      {
        path: 'admin/historial-ventas-administracion',
        loadComponent: () => import('./administracion/pages/historial-ventas-administracion/historial-ventas-administracion').then(m => m.HistorialVentasAdministracion),
      },
      {
        path: 'admin/detalles-ventas-administracion/:id',
        loadComponent: () => import('./administracion/shared/detalles-ventas-administracion/detalles-ventas-administracion').then(m => m.DetallesVentasAdministracion),
      },
      {
        path: 'ventas/ver-detalle/:id',
        loadComponent: () => import('./administracion/shared/detalles-ventas-administracion/detalles-ventas-administracion').then(m => m.DetallesVentasAdministracion),
      },

      // ================= NOTA CRÉDITO =================
      /*
      {
        path: 'ventas/nota-credito',
        loadComponent: () => import('./ventas/pages/nota-credito/nota-credito').then(m => m.NotaCredito),
      },
      {
        path: 'admin/nota-credito',
        loadComponent: () => import('./ventas/pages/nota-credito/nota-credito').then(m => m.NotaCredito),
      },
*/
      // ================= PROMOCIONES =================
      {
        path: 'ventas/promociones',
        loadComponent: () => import('./ventas/pages/promociones/promociones').then(m => m.Promociones),
      },
      {
        path: 'admin/promociones',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/gestion-promociones/promociones-listado/promociones-listado').then(m => m.PromocionesListado) },
          { path: 'crear', loadComponent: () => import('./administracion/pages/gestion-promociones/promociones-formulario/promociones-formulario').then(m => m.PromocionesFormulario) },
          { path: 'editar/:id', loadComponent: () => import('./administracion/pages/gestion-promociones/promociones-formulario/promociones-formulario').then(m => m.PromocionesFormulario) },
          { path: 'ver-detalle/:id', loadComponent: () => import('./administracion/pages/gestion-promociones/promociones-detalles/promociones-detalles').then(m => m.PromocionesDetalles) },
        ]
      },

        /* 
      TÉRMINOS Y CONDICIONES
*/
      {
        path: 'admin/terminos-condiciones',
        loadComponent: () =>
          import('./administracion/pages/reportes/pages/terminos-condiciones/terminos-condiciones').then(
            (m) => m.TerminosCondicionesComponent,
          ),
      },

      // ================= DESCUENTOS =================
      {
        path: 'admin/descuentos',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/descuento/pages/descuento/descuento').then(m => m.DescuentoPage) },
          { path: 'agregar-descuento', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/descuento/pages/agregar-descuento/agregar-descuento').then(m => m.AgregarDescuento) },
          { path: 'editar-descuento/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/descuento/pages/editar-descuento/editar-descuento').then(m => m.EditarDescuento) },
        ]
      },

      // ================= VENTAS POR COBRAR =================
      {
        path: 'ventas/ventas-por-cobrar',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado').then(m => m.VentasPorCobrarListadoComponent) },
          { path: 'agregar', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario').then(m => m.VentasPorCobrarFormulario) },
          { path: 'detalles/:id', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario').then(m => m.DetalleVentaPorCobrar) },
          { path: 'pagar/:id', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component').then(m => m.VentasPorCobrarPagoComponent) },
        ]
      },
      {
        path: 'admin/ventas-por-cobrar',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado').then(m => m.VentasPorCobrarListadoComponent) },
          { path: 'agregar', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario').then(m => m.VentasPorCobrarFormulario) },
          { path: 'detalles/:id', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario').then(m => m.DetalleVentaPorCobrar) },
          { path: 'pagar/:id', loadComponent: () => import('./administracion/pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component').then(m => m.VentasPorCobrarPagoComponent) },
        ]
      },

      // ================= CLIENTES =================
      {
        path: 'admin/clientes',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/clientes/pages/clientes/clientes').then(m => m.Clientes) },
          { path: 'agregar-cliente', loadComponent: () => import('./administracion/pages/clientes/pages/agregar-cliente/agregar-cliente').then(m => m.AgregarCliente) },
          { path: 'editar-cliente/:id', loadComponent: () => import('./administracion/pages/clientes/pages/editar-cliente/editar-cliente').then(m => m.EditarCliente) },
        ]
      },

    
      {
        path: 'admin/cotizaciones',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/gestion-cotizacion/gestion-listado/gestion-listado').then(m => m.GestionCotizacionesComponent) },
          { path: 'agregar', loadComponent: () => import('./administracion/pages/gestion-cotizacion/gestion-formulario/cotizacion-formulario').then(m => m.CotizacionFormulario) },
          { path: 'ver-detalle/:id', loadComponent: () => import('./administracion/pages/gestion-cotizacion/detalle-gestion-formulario/detalle-cotizacion-formulario').then(m => m.DetalleCotizacionComponent) },
        ]
      },

      // ================= RECLAMOS =================
      {
        path: 'ventas/reclamos-listado',
        children: [
          { path: '', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado').then(m => m.ReclamosListado) },
          { path: 'crear', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-crear/reclamos-crear').then(m => m.ReclamosCrear) },
          { path: 'editar/:id', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-editar/reclamos-editar').then(m => m.ReclamosEditar) },
          { path: 'detalle/:id', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-detalles/reclamos-detalles').then(m => m.ReclamosDetalles) },
        ]
      },
      {
        path: 'admin/reclamos-listado',
        children: [
          { path: '', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado').then(m => m.ReclamosListado) },
          { path: 'crear', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-crear/reclamos-crear').then(m => m.ReclamosCrear) },
          { path: 'editar/:id', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-editar/reclamos-editar').then(m => m.ReclamosEditar) },
          { path: 'detalle/:id', loadComponent: () => import('./ventas/pages/reclamos-garantia/reclamos-detalles/reclamos-detalles').then(m => m.ReclamosDetalles) },
        ]
      },

      // ================= REMATES =================
      {
        path: 'ventas/remates',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/remates/pages/remates-pr/remates-pr').then(m => m.RematesPr) },
          { path: 'registro-remate', loadComponent: () => import('./administracion/pages/remates/pages/remates-registro/remates-registro').then(m => m.RematesRegistro) },
        ]
      },
      {
        path: 'admin/remates',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/remates/pages/remates-pr/remates-pr').then(m => m.RematesPr) },
          { path: 'registro-remate', loadComponent: () => import('./administracion/pages/remates/pages/remates-registro/remates-registro').then(m => m.RematesRegistro) },
        ]
      },

      // ================= LIBRO / REPORTE / MOVIMIENTOS =================
      /*
      {
        path: 'ventas/libro-ventas',
        loadComponent: () => import('./ventas/pages/libro-ventas/libro-ventas').then(m => m.LibroVentas),
      },
      {
        path: 'ventas/reporte-ventas',
        loadComponent: () => import('./ventas/pages/reporte-ventas/reporte-ventas').then(m => m.ReporteVentas),
      },
      {
        path: 'ventas/movimientos',
        loadComponent: () => import('./ventas/pages/movimientos/movimientos').then(m => m.Movimientos),
      },
*/
      // ================= ALMACÉN =================
      {
        path: 'admin/almacen',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/almacen/pages/listar-almacen/almacen').then(m => m.AlmacenListado) },
          { path: 'crear-almacen', loadComponent: () => import('./administracion/pages/almacen/pages/agregar-almacen/agregar-almacen').then(m => m.AlmacenCrear) },
          { path: 'editar-almacen/:id', loadComponent: () => import('./administracion/pages/almacen/pages/editar-almacen/editar-almacen').then(m => m.AlmacenEditar) },
        ]
      },

      // ================= LOGÍSTICA =================
      {
        path: 'logistica/remision',
        children: [
          { path: '', loadComponent: () => import('./logistica/pages/remision/remision').then(m => m.Remision) },
          { path: 'nueva', loadComponent: () => import('./logistica/pages/remision/nueva-remision/nueva-remision').then(m => m.NuevaRemision) },
          { path: 'detalle/:id', loadComponent: () => import('./logistica/pages/remision/detalle-remision/detalle-remision').then(m => m.DetalleRemision) },
        ]
      },
      {
        path: 'logistica/conteo-inventario',
        children: [
          { path: '', loadComponent: () => import('./logistica/pages/conteo-inventario/conteoinventario').then(m => m.ConteoInventarios) },
          { path: 'crear', loadComponent: () => import('./logistica/pages/conteo-crear/conteocrear').then(m => m.ConteoCrear) },
          { path: 'detalle/:id', loadComponent: () => import('./logistica/pages/conteo-detalle/conteodetalle').then(m => m.ConteoDetalle) },
        ]
      },
      {
        path: 'logistica/movimiento-inventario',
        loadComponent: () => import('./logistica/pages/movimientos-inventario/movimientos-inventario').then(m => m.MovimientosInventario),
      },
      {
        path: 'logistica/movimientos-inventario/detalle/:id',
        loadComponent: () => import('./logistica/pages/movimientos-inventario-detalle/movimientos-inventario-detalle').then(m => m.DetalleMovimientoInventario),
      },
      {
        path: 'logistica/ajuste-inventario',
        loadComponent: () => import('./logistica/pages/ajuste-inventario/ajuste-inventario').then(m => m.AjusteInventario),
      },

      // ================= ADMINISTRACIÓN =================
      {
        path: 'admin/transferencia',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/reportes/pages/transferencia/transferencia').then(m => m.Transferencia) },
          { path: 'nueva-transferencia', loadComponent: () => import('./administracion/pages/reportes/pages/nueva-transferencia/nueva-transferencia').then(m => m.NuevaTransferencia) },
          { path: 'solicitud-transferencia/:id', loadComponent: () => import('./administracion/pages/reportes/pages/detalle-transferencia/detalle-transferencia').then(m => m.DetalleTransferencia) },
        ]
      },
      {
        path: 'admin/despacho-productos',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/despacho-productos/pages/listado-despacho/listado-despacho').then(m => m.ListadoDespacho) },
          { path: 'agregar-despacho', loadComponent: () => import('./administracion/pages/despacho-productos/pages/agregar-despacho/agregar-despacho').then(m => m.AgregarDespacho) },
          { path: 'detalle-despacho/:id', loadComponent: () => import('./administracion/pages/despacho-productos/pages/detalles-despacho/detalles-despacho').then(m => m.DetallesDespacho) },
          { path: 'editar-despacho/:id', loadComponent: () => import('./administracion/pages/despacho-productos/pages/editar-despacho/editar-despacho').then(m => m.EditarDespacho) },
        ]
      },
      {
        path: 'admin/usuarios',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/usuarios/pages/administracion-crear-usuario/administracion-crear-usuario').then(m => m.AdministracionCrearUsuario) },
          { path: 'crear-usuario', loadComponent: () => import('./administracion/pages/usuarios/pages/administracion/administracion').then(m => m.Administracion) },
          { path: 'editar-usuario/:id', loadComponent: () => import('./administracion/pages/usuarios/pages/administracion-editar-usuario/administracion-editar-usuario').then(m => m.AdministracionEditarUsuario) },
        ]
      },
      {
        path: 'admin/roles-permisos',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/roles-permisos/pages/roles-permisos-listado/role-permission-listado.component').then(m => m.RolePermissionListadoComponent) },
          { path: 'roles', loadComponent: () => import('./administracion/pages/roles-permisos/roles/pages/roles-listado/roles-listado.component').then(m => m.RolesListadoComponent) },
          { path: 'agregar-rol', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/roles/pages/agregar-rol/agregar-rol.component').then(m => m.AgregarRolComponent) },
          { path: 'editar-rol/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/roles/pages/editar-role/editar-rol.component').then(m => m.EditarRolComponent) },
          { path: 'permisos', loadComponent: () => import('./administracion/pages/roles-permisos/permisos/pages/permisos-listado/permisos-listado.component').then(m => m.PermisosListadoComponent) },
          { path: 'agregar-permiso', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/permisos/pages/agregar-permiso/agregar-permiso.component').then(m => m.AgregarPermisoComponent) },
          { path: 'editar-permiso/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/permisos/pages/editar-permiso/editar-permiso.component').then(m => m.EditarPermisoComponent) },
          { path: 'agregar-roles-permisos', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/pages/agregar-roles-permisos/agregar-roles-permisos.component').then(m => m.AgregarRolesPermisosComponent) },
          { path: 'editar-roles-permisos/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/roles-permisos/pages/editar-roles-permisos/editar-rol.component').then(m => m.EditarRolComponent) },
        ]
      },
      {
        path: 'admin/gestion-productos',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/gestion-productos/productos-listado/gestion-listado').then(m => m.GestionListado) },
          { path: 'crear-producto', loadComponent: () => import('./administracion/pages/gestion-productos/productos-formulario/productos-formulario').then(m => m.ProductosFormulario) },
          { path: 'editar-producto/:id', loadComponent: () => import('./administracion/pages/gestion-productos/productos-formulario/productos-formulario').then(m => m.ProductosFormulario) },
          { path: 'ver-detalle-producto/:id', loadComponent: () => import('./administracion/pages/gestion-productos/productos-detalles/productos-detalles').then(m => m.ProductosDetalles) },
        ]
      },
      {
        path: 'admin/categoria',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/categoria/pages/categoria/categoria').then(m => m.CategoriaListado) },
          { path: 'agregar-categoria', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/categoria/pages/agregar-categoria/agregar-categoria').then(m => m.AgregarCategoria) },
          { path: 'editar-categoria/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/categoria/pages/editar-categoria/editar-categoria').then(m => m.EditarCategoria) },
        ]
      },
      {
        path: 'admin/sedes',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/sedes/pages/sedes/sedes').then(m => m.Sedes) },
          { path: 'agregar-sede', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/sedes/pages/agregar-sede/agregar-sede').then(m => m.AgregarSede) },
          { path: 'editar-sede', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./administracion/pages/sedes/pages/editar-sede/editar-sede').then(m => m.EditarSede) },
        ]
      },
      {
        path: 'admin/comision',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/comision/comision').then(m => m.Comision) },
          { path: 'regla', loadComponent: () => import('./administracion/pages/comision/comision-regla/comisionregla').then(m => m.ComisionRegla) },
          { path: 'reportes', loadComponent: () => import('./administracion/pages/comision/comision-reportes/comisionreportes').then(m => m.ComisionReportes) },
        ]
      },
      {
        path: 'admin/mermas',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/mermas/pages/mermas-pr/mermas-pr').then(m => m.MermasPr) },
          { path: 'registro-merma', loadComponent: () => import('./administracion/pages/mermas/pages/mermas-registro/mermas-registro').then(m => m.MermasRegistro) },
          { path: 'edicion-merma-remate', loadComponent: () => import('./administracion/pages/mermas-remates/pages/mermas-remates-edc/mermas-remates-edc').then(m => m.MermasRematesEdcComponent) },
        ]
      },
      {
        path: 'admin/proveedores',
        children: [
          { path: '', loadComponent: () => import('./administracion/pages/gestion-proveedor/proveedor-listado/proveedor-listado').then(m => m.ProveedorListado) },
          { path: 'crear', loadComponent: () => import('./administracion/pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then(m => m.ProveedorFormulario) },
          { path: 'editar/:id', loadComponent: () => import('./administracion/pages/gestion-proveedor/proveedor-formulario/proveedor-formulario').then(m => m.ProveedorFormulario) },
          { path: 'ver-detalle/:id', loadComponent: () => import('./administracion/pages/gestion-proveedor/proveedor-detalles/proveedor-detalles').then(m => m.ProveedorDetalles) },
        ]
      },
      {
        path: 'admin/notificaciones',
        loadComponent: () => import('./administracion/pages/notificacion-admin/notificacion-admin').then(m => m.NotificacionAdmin),
      },

      // ================= NOT FOUND =================
      { path: '**', component: NotFoundComponent },
    ]
  },

  { path: '**', component: Login },
];