import { Routes } from '@angular/router';
import { CashboxGuard } from './guards/cashbox.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'caja',
    pathMatch: 'full',
  },

  {
    path: 'generar-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../administracion/pages/generar-ventas-administracion/generar-ventas-administracion').then((m) => m.GenerarVentasAdministracion),
  },
  {
    path: 'historial-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../administracion/pages/historial-ventas-administracion/historial-ventas-administracion').then((m) => m.HistorialVentasAdministracion),
  },
  {
    path: 'ver-detalle/:id',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../administracion/shared/detalles-ventas-administracion/detalles-ventas-administracion').then((m) => m.DetallesVentasAdministracion),
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
    canActivate: [CashboxGuard],
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



  /* =======================
      COTIZACIONES
  ======================= */
  {
    path: 'cotizaciones',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion/gestion-listado/gestion-listado').then(
            (m) => m.GestionCotizacionesComponent,
          ),
      },
      {
        path: 'agregar',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion/gestion-formulario/cotizacion-formulario').then(
            (m) => m.CotizacionFormulario,
          ),
      },
      {
        path: 'ver-detalle/:id',
        loadComponent: () =>
          import('../administracion/pages/gestion-cotizacion/detalle-gestion-formulario/detalle-cotizacion-formulario').then(
            (m) => m.DetalleCotizacionComponent,
          ),
      },
    ],
  },
  { path: 'agregar-cotizaciones',        redirectTo: 'cotizaciones/agregar',        pathMatch: 'full' },
  { path: 'ver-detalle-cotizacion/:id',  redirectTo: 'cotizaciones/ver-detalle/:id', pathMatch: 'full' },

  
  {
    path: 'movimiento-inventario',
    loadComponent: () => import('../logistica/pages/movimientos-inventario/movimientos-inventario').then((m) => m.MovimientosInventario)
  },
  {
    path: 'movimientos-inventario/detalle/:id',
    loadComponent: () => import('../logistica/pages/movimientos-inventario-detalle/movimientos-inventario-detalle').then(m => m.DetalleMovimientoInventario)
  },

  {
    path: 'promociones',
    loadComponent: () =>
      import('./pages/promociones/promociones').then((m) => m.Promociones),
  },


  {
    path: 'caja',
    loadComponent: () => import('./pages/caja/caja.page').then((m) => m.CajaPage),
  },



  {
    path: 'remates',
    canActivate: [CashboxGuard],
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



  /* =======================
  GESTIÓN DE Conteos
======================= */
  {
    path: 'conteo-inventario',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../logistica/pages/conteo-inventario/conteoinventario')
        .then((m) => m.ConteoInventarios),
  },

  {
    path: 'conteo-crear',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../logistica/pages/conteo-crear/conteocrear')
        .then((m) => m.ConteoCrear),
  },
  {
    path: 'conteo-detalle',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('../logistica/pages/conteo-detalle/conteodetalle')
        .then((m) => m.ConteoDetalle),
  },







];
