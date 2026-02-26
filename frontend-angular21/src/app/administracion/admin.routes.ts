import { Routes } from '@angular/router';
import { pendingChangesGuard } from '../core/guards/pending-changes.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./pages/reportes/pages/notificacion-transferencia/notificacion-transferencia').then((m) => m.NotificacionTransferencia),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },

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
          import('./pages/usuarios/pages/administracion/administracion').then(
            (m) => m.Administracion,
          ),
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
  {
    path: 'transferencia',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/reportes/pages/transferencia/transferencia').then(
            (m) => m.Transferencia,
          ),
      },
      {
        path: 'nueva-transferencia',
        loadComponent: () =>
          import('./pages/reportes/pages/nueva-transferencia/nueva-transferencia').then(
            (m) => m.NuevaTransferencia,
          ),
      },
      {
        path: 'detalle-transferencia',
        loadComponent: () =>
          import('./pages/reportes/pages/detalle-transferencia/detalle-transferencia').then(
            (m) => m.DetalleTransferencia,
          ),
      },
      {
        path: 'notificacion',
        loadComponent: () =>
          import('./pages/reportes/pages/notificacion-transferencia/notificacion-transferencia').then(
            (m) => m.NotificacionTransferencia,
          ),
      },
    ],
  },

  {
    path: 'gestion-productos',
    loadComponent: () =>
      import('./pages/gestion-productos/productos-listado/gestion-listado').then(
        (m) => m.GestionListado,
      ),
    children: [
      {
        path: '',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'ver-detalle-producto/:id',
        loadComponent: () =>
          import('./pages/gestion-productos/productos-detalles/productos-detalles').then(
            (m) => m.ProductosDetalles,
          ),
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
    ],
  },
  
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
          import('./pages/sedes/pages/agregar-sede/agregar-sede').then(
            (m) => m.AgregarSede,
          ),
        canDeactivate: [pendingChangesGuard],
      },
      {
        path: 'editar-sede',
        loadComponent: () =>
          import('./pages/sedes/pages/editar-sede/editar-sede').then(
            (m) => m.EditarSede,
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
          import('./pages/clientes/pages/clientes/clientes').then(
            (m) => m.Clientes,
          ),
      },
      {
        path: 'agregar-cliente',
        loadComponent: () =>
          import('./pages/clientes/pages/agregar-cliente/agregar-cliente').then(
            (m) => m.AgregarCliente,
          ),
      },
      {
        path: 'editar-cliente',
        loadComponent: () =>
          import('./pages/clientes/pages/editar-cliente/editar-cliente').then(
            (m) => m.EditarCliente,
          ),
      },
    ],
  },

  /* =======================
     INGRESOS ALMACÉN
  ======================= */
  {
    path: 'ingresos-almacen',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/ingresos-almacen/pages/ingresos-almacen/ingresos-almacen').then(
            (m) => m.IngresosAlmacen,
          ),
      },
      {
        path: 'ingresos-agregar',
        loadComponent: () =>
          import('./pages/ingresos-almacen/pages/ingresos-agregar/ingresos-agregar').then(
            (m) => m.IngresosAgregar,
          ),
      },
    ],
  },

  /* =======================
     VENTAS ADMINISTRACIÓN
  ======================= */
  {
    path: 'generar-ventas-administracion',
    loadComponent: () =>
      import('./pages/generar-ventas-administracion/generar-ventas-administracion').then(
        (m) => m.GenerarVentasAdministracion,
      ),
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
  {
    path: 'imprimir-comprobante-administracion',
    loadComponent: () =>
      import('./shared/imprimir-comprobante-administracion/imprimir-comprobante-administracion').then(
        (m) => m.ImprimirComprobanteAdministracion,
      ),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },

  /* =======================
    COMISIONES
  ======================= */
  {
    path: 'comision',
    loadComponent: () =>
      import('./pages/comision/comision')
    .then( (m) => m.Comision
  ),

  },



  {
    path: 'comision-regla',
    loadComponent: () =>
      import('./pages/comision-regla/comisionregla')
        .then( (m) => m.ComisionRegla),
  },


  {
    path: 'comision-reportes',
    loadComponent: () =>
      import('./pages/comision-reportes/comisionreportes')
        .then( (m) => m.ComisionReportes),
  },



  /* =======================
     MERMAS / REMATES
  ======================= */
  {
    path: 'mermas-remates',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/mermas-remates/pages/mermas-remates-pr/mermas-remates-pr').then(
            (m) => m.MermasRematesPr,
          ),
      },
      {
        path: 'registro-merma-remate',
        loadComponent: () =>
          import('./pages/mermas-remates/pages/mermas-remates-registro/mermas-remates-registro').then(
            (m) => m.MermasRematesRegistro,
          ),
      },
    ],
  },
  /* =======================
     DESPACHO PRODUCTOS
  ======================= */
  {
    path: 'despacho-productos',
    loadComponent: () =>
      import('./pages/despacho-productos/pages/listado-despacho/listado-despacho').then(
        (m) => m.ListadoDespacho,
      ),
  },
  {
    path: 'despacho-productos/detalle-despacho/:id',
    loadComponent: () =>
      import('./pages/despacho-productos/pages/detalles-despacho/detalles-despacho').then(
        (m) => m.DetallesDespacho,
      ),
  },
];
