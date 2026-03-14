import { Routes } from '@angular/router';
import { Login } from './auth/pages/login/login';
import { Main } from './layout/main/main';
import { authGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: '',
    component: Main,
    canActivate: [authGuard],
    children: [
      {
        path: 'admin',
        loadChildren: () => import('./administracion/admin.routes').then((m) => m.ADMIN_ROUTES),
      },

      {
        path: 'logistica',
        loadChildren: () => import('./logistica/logistica.routes').then((m) => m.LOGISTICA_ROUTES),
      },

      {
        path: 'ventas',
        loadChildren: () => import('./ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
      },

      { path: '**', component: NotFoundComponent },
    ],
  },
  
  { path: '**', component: Login },
];
