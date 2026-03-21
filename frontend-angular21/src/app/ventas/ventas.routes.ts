import { Routes } from '@angular/router';
import { CashboxGuard } from './guards/cashbox.guard';
import { roleGuard } from '../core/guards/role.guard';

const loadMovimientosInventario = () =>
  import('../logistica/pages/movimientos-inventario/movimientos-inventario').then(
    (m) => m.MovimientosInventario,
  );

const loadDetalleMovimientoInventario = () =>
  import('../logistica/pages/movimientos-inventario-detalle/movimientos-inventario-detalle').then(
    (m) => m.DetalleMovimientoInventario,
  );

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'caja',
    pathMatch: 'full',
  },
  {
    path: 'dashboard-ventas',
    loadComponent: () =>
      import('../administracion/pages/dashboard-admin/dashboard-admin').then(
        (m) => m.DashboardAdmin,
      ),
    canActivate: [roleGuard],
    data: { permiso: 'VER_DASHBOARD_VENTAS' },
  },
  {
    path: 'caja',
    loadComponent: () => import('./pages/caja/caja.page').then((m) => m.CajaPage),
    canActivate: [roleGuard],
    data: { permiso: 'VER_CAJA' },
  },
  {
    path: 'generar-ventas',
    canActivate: [roleGuard, CashboxGuard],
    loadComponent: () =>
      import('../administracion/pages/generar-ventas-administracion/generar-ventas-administracion').then(
        (m) => m.GenerarVentasAdministracion,
      ),
    data: { permiso: 'CREAR_VENTA' },
  },
  {
    path: 'historial-ventas',
    canActivate: [roleGuard, CashboxGuard],
    loadComponent: () =>
      import('../administracion/pages/historial-ventas-administracion/historial-ventas-administracion').then(
        (m) => m.HistorialVentasAdministracion,
      ),
    data: { permiso: 'VER_VENTAS' },
  },
  {
    path: 'nota-credito',
    canActivate: [roleGuard],
    loadComponent: () =>
      import('../administracion/pages/nota-credito/nota-credito').then(
        (m) => m.NotasCreditoComponent
      ),
    data: { permiso: 'VER_NOTAS_CREDITO' },
  },
  {
    path: 'ver-detalle/:id',
    canActivate: [roleGuard, CashboxGuard],
    loadComponent: () =>
      import('../administracion/shared/detalles-ventas-administracion/detalles-ventas-administracion').then(
        (m) => m.DetallesVentasAdministracion,
      ),
    data: { permiso: 'VER_VENTAS' },
  },

  {
    path: 'ventas-por-cobrar',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_VENTA_POR_COBRAR' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../administracion/pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado').then(
            (m) => m.VentasPorCobrarListadoComponent,
          ),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('../administracion/pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario').then(
            (m) => m.VentasPorCobrarFormulario,
          ),
      },
      {
        path: 'detalles/:id',
        loadComponent: () =>
          import('../administracion/pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario').then(
            (m) => m.DetalleVentaPorCobrar,
          ),
      },
      {
        path: 'pagar/:id',
        loadComponent: () =>
          import('../administracion/pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component').then(
            (m) => m.VentasPorCobrarPagoComponent,
          ),
      },
    ],
  },

  {
    path: 'reclamos-listado',
    canActivate: [roleGuard, CashboxGuard],
    data: { permiso: 'CREAR_RECLAMO' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/reclamos-garantia/reclamos-listado/reclamos-listado').then(
            (m) => m.ReclamosListado,
          ),
      },
      {
        path: 'crear',
        loadComponent: () =>
          import('./pages/reclamos-garantia/reclamos-crear/reclamos-crear').then(
            (m) => m.ReclamosCrear,
          ),
      },
      {
        path: 'editar/:id',
        loadComponent: () =>
          import('./pages/reclamos-garantia/reclamos-editar/reclamos-editar').then(
            (m) => m.ReclamosEditar,
          ),
      },
      {
        path: 'detalle/:id',
        loadComponent: () =>
          import('./pages/reclamos-garantia/reclamos-detalles/reclamos-detalles').then(
            (m) => m.ReclamosDetalles,
          ),
      },
    ],
  },

  {
    path: 'cotizaciones-venta',
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_COTIZACIONES' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion-venta/gestion-listado/gestion-listado').then(
            (m) => m.GestionCotizacionesComponent,
          ),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion-venta/gestion-formulario/cotizacion-formulario').then(
            (m) => m.CotizacionFormulario,
          ),
      },
      {
        path: 'ver-detalle/:id',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion-venta/detalle-gestion-formulario/detalle-cotizacion-formulario').then(
            (m) => m.DetalleCotizacionComponent,
          ),
      },
    ],
  },
  { path: 'agregar-cotizaciones', redirectTo: 'cotizaciones/agregar', pathMatch: 'full' },
  {
    path: 'ver-detalle-cotizacion/:id',
    redirectTo: 'cotizaciones/ver-detalle/:id',
    pathMatch: 'full',
  },

  {
    path: 'movimiento-inventario/detalle/:id',
    loadComponent: loadDetalleMovimientoInventario,
    canActivate: [roleGuard],
    data: { permiso: 'VER_MOVIMIENTOS' },
  },
  {
    path: 'movimientos-inventario/detalle/:id',
    loadComponent: loadDetalleMovimientoInventario,
    canActivate: [roleGuard],
    data: { permiso: 'VER_MOVIMIENTOS' },
  },
  {
    path: 'movimiento-inventario',
    loadComponent: loadMovimientosInventario,
    canActivate: [roleGuard],
    data: { permiso: 'VER_MOVIMIENTOS' },
  },
  {
    path: 'movimientos-inventario',
    loadComponent: loadMovimientosInventario,
    canActivate: [roleGuard],
    data: { permiso: 'VER_MOVIMIENTOS' },
  },


  {
    path: 'promociones',
    loadComponent: () => import('./pages/promociones/promociones').then((m) => m.Promociones),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_PROMOCION' },
  },

  {
    path: 'remates',
    canActivate: [roleGuard, CashboxGuard],
    data: { permiso: 'CREAR_REMATES' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../administracion/pages/remates/pages/remates-pr/remates-pr').then(
            (m) => m.RematesPr,
          ),
      },
      {
        path: 'registro-remate',
        loadComponent: () =>
          import('../administracion/pages/remates/pages/remates-registro/remates-registro').then(
            (m) => m.RematesRegistro,
          ),
      },
    ],
  },

  {
    path: 'conteo-inventario',
    canActivate: [roleGuard, CashboxGuard],
    data: { permiso: 'CONTEO_INVENTARIO' },
    loadComponent: () =>
      import('../logistica/pages/conteo-inventario/conteoinventario').then(
        (m) => m.ConteoInventarios,
      ),
  },
  {
    path: 'conteo-crear',
    canActivate: [roleGuard, CashboxGuard],
    data: { permiso: 'CONTEO_INVENTARIO' },
    loadComponent: () =>
      import('../logistica/pages/conteo-crear/conteocrear').then((m) => m.ConteoCrear),
  },
  {
    path: 'conteo-detalle',
    canActivate: [roleGuard, CashboxGuard],
    data: { permiso: 'CONTEO_INVENTARIO' },
    loadComponent: () =>
      import('../logistica/pages/conteo-detalle/conteodetalle').then((m) => m.ConteoDetalle),
  },
];
