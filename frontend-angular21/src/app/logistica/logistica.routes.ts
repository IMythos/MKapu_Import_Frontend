import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/role.guard'; 

const loadMovimientosInventario = () =>
  import('./pages/movimientos-inventario/movimientos-inventario').then((m) => m.MovimientosInventario);

const loadDetalleMovimientoInventario = () =>
  import('./pages/movimientos-inventario-detalle/movimientos-inventario-detalle').then(
    (m) => m.DetalleMovimientoInventario,
  );

export const LOGISTICA_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard-logistica/dashboard-logistica').then((m) => m.DashboardLogistica),
    canActivate: [roleGuard],
    data: { permiso: 'VER_DASHBOARD_ALMACEN' } 
  },

  {
    path: 'conteo-inventario',
    loadComponent: () => import('./pages/conteo-inventario/conteoinventario').then((m) => m.ConteoInventarios),
    canActivate: [roleGuard],
    data: { permiso: 'CONTEO_INVENTARIO' }
  },
  {
    path: 'conteo-crear',
    loadComponent: () => import('./pages/conteo-crear/conteocrear').then((m) => m.ConteoCrear),
    canActivate: [roleGuard],
    data: { permiso: 'CONTEO_INVENTARIO' }
  },
  {
    path: 'conteo-detalle/:id',
    loadComponent: () => import('./pages/conteo-detalle/conteodetalle').then((m) => m.ConteoDetalle),
    canActivate: [roleGuard],
    data: { permiso: 'CONTEO_INVENTARIO' }
  },

  {
    path: 'remision',
    loadComponent: () => import('./pages/remision/remision').then((m) => m.Remision),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_REMISION' }
  },
  {
    path: 'remision/nueva',
    loadComponent: () => import('./pages/remision/nueva-remision/nueva-remision').then((m) => m.NuevaRemision),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_REMISION' }
  },
  {
    path: 'remision/detalle/:id',
    loadComponent: () => import('./pages/remision/detalle-remision/detalle-remision').then((m) => m.DetalleRemision),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_REMISION' }
  },

  {
    path: 'movimiento-inventario/detalle/:id',
    loadComponent: loadDetalleMovimientoInventario,
    canActivate: [roleGuard],
    data: { permiso: ['CREAR_MOV_INVENTARIO', 'VER_MOVIMIENTOS'] },
  },
  {
    path: 'movimientos-inventario/detalle/:id',
    loadComponent: loadDetalleMovimientoInventario,
    canActivate: [roleGuard],
    data: { permiso: ['CREAR_MOV_INVENTARIO', 'VER_MOVIMIENTOS'] },
  },
  {
    path: 'movimiento-inventario',
    loadComponent: loadMovimientosInventario,
    canActivate: [roleGuard],
    data: { permiso: ['CREAR_MOV_INVENTARIO', 'VER_MOVIMIENTOS'] },
  },
  {
    path: 'movimientos-inventario',
    loadComponent: loadMovimientosInventario,
    canActivate: [roleGuard],
    data: { permiso: ['CREAR_MOV_INVENTARIO', 'VER_MOVIMIENTOS'] },
  },

  {
    path: 'ajuste-inventario',
    loadComponent: () => import('./pages/ajuste-inventario/ajuste-inventario').then(m => m.AjusteInventario),
    canActivate: [roleGuard],
    data: { permiso: 'CREAR_AJUSTE_INVENTARIO' }
  }
];
