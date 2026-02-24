import { Routes } from '@angular/router';
export const LOGISTICA_ROUTES:Routes = [
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard-logistica/dashboard-logistica').then((m)=> m.DashboardLogistica)
    },
    {
        path:'conteo-inventario',
        loadComponent: () => import('./pages/conteo-inventario/conteo-inventario').then((m)=>m.ConteoInventario)
    },
    {
        path:'remision', loadComponent: () => import('./pages/remision/remision').then((m)=> m.Remision)
    },
    {
        path:'conteo-crear', loadComponent: () => import('./pages/conteo-inventario-crear/conteo-inventario-crear').then((m)=>m.ConteoInventarioCrear)
    },
]
