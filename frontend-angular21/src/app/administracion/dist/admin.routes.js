"use strict";
exports.__esModule = true;
exports.ADMIN_ROUTES = void 0;
var pending_changes_guard_1 = require("../core/guards/pending-changes.guard");
exports.ADMIN_ROUTES = [
    {
        path: 'notificaciones',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/notificacion-transferencia/notificacion-transferencia'); }).then(function (m) { return m.NotificacionTransferencia; });
        }
    },
    {
        path: 'dashboard-admin',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/dashboard-admin/dashboard-admin'); }).then(function (m) { return m.DashboardAdmin; });
        }
    },
    {
        path: 'dashboard-almacen',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../almacen/pages/dashboard-almacen/dashboard-almacen'); }).then(function (m) { return m.DashboardAlmacen; });
        }
    },
    {
        path: 'dashboard-ventas',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../ventas/pages/dashboard-ventas/dashboard-ventas'); }).then(function (m) { return m.DashboardVentas; });
        }
    },
    /* =======================
        USUARIOS
      ======================= */
    {
        path: 'usuarios',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/usuarios/pages/administracion-crear-usuario/administracion-crear-usuario'); }).then(function (m) { return m.AdministracionCrearUsuario; });
                }
            },
            {
                path: 'crear-usuario',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/usuarios/pages/administracion/administracion'); }).then(function (m) { return m.Administracion; });
                }
            },
            {
                path: 'editar-usuario/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/usuarios/pages/administracion-editar-usuario/administracion-editar-usuario'); }).then(function (m) { return m.AdministracionEditarUsuario; });
                }
            },
        ]
    },
    /* =======================
        Almacen
      ======================= */
    {
        path: 'almacen',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/almacen/pages/listar-almacen/almacen'); }).then(function (m) { return m.AlmacenListado; });
                }
            },
            {
                path: 'crear-almacen',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/almacen/pages/agregar-almacen/agregar-almacen'); }).then(function (m) { return m.AlmacenCrear; });
                }
            },
            {
                path: 'editar-almacen/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/almacen/pages/editar-almacen/editar-almacen'); }).then(function (m) { return m.AlmacenEditar; });
                }
            },
        ]
    },
    /* =======================
      TRANSFERENCIAS
    ======================= */
    {
        path: 'transferencia',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/transferencia/transferencia'); }).then(function (m) { return m.Transferencia; });
        }
    },
    {
        path: 'transferencia/nueva-transferencia',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/nueva-transferencia/nueva-transferencia'); }).then(function (m) { return m.NuevaTransferencia; });
        }
    },
    {
        path: 'transferencia/solicitud-transferencia/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/detalle-transferencia/detalle-transferencia'); }).then(function (m) { return m.DetalleTransferencia; });
        }
    },
    {
        path: 'transferencia/notificacion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/notificacion-transferencia/notificacion-transferencia'); }).then(function (m) { return m.NotificacionTransferencia; });
        }
    },
    {
        path: 'transferencias',
        redirectTo: 'transferencia',
        pathMatch: 'full'
    },
    {
        path: 'transferencias/nueva-transferencia',
        redirectTo: 'transferencia/nueva-transferencia',
        pathMatch: 'full'
    },
    {
        path: 'transferencias/solicitud-transferencia/:id',
        redirectTo: 'transferencia/solicitud-transferencia/:id',
        pathMatch: 'full'
    },
    {
        path: 'transferencias/notificacion',
        redirectTo: 'transferencia/notificacion',
        pathMatch: 'full'
    },
    /* =======================
      GESTIÓN DE PRODUCTOS
    ======================= */
    {
        path: 'gestion-productos',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-productos/productos-listado/gestion-listado'); }).then(function (m) { return m.GestionListado; });
        }
    },
    {
        path: 'gestion-productos/crear-producto',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-productos/productos-formulario/productos-formulario'); }).then(function (m) { return m.ProductosFormulario; });
        }
    },
    {
        path: 'gestion-productos/editar-producto/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-productos/productos-formulario/productos-formulario'); }).then(function (m) { return m.ProductosFormulario; });
        }
    },
    {
        path: 'gestion-productos/ver-detalle-producto/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-productos/productos-detalles/productos-detalles'); }).then(function (m) { return m.ProductosDetalles; });
        }
    },
    /* =======================
        SEDES
      ======================= */
    {
        path: 'sedes',
        children: [
            {
                path: '',
                loadComponent: function () { return Promise.resolve().then(function () { return require('./pages/sedes/pages/sedes/sedes'); }).then(function (m) { return m.Sedes; }); }
            },
            {
                path: 'agregar-sede',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/sedes/pages/agregar-sede/agregar-sede'); }).then(function (m) { return m.AgregarSede; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-sede',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/sedes/pages/editar-sede/editar-sede'); }).then(function (m) { return m.EditarSede; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
        ]
    },
    /* =======================
          categorias
      ======================= */
    {
        path: 'categoria',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/categoria/pages/categoria/categoria'); }).then(function (m) { return m.CategoriaListado; });
                }
            },
            {
                path: 'agregar-categoria',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/categoria/pages/agregar-categoria/agregar-categoria'); }).then(function (m) { return m.AgregarCategoria; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-categoria/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/categoria/pages/editar-categoria/editar-categoria'); }).then(function (m) { return m.EditarCategoria; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
        ]
    },
    /* =======================
        CLIENTES
      ======================= */
    {
        path: 'clientes',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/clientes/pages/clientes/clientes'); }).then(function (m) { return m.Clientes; });
                }
            },
            {
                path: 'agregar-cliente',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/clientes/pages/agregar-cliente/agregar-cliente'); }).then(function (m) { return m.AgregarCliente; });
                }
            },
            {
                path: 'editar-cliente/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/clientes/pages/editar-cliente/editar-cliente'); }).then(function (m) { return m.EditarCliente; });
                }
            },
        ]
    },
    /* =======================
        INGRESOS ALMACÉN
      ======================= */
    {
        path: 'ingresos-almacen',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/ingresos-almacen/pages/ingresos-almacen/ingresos-almacen'); }).then(function (m) { return m.IngresosAlmacen; });
                }
            },
            {
                path: 'ingresos-agregar',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/ingresos-almacen/pages/ingresos-agregar/ingresos-agregar'); }).then(function (m) { return m.IngresosAgregar; });
                }
            },
        ]
    },
    /* =======================
      VENTAS ADMINISTRACIÓN
    ======================= */
    {
        path: 'generar-ventas-administracion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../ventas/pages/generar-venta/generar-venta'); }).then(function (m) { return m.GenerarVenta; });
        }
    },
    {
        path: 'historial-ventas-administracion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../ventas/pages/historial-ventas/historial-ventas'); }).then(function (m) { return m.HistorialVentas; });
        }
    },
    {
        path: 'detalles-ventas-administracion/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./shared/detalles-ventas-administracion/detalles-ventas-administracion'); }).then(function (m) { return m.DetallesVentasAdministracion; });
        }
    },
    {
        path: 'imprimir-comprobante-administracion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./shared/imprimir-comprobante-administracion/imprimir-comprobante-administracion'); }).then(function (m) { return m.ImprimirComprobanteAdministracion; });
        }
    },
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    /* =======================
      COMISIONES
    ======================= */
    {
        path: 'comision',
        loadComponent: function () { return Promise.resolve().then(function () { return require('./pages/comision/comision'); }).then(function (m) { return m.Comision; }); }
    },
    {
        path: 'comision-regla',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/comision-regla/comisionregla'); }).then(function (m) { return m.ComisionRegla; });
        }
    },
    {
        path: 'comision-reportes',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/comision-reportes/comisionreportes'); }).then(function (m) { return m.ComisionReportes; });
        }
    },
    /* =======================
    GESTIÓN DE Conteos
  ======================= */
    {
        path: 'conteo-inventario',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/conteo-inventario/conteoinventario'); }).then(function (m) { return m.ConteoInventarios; });
        }
    },
    {
        path: 'conteo-crear',
        loadComponent: function () { return Promise.resolve().then(function () { return require('./pages/conteo-crear/conteocrear'); }).then(function (m) { return m.ConteoCrear; }); }
    },
    {
        path: 'conteo-detalle',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/conteo-detalle/conteodetalle'); }).then(function (m) { return m.ConteoDetalle; });
        }
    },
    /* =======================
      MERMAS
    ======================= */
    {
        path: 'mermas',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/mermas/pages/mermas-pr/mermas-pr'); }).then(function (m) { return m.MermasPr; });
                }
            },
            {
                path: 'registro-merma',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/mermas/pages/mermas-registro/mermas-registro'); }).then(function (m) { return m.MermasRegistro; });
                }
            },
            {
                path: 'edicion-merma-remate',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/mermas-remates/pages/mermas-remates-edc/mermas-remates-edc'); }).then(function (m) { return m.MermasRematesEdcComponent; });
                }
            },
        ]
    },
    /* =======================
      REMATES
    ======================= */
    {
        path: 'remates',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/remates/pages/remates-pr/remates-pr'); }).then(function (m) { return m.RematesPr; });
                }
            },
            {
                path: 'registro-remate',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/remates/pages/remates-registro/remates-registro'); }).then(function (m) { return m.RematesRegistro; });
                }
            },
        ]
    },
    /* =======================
      DESPACHO PRODUCTOS
    ======================= */
    {
        path: 'despacho-productos',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/despacho-productos/pages/listado-despacho/listado-despacho'); }).then(function (m) { return m.ListadoDespacho; });
        }
    },
    {
        path: 'despacho-productos/detalle-despacho/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/despacho-productos/pages/detalles-despacho/detalles-despacho'); }).then(function (m) { return m.DetallesDespacho; });
        }
    },
    {
        path: 'despacho-productos/agregar-despacho/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/despacho-productos/pages/agregar-despacho/agregar-despacho'); }).then(function (m) { return m.AgregarDespacho; });
        }
    },
    {
        path: 'despacho-productos/editar-despacho/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/despacho-productos/pages/editar-despacho/editar-despacho'); }).then(function (m) { return m.EditarDespacho; });
        }
    },
    {
        path: 'proveedores',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-proveedor/proveedor-listado/proveedor-listado'); }).then(function (m) { return m.ProveedorListado; });
        },
        children: [
            {
                path: 'crear',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario'); }).then(function (m) { return m.ProveedorFormulario; });
                }
            },
            {
                path: 'editar/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-proveedor/proveedor-formulario/proveedor-formulario'); }).then(function (m) { return m.ProveedorFormulario; });
                }
            },
            {
                path: 'ver-detalle/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-proveedor/proveedor-detalles/proveedor-detalles'); }).then(function (m) { return m.ProveedorDetalles; });
                }
            },
        ]
    },
    {
        path: 'promociones',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-promociones/promociones-listado/promociones-listado'); }).then(function (m) { return m.PromocionesListado; });
                }
            },
            {
                path: 'crear',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-promociones/promociones-formulario/promociones-formulario'); }).then(function (m) { return m.PromocionesFormulario; });
                }
            },
            {
                path: 'editar/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-promociones/promociones-formulario/promociones-formulario'); }).then(function (m) { return m.PromocionesFormulario; });
                }
            },
            {
                path: 'ver-detalle/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/gestion-promociones/promociones-detalles/promociones-detalles'); }).then(function (m) { return m.PromocionesDetalles; });
                }
            },
        ]
    },
];
