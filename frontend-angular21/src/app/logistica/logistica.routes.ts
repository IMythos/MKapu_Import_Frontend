import { Routes } from '@angular/router';
export const LOGISTICA_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard-logistica/dashboard-logistica').then((m) => m.DashboardLogistica),
  },
  {
    path: 'conteo-inventario',
    loadComponent: () =>
      import('./pages/conteo-inventario/conteoinventario').then((m) => m.ConteoInventarios),
  },

  {
    path: 'conteo-crear',
    loadComponent: () => import('./pages/conteo-crear/conteocrear').then((m) => m.ConteoCrear),
  },
  {
    path: 'conteo-detalle/:id',
    loadComponent: () =>
      import('./pages/conteo-detalle/conteodetalle').then((m) => m.ConteoDetalle),
  },
  {
    path: 'remision',
    loadComponent: () => import('./pages/remision/remision').then((m) => m.Remision),
  },
  {
    path: 'conteo-crear',
    loadComponent: () =>
      import('./pages/conteo-inventario-crear/conteo-inventario-crear').then(
        (m) => m.ConteoInventarioCrear,
      ),
  },
  {
    path: 'remision/detalle/:id',
    loadComponent: () =>
      import('./pages/remision/detalle-remision/detalle-remision').then((m) => m.DetalleRemision),
  },
];
