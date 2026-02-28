import { Routes } from '@angular/router';

export const ALMACEN_ROUTES: Routes = [
  {
    path: 'dashboard-almacen',
    loadComponent: () => 
      import('./pages/dashboard-almacen/dashboard-almacen').then((m) => m.DashboardAlmacen),
  },
  {
    path: 'dashboard',
    loadComponent: () => 
      import('./pages/dashboard-almacen/dashboard-almacen').then((m) => m.DashboardAlmacen),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
