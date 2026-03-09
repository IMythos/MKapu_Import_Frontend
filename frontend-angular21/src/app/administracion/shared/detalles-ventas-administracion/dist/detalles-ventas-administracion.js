"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.DetallesVentasAdministracion = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var router_1 = require("@angular/router");
var rxjs_1 = require("rxjs");
var card_1 = require("primeng/card");
var button_1 = require("primeng/button");
var divider_1 = require("primeng/divider");
var tag_1 = require("primeng/tag");
var table_1 = require("primeng/table");
var skeleton_1 = require("primeng/skeleton");
var tooltip_1 = require("primeng/tooltip");
var toast_1 = require("primeng/toast");
var api_1 = require("primeng/api");
var ventas_service_1 = require("../../services/ventas.service");
var loading_overlay_component_1 = require("../../../shared/components/loading-overlay/loading-overlay.component");
var DetallesVentasAdministracion = /** @class */ (function () {
    function DetallesVentasAdministracion() {
        this.route = core_1.inject(router_1.ActivatedRoute);
        this.router = core_1.inject(router_1.Router);
        this.location = core_1.inject(common_1.Location);
        this.ventasService = core_1.inject(ventas_service_1.VentasAdminService);
        this.messageService = core_1.inject(api_1.MessageService);
        this.cdr = core_1.inject(core_1.ChangeDetectorRef);
        this.tituloKicker = 'VENTAS - HISTORIAL DE VENTAS - DETALLE';
        this.subtituloKicker = 'DETALLE DE VENTA';
        this.iconoCabecera = 'pi pi-file-edit';
        this.detalle = null;
        this.loading = true;
        this.historialPage = 1;
        this.loadingHistorial = false;
        this.subs = new rxjs_1.Subscription();
    }
    DetallesVentasAdministracion.prototype.ngOnInit = function () {
        var _this = this;
        var sub = this.route.paramMap.subscribe(function (params) {
            var id = params.get('id');
            id ? _this.cargarDetalle(+id) : _this.volver();
        });
        this.subs.add(sub);
    };
    DetallesVentasAdministracion.prototype.ngOnDestroy = function () {
        this.subs.unsubscribe();
    };
    DetallesVentasAdministracion.prototype.cargarDetalle = function (id, histPage) {
        var _this = this;
        if (histPage === void 0) { histPage = 1; }
        this.loading = true;
        this.historialPage = histPage;
        this.cdr.markForCheck();
        var sub = this.ventasService.getDetalleCompleto(id, histPage).subscribe({
            next: function (data) {
                _this.detalle = data;
                _this.loading = false;
                _this.loadingHistorial = false;
                _this.cdr.markForCheck();
            },
            error: function () {
                _this.loading = false;
                _this.loadingHistorial = false;
                _this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el detalle de la venta',
                    life: 3000
                });
                _this.cdr.markForCheck();
                setTimeout(function () { return _this.volver(); }, 2500);
            }
        });
        this.subs.add(sub);
    };
    DetallesVentasAdministracion.prototype.cambiarPaginaHistorial = function (page) {
        var _this = this;
        if (!this.detalle || this.loadingHistorial)
            return;
        this.loadingHistorial = true;
        this.historialPage = page;
        this.cdr.markForCheck();
        var id = this.detalle.id_comprobante;
        var sub = this.ventasService.getDetalleCompleto(id, page).subscribe({
            next: function (data) {
                _this.detalle.historial_cliente = data.historial_cliente;
                _this.detalle.historial_pagination = data.historial_pagination;
                _this.loadingHistorial = false;
                _this.cdr.markForCheck();
            },
            error: function () {
                _this.loadingHistorial = false;
                _this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el historial',
                    life: 3000
                });
                _this.cdr.markForCheck();
            }
        });
        this.subs.add(sub);
    };
    // ─────────────────────────────────────────────────────────────────────────
    // Calcula el descuento a mostrar por cada fila de producto.
    //
    // Prioridad:
    //   1. Descuento propio del ítem  (descuento_nombre / descuento_porcentaje)
    //   2. Descuento proporcional de la promoción del comprobante
    //      → peso = (precio_unit × cantidad) / suma_total_de_todos_los_ítems
    //      → monto_item = peso × monto_descuento_promo
    // ─────────────────────────────────────────────────────────────────────────
    DetallesVentasAdministracion.prototype.getDescuentoItemDisplay = function (item) {
        var _a, _b;
        // 1. Descuento propio del ítem
        if (this.tieneDescuentoReal(item.descuento_nombre, item.descuento_porcentaje)) {
            return {
                tipo: 'item',
                label: item.descuento_nombre + " (" + item.descuento_porcentaje + "%)",
                monto: 0
            };
        }
        // 2. Descuento proporcional de la promoción
        if (((_a = this.detalle) === null || _a === void 0 ? void 0 : _a.promocion) && this.detalle.promocion.monto_descuento > 0) {
            // Suma del total bruto de todos los ítems (precio_unit × cantidad)
            var sumaItems = ((_b = this.detalle.productos) !== null && _b !== void 0 ? _b : []).reduce(function (s, p) { return s + p.precio_unit * p.cantidad; }, 0);
            if (sumaItems > 0) {
                var pesoItem = (item.precio_unit * item.cantidad) / sumaItems;
                var montoItem = pesoItem * this.detalle.promocion.monto_descuento;
                return {
                    tipo: 'promo',
                    label: this.detalle.promocion.nombre,
                    monto: montoItem
                };
            }
        }
        return { tipo: 'none', label: '', monto: 0 };
    };
    DetallesVentasAdministracion.prototype.volver = function () {
        var state = history.state;
        (state === null || state === void 0 ? void 0 : state.rutaRetorno) ? this.router.navigateByUrl(state.rutaRetorno)
            : this.location.back();
    };
    DetallesVentasAdministracion.prototype.irHistorialVentas = function () {
        this.router.navigate(['/admin/historial-ventas-administracion']);
    };
    DetallesVentasAdministracion.prototype.verDetalleHistorial = function (idComprobante) {
        var _a;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.router.navigate(['/admin/detalles-ventas-administracion', idComprobante], {
            state: {
                rutaRetorno: "/admin/detalles-ventas-administracion/" + ((_a = this.detalle) === null || _a === void 0 ? void 0 : _a.id_comprobante)
            }
        });
    };
    DetallesVentasAdministracion.prototype.imprimirComprobante = function () {
        if (!this.detalle)
            return;
        this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
            state: {
                comprobante: this.detalle,
                rutaRetorno: "/admin/detalles-ventas-administracion/" + this.detalle.id_comprobante
            }
        });
    };
    DetallesVentasAdministracion.prototype.imprimirHistorial = function (item) {
        var _a;
        this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
            state: {
                comprobante: item,
                rutaRetorno: "/admin/detalles-ventas-administracion/" + ((_a = this.detalle) === null || _a === void 0 ? void 0 : _a.id_comprobante)
            }
        });
    };
    DetallesVentasAdministracion.prototype.getTipoComprobanteLabel = function () {
        var _a, _b;
        var tipo = (_b = (_a = this.detalle) === null || _a === void 0 ? void 0 : _a.tipo_comprobante) !== null && _b !== void 0 ? _b : '';
        return tipo.toUpperCase().includes('BOLETA') || tipo === '03' ? 'BOLETA' : 'FACTURA';
    };
    DetallesVentasAdministracion.prototype.getTipoComprobanteIcon = function () {
        return this.getTipoComprobanteLabel() === 'BOLETA' ? 'pi pi-file' : 'pi pi-file-edit';
    };
    DetallesVentasAdministracion.prototype.getSeverityEstado = function (estado) {
        switch (estado) {
            case 'EMITIDO': return 'success';
            case 'ANULADO': return 'danger';
            case 'RECHAZADO': return 'warn';
            default: return 'info';
        }
    };
    DetallesVentasAdministracion.prototype.getSeverityTipoPago = function (metodo) {
        if (!metodo)
            return 'secondary';
        var m = metodo.toLowerCase();
        if (m.includes('efectivo'))
            return 'success';
        if (m.includes('yape') || m.includes('plin'))
            return 'info';
        if (m.includes('tarjeta'))
            return 'warn';
        return 'secondary';
    };
    DetallesVentasAdministracion.prototype.getIconoMedioPago = function (medio) {
        var _a, _b;
        var m = (medio !== null && medio !== void 0 ? medio : '').toUpperCase();
        var map = {
            EFECTIVO: 'pi pi-money-bill',
            TARJETA: 'pi pi-credit-card',
            YAPE: 'pi pi-mobile',
            PLIN: 'pi pi-mobile',
            TRANSFERENCIA: 'pi pi-arrow-right-arrow-left'
        };
        return (_b = (_a = Object.entries(map).find(function (_a) {
            var k = _a[0];
            return m.includes(k);
        })) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : 'pi pi-wallet';
    };
    DetallesVentasAdministracion.prototype.getTipoDocumentoLabel = function () {
        var _a, _b, _c;
        var tipo = (_c = (_b = (_a = this.detalle) === null || _a === void 0 ? void 0 : _a.cliente) === null || _b === void 0 ? void 0 : _b.tipo_documento) !== null && _c !== void 0 ? _c : '';
        if (tipo.includes('RUC'))
            return 'RUC';
        if (tipo.includes('DNI'))
            return 'DNI';
        if (tipo.includes('PASAPORTE'))
            return 'PASAPORTE';
        return tipo || 'DOC';
    };
    DetallesVentasAdministracion.prototype.calcularTotalItem = function (cantidad, precio) {
        return cantidad * precio;
    };
    DetallesVentasAdministracion.prototype.getTipoPromocionLabel = function (tipo) {
        var _a;
        var map = {
            PORCENTAJE: 'Descuento porcentual',
            MONTO_FIJO: 'Descuento monto fijo',
            '2X1': 'Promoción 2x1',
            ENVIO_GRATIS: 'Envío gratis',
            DESCUENTO: 'Descuento'
        };
        return (_a = map[tipo]) !== null && _a !== void 0 ? _a : tipo;
    };
    DetallesVentasAdministracion.prototype.getTipoPromocionIcon = function (tipo) {
        var _a;
        var map = {
            PORCENTAJE: 'pi pi-percentage',
            MONTO_FIJO: 'pi pi-tag',
            '2X1': 'pi pi-gift',
            ENVIO_GRATIS: 'pi pi-truck',
            DESCUENTO: 'pi pi-tag'
        };
        return (_a = map[tipo]) !== null && _a !== void 0 ? _a : 'pi pi-tag';
    };
    DetallesVentasAdministracion.prototype.tieneDescuentoReal = function (nombre, porcentaje) {
        if (!nombre || nombre.trim() === '' || nombre === 'SIN DESCUENTO')
            return false;
        if (!porcentaje || porcentaje <= 0)
            return false;
        return true;
    };
    Object.defineProperty(DetallesVentasAdministracion.prototype, "paginasHistorialVisibles", {
        get: function () {
            var _a, _b, _c;
            var total = (_c = (_b = (_a = this.detalle) === null || _a === void 0 ? void 0 : _a.historial_pagination) === null || _b === void 0 ? void 0 : _b.total_pages) !== null && _c !== void 0 ? _c : 1;
            var current = this.historialPage;
            var delta = 2;
            var range = [];
            for (var i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
                range.push(i);
            }
            return range;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DetallesVentasAdministracion.prototype, "totalPaginasHistorial", {
        get: function () {
            var _a, _b, _c;
            return (_c = (_b = (_a = this.detalle) === null || _a === void 0 ? void 0 : _a.historial_pagination) === null || _b === void 0 ? void 0 : _b.total_pages) !== null && _c !== void 0 ? _c : 1;
        },
        enumerable: false,
        configurable: true
    });
    DetallesVentasAdministracion = __decorate([
        core_1.Component({
            selector: 'app-detalles-ventas-administracion',
            standalone: true,
            changeDetection: core_1.ChangeDetectionStrategy.OnPush,
            imports: [common_1.CommonModule, card_1.Card, button_1.Button, divider_1.Divider, tag_1.Tag, table_1.TableModule, skeleton_1.Skeleton, tooltip_1.Tooltip, toast_1.Toast, loading_overlay_component_1.LoadingOverlayComponent],
            providers: [api_1.MessageService],
            templateUrl: './detalles-ventas-administracion.html',
            styleUrls: ['./detalles-ventas-administracion.css']
        })
    ], DetallesVentasAdministracion);
    return DetallesVentasAdministracion;
}());
exports.DetallesVentasAdministracion = DetallesVentasAdministracion;
