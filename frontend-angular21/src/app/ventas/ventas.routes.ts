import { Routes } from '@angular/router';
import { CashboxGuard } from './guards/cashbox.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'caja',
    pathMatch: 'full',
  },
  {
    path: 'dashboard-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/dashboard-ventas/dashboard-ventas').then((m) => m.DashboardVentas),
  },
  {
    path: 'generar-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/generar-venta/generar-venta').then((m) => m.GenerarVenta),
  },
  {
    path: 'historial-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/historial-ventas/historial-ventas').then((m) => m.HistorialVentas),
  },
  {
    path: 'imprimir-comprobante',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./shared/imprimir-comprobante/imprimir-comprobante').then(
        (m) => m.ImprimirComprobante,
      ),
  },
  {
    path: 'ver-detalle/:id',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./shared/detalles-venta/detalle-venta').then((m) => m.DetalleVenta),
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



  {
    path: 'reporte-ventas',
    canActivate: [CashboxGuard],
    loadComponent: () => import('./pages/dashboard-ventas/dashboard-ventas').then((m) => m.DashboardVentas)
  },

  // ─── COTIZACIONES ───────────────────────────────────────────
  {
    path: 'cotizaciones',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/cotizaciones/listado-cotizacion/listado-cotizacion')
        .then((m) => m.ListadoCotizacion),
  },
  {
    path: 'cotizaciones/crear',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/cotizaciones/formulario-cotizacion/formulario-cotizacion')
        .then((m) => m.FormularioCotizacion),
  },
  {
    path: 'cotizaciones/editar/:id',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/cotizaciones/formulario-cotizacion/formulario-cotizacion')
        .then((m) => m.FormularioCotizacion),
  },
  {
    path: 'cotizaciones/detalle/:id',
    canActivate: [CashboxGuard],
    loadComponent: () =>
      import('./pages/cotizaciones/detalle-cotizacion/detalle-cotizacion')
        .then((m) => m.DetalleCotizacion),
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
