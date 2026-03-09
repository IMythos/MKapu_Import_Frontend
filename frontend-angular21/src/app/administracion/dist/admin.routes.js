"use strict";
exports.__esModule = true;
exports.ADMIN_ROUTES = void 0;
var pending_changes_guard_1 = require("../core/guards/pending-changes.guard");
var cashbox_guard_1 = require("../ventas/guards/cashbox.guard");
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
    {
        path: 'caja',
        loadComponent: function () { return Promise.resolve().then(function () { return require('../ventas/pages/caja/caja.page'); }).then(function (m) { return m.CajaPage; }); }
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
          roles y permisos
      ======================= */
    {
        path: 'roles-permisos',
        children: [
            // ── Rol-Permisos (listado principal) ──
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/pages/roles-permisos-listado/role-permission-listado.component'); }).then(function (m) { return m.RolePermissionListadoComponent; });
                }
            },
            // ── Roles ──
            {
                path: 'roles',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/roles/pages/roles-listado/roles-listado.component'); }).then(function (m) { return m.RolesListadoComponent; });
                }
            },
            {
                path: 'agregar-rol',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/roles/pages/agregar-rol/agregar-rol.component'); }).then(function (m) { return m.AgregarRolComponent; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-rol/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/roles/pages/editar-role/editar-rol.component'); }).then(function (m) { return m.EditarRolComponent; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            // ── Permisos ──
            {
                path: 'permisos',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/permisos/pages/permisos-listado/permisos-listado.component'); }).then(function (m) { return m.PermisosListadoComponent; });
                }
            },
            {
                path: 'agregar-permiso',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/permisos/pages/agregar-permiso/agregar-permiso.component'); }).then(function (m) { return m.AgregarPermisoComponent; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-permiso/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/permisos/pages/editar-permiso/editar-permiso.component'); }).then(function (m) { return m.EditarPermisoComponent; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            // ── Rol-Permisos (agregar y editar asignación) ──
            {
                path: 'agregar-roles-permisos',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/pages/agregar-roles-permisos/agregar-roles-permisos.component'); }).then(function (m) { return m.AgregarRolesPermisosComponent; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-roles-permisos/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/roles-permisos/pages/editar-roles-permisos/editar-rol.component'); }).then(function (m) { return m.EditarRolComponent; });
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
      VENTAS ADMINISTRACIÓN
    ======================= */
    {
        path: 'generar-ventas-administracion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/generar-ventas-administracion/generar-ventas-administracion'); }).then(function (m) { return m.GenerarVentasAdministracion; });
        },
        canActivate: [cashbox_guard_1.CashboxAdminGuard]
    },
    {
        path: 'historial-ventas-administracion',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/historial-ventas-administracion/historial-ventas-administracion'); }).then(function (m) { return m.HistorialVentasAdministracion; });
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
            return Promise.resolve().then(function () { return require('./pages/comision/comision-regla/comisionregla'); }).then(function (m) { return m.ComisionRegla; });
        }
    },
    {
        path: 'comision-reportes',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/comision/comision-reportes/comisionreportes'); }).then(function (m) { return m.ComisionReportes; });
        }
    },
    /* =======================
    GESTIÓN DE Conteos
  ======================= */
    {
        path: 'conteo-inventario',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../logistica/pages/conteo-inventario/conteoinventario'); }).then(function (m) { return m.ConteoInventarios; });
        }
    },
    {
        path: 'conteo-crear',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../logistica/pages/conteo-crear/conteocrear'); }).then(function (m) { return m.ConteoCrear; });
        }
    },
    {
        path: 'conteo-detalle/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('../logistica/pages/conteo-detalle/conteodetalle'); }).then(function (m) { return m.ConteoDetalle; });
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
      cotizacion
  ======================= */
    {
        path: 'cotizaciones',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-cotizacion/gestion-listado/gestion-listado'); }).then(function (m) { return m.GestionCotizacionesComponent; });
        }
    },
    {
        path: 'agregar-cotizaciones',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-cotizacion/gestion-formulario/cotizacion-formulario'); }).then(function (m) { return m.CotizacionFormulario; });
        }
    },
    {
        path: 'ver-detalle-cotizacion/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/gestion-cotizacion/detalle-gestion-formulario/detalle-cotizacion-formulario'); }).then(function (m) { return m.DetalleCotizacionComponent; });
        }
    },
    {
        path: 'ventas-por-cobrar',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/ventas-por-cobrar/ventas-por-cobrar-listado/ventas-por-cobrar-listado'); }).then(function (m) { return m.VentasPorCobrarListadoComponent; });
        }
    },
    {
        path: 'agregar-ventas-por-cobrar',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/ventas-por-cobrar/ventas-por-cobrar-formulario/ventas-por-cobrar-formulario'); }).then(function (m) { return m.VentasPorCobrarFormulario; });
        }
    },
    {
        path: 'detalles-ventas-por-cobrar/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/ventas-por-cobrar/detalle-ventas-por-cobrar-formulario/detalle-ventas-por-cobrar-formulario'); }).then(function (m) { return m.DetalleVentaPorCobrar; });
        }
    },
    // ── NUEVA RUTA ──────────────────────────────────────────────────────
    {
        path: 'pagar-ventas-por-cobrar/:id',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/ventas-por-cobrar/ventas-por-cobrar-pago/ventas-por-cobrar-pago.component'); }).then(function (m) { return m.VentasPorCobrarPagoComponent; });
        }
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
        path: 'despacho-productos/agregar-despacho',
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
    /* =======================
       DESCUENTOS
     ======================= */
    {
        path: 'descuentos',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/descuento/pages/descuento/descuento'); }).then(function (m) { return m.DescuentoPage; });
                }
            },
            {
                path: 'agregar-descuento',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/descuento/pages/agregar-descuento/agregar-descuento'); }).then(function (m) { return m.AgregarDescuento; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
            {
                path: 'editar-descuento/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('./pages/descuento/pages/editar-descuento/editar-descuento'); }).then(function (m) { return m.EditarDescuento; });
                },
                canDeactivate: [pending_changes_guard_1.pendingChangesGuard]
            },
        ]
    },
    {
        path: 'terminos-condiciones',
        loadComponent: function () {
            return Promise.resolve().then(function () { return require('./pages/reportes/pages/terminos-condiciones/terminos-condiciones'); }).then(function (m) { return m.TerminosCondicionesComponent; });
        }
    },
    {
        path: 'reclamos-listado',
        children: [
            {
                path: '',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado'); }).then(function (m) { return m.ReclamosListado; });
                }
            },
            {
                path: 'crear',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/pages/reclamos-garantia/reclamos-crear/reclamos-crear'); }).then(function (m) { return m.ReclamosCrear; });
                }
            },
            {
                path: 'editar/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/pages/reclamos-garantia/reclamos-editar/reclamos-editar'); }).then(function (m) { return m.ReclamosEditar; });
                }
            },
            {
                path: 'detalle/:id',
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/pages/reclamos-garantia/reclamos-detalles/reclamos-detalles'); }).then(function (m) { return m.ReclamosDetalles; });
                }
            },
            {
                path: 'imprimir-comprobante-administracion',
                canActivate: [cashbox_guard_1.CashboxGuard],
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/shared/imprimir-comprobante/imprimir-comprobante'); }).then(function (m) { return m.ImprimirComprobante; });
                }
            },
            {
                path: 'ver-detalle/:id',
                canActivate: [cashbox_guard_1.CashboxGuard],
                loadComponent: function () {
                    return Promise.resolve().then(function () { return require('../ventas/shared/detalles-venta/detalle-venta'); }).then(function (m) { return m.DetalleVenta; });
                }
            },
        ]
    },
];
