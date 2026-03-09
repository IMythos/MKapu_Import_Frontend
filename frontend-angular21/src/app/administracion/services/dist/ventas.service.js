"use strict";
/* sales/src/app/services/ventas-admin.service.ts */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.VentasAdminService = void 0;
var core_1 = require("@angular/core");
var http_1 = require("@angular/common/http");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var enviroment_1 = require("../../../enviroments/enviroment");
var VentasAdminService = /** @class */ (function () {
    function VentasAdminService() {
        this.http = core_1.inject(http_1.HttpClient);
        this.url = enviroment_1.environment.apiUrl;
        this.salesUrl = enviroment_1.environment.apiUrl + "/sales";
        this.adminUrl = enviroment_1.environment.apiUrl + "/admin";
        this.logisticsUrl = enviroment_1.environment.apiUrl + "/logistics";
    }
    Object.defineProperty(VentasAdminService.prototype, "headers", {
        get: function () {
            return new http_1.HttpHeaders({ 'x-role': 'Administrador' });
        },
        enumerable: false,
        configurable: true
    });
    // ─── COMPROBANTES ──────────────────────────────────────────────────────────
    VentasAdminService.prototype.listarHistorialVentas = function (query) {
        var _a, _b;
        if (query === void 0) { query = {}; }
        var params = new http_1.HttpParams()
            .set('page', String((_a = query.page) !== null && _a !== void 0 ? _a : 1))
            .set('limit', String((_b = query.limit) !== null && _b !== void 0 ? _b : 10));
        if (query.status)
            params = params.set('status', query.status);
        if (query.customerId)
            params = params.set('customerId', query.customerId);
        if (query.receiptTypeId != null)
            params = params.set('receiptTypeId', String(query.receiptTypeId));
        if (query.paymentMethodId != null)
            params = params.set('paymentMethodId', String(query.paymentMethodId));
        if (query.dateFrom)
            params = params.set('dateFrom', query.dateFrom);
        if (query.dateTo)
            params = params.set('dateTo', query.dateTo);
        if (query.search)
            params = params.set('search', query.search);
        if (query.sedeId != null)
            params = params.set('sedeId', String(query.sedeId));
        return this.http.get(this.salesUrl + "/receipts/historial", { headers: this.headers, params: params });
    };
    VentasAdminService.prototype.registrarVenta = function (request) {
        return this.http
            .post(this.salesUrl + "/receipts", request, {
            headers: this.headers
        })
            .pipe(operators_1.map(function (res) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
            return ({
                idComprobante: (_b = (_a = res.idComprobante) !== null && _a !== void 0 ? _a : res.id_comprobante) !== null && _b !== void 0 ? _b : 0,
                idCliente: (_d = (_c = res.idCliente) !== null && _c !== void 0 ? _c : res.id_cliente) !== null && _d !== void 0 ? _d : '',
                numeroCompleto: (_f = (_e = res.numeroCompleto) !== null && _e !== void 0 ? _e : res.numero_completo) !== null && _f !== void 0 ? _f : res.serie + "-" + String((_g = res.numero) !== null && _g !== void 0 ? _g : 0).padStart(8, '0'),
                serie: (_h = res.serie) !== null && _h !== void 0 ? _h : '',
                numero: (_j = res.numero) !== null && _j !== void 0 ? _j : 0,
                fecEmision: (_l = (_k = res.fecEmision) !== null && _k !== void 0 ? _k : res.fec_emision) !== null && _l !== void 0 ? _l : new Date().toISOString(),
                fecVenc: (_o = (_m = res.fecVenc) !== null && _m !== void 0 ? _m : res.fec_venc) !== null && _o !== void 0 ? _o : undefined,
                tipoOperacion: (_q = (_p = res.tipoOperacion) !== null && _p !== void 0 ? _p : res.tipo_operacion) !== null && _q !== void 0 ? _q : '',
                subtotal: (_r = res.subtotal) !== null && _r !== void 0 ? _r : 0,
                igv: (_s = res.igv) !== null && _s !== void 0 ? _s : 0,
                isc: (_t = res.isc) !== null && _t !== void 0 ? _t : 0,
                total: (_u = res.total) !== null && _u !== void 0 ? _u : 0,
                estado: (_v = res.estado) !== null && _v !== void 0 ? _v : 'EMITIDO',
                codMoneda: (_x = (_w = res.codMoneda) !== null && _w !== void 0 ? _w : res.cod_moneda) !== null && _x !== void 0 ? _x : 'PEN',
                idTipoComprobante: (_z = (_y = res.idTipoComprobante) !== null && _y !== void 0 ? _y : res.id_tipo_comprobante) !== null && _z !== void 0 ? _z : 0,
                idTipoVenta: (_1 = (_0 = res.idTipoVenta) !== null && _0 !== void 0 ? _0 : res.id_tipo_venta) !== null && _1 !== void 0 ? _1 : 0,
                idSedeRef: (_3 = (_2 = res.idSedeRef) !== null && _2 !== void 0 ? _2 : res.id_sede_ref) !== null && _3 !== void 0 ? _3 : 0,
                idResponsableRef: (_5 = (_4 = res.idResponsableRef) !== null && _4 !== void 0 ? _4 : res.id_responsable_ref) !== null && _5 !== void 0 ? _5 : '',
                items: (_6 = res.items) !== null && _6 !== void 0 ? _6 : []
            });
        }), operators_1.catchError(function (err) { return rxjs_1.throwError(function () { return err; }); }));
    };
    VentasAdminService.prototype.anularVenta = function (id, reason) {
        return this.http.put(this.salesUrl + "/receipts/" + id + "/annul", { reason: reason }, { headers: this.headers });
    };
    VentasAdminService.prototype.emitirComprobante = function (id, paymentTypeId) {
        return this.http.put(this.salesUrl + "/receipts/" + id + "/emit", { paymentTypeId: paymentTypeId }, { headers: this.headers });
    };
    VentasAdminService.prototype.obtenerVentaConHistorial = function (id, historialPage) {
        if (historialPage === void 0) { historialPage = 1; }
        var params = new http_1.HttpParams().set('historialPage', String(historialPage));
        return this.http.get(this.salesUrl + "/receipts/" + id + "/detalle", { headers: this.headers, params: params });
    };
    VentasAdminService.prototype.getDetalleComprobante = function (receiptId) {
        return this.http.get(this.salesUrl + "/receipts/" + receiptId + "/detalle", {
            headers: this.headers
        });
    };
    VentasAdminService.prototype.getKpiSemanal = function (sedeId) {
        var params = new http_1.HttpParams();
        if (sedeId != null)
            params = params.set('sedeId', String(sedeId));
        return this.http.get(this.salesUrl + "/receipts/kpi/semanal", {
            headers: this.headers,
            params: params
        });
    };
    VentasAdminService.prototype.obtenerTiposVenta = function () {
        return this.http
            .get(this.salesUrl + "/receipts/sale-types", {
            headers: this.headers
        })
            .pipe(operators_1.catchError(function () { return rxjs_1.of([]); }));
    };
    VentasAdminService.prototype.obtenerTiposComprobante = function () {
        return this.http
            .get(this.salesUrl + "/receipts/receipt-types", {
            headers: this.headers
        })
            .pipe(operators_1.catchError(function () { return rxjs_1.of([]); }));
    };
    VentasAdminService.prototype.obtenerMetodosPago = function () {
        return this.http
            .get(this.salesUrl + "/receipts/payment-types", {
            headers: this.headers
        })
            .pipe(operators_1.catchError(function () { return rxjs_1.of([]); }));
    };
    // ─── PDF DEL COMPROBANTE ───────────────────────────────────────────────────
    /**
     * Descarga el PDF del comprobante directamente desde el navegador.
     * Llama a GET /sales/receipts/:id/pdf → blob → dispara la descarga.
     * @param id          ID del comprobante
     * @param nombreArchivo  Nombre opcional del archivo (default: comprobante-{id}.pdf)
     */
    VentasAdminService.prototype.descargarComprobantePdf = function (id, nombreArchivo) {
        return this.http
            .get(this.salesUrl + "/receipts/" + id + "/pdf", {
            headers: this.headers,
            responseType: 'blob'
        })
            .pipe(operators_1.map(function (blob) {
            var url = URL.createObjectURL(blob);
            var anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = nombreArchivo !== null && nombreArchivo !== void 0 ? nombreArchivo : "comprobante-" + id + ".pdf";
            anchor.click();
            URL.revokeObjectURL(url);
        }), operators_1.catchError(function (err) { return rxjs_1.throwError(function () { return err; }); }));
    };
    /**
     * Abre el PDF en una pestaña nueva del navegador (para previsualizar).
     * @param id  ID del comprobante
     */
    VentasAdminService.prototype.verComprobantePdfEnPestana = function (id) {
        return this.http
            .get(this.salesUrl + "/receipts/" + id + "/pdf", {
            headers: this.headers,
            responseType: 'blob'
        })
            .pipe(operators_1.map(function (blob) {
            var pdfBlob = new Blob([blob], { type: 'application/pdf' });
            var url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
            // Liberar el object URL después de que el navegador lo cargue
            setTimeout(function () { return URL.revokeObjectURL(url); }, 10000);
        }), operators_1.catchError(function (err) { return rxjs_1.throwError(function () { return err; }); }));
    };
    // ─── PROMOCIONES ───────────────────────────────────────────────────────────
    VentasAdminService.prototype.obtenerPromocionesActivas = function () {
        return this.http
            .get(this.salesUrl + "/promotions/active", {
            headers: this.headers
        })
            .pipe(operators_1.catchError(function () { return rxjs_1.of([]); }));
    };
    // ─── SEDES ─────────────────────────────────────────────────────────────────
    VentasAdminService.prototype.obtenerSedes = function () {
        return this.http
            .get(this.adminUrl + "/headquarters", { headers: this.headers })
            .pipe(operators_1.map(function (res) { var _a, _b, _c; return (_c = (_b = (_a = res.data) !== null && _a !== void 0 ? _a : res.headquarters) !== null && _b !== void 0 ? _b : res) !== null && _c !== void 0 ? _c : []; }));
    };
    // ─── PRODUCTOS ─────────────────────────────────────────────────────────────
    VentasAdminService.prototype.obtenerProductosConStock = function (idSede, idCategoria, page, size) {
        if (page === void 0) { page = 1; }
        if (size === void 0) { size = 10; }
        var params = new http_1.HttpParams().set('page', String(page)).set('size', String(size));
        if (idSede != null)
            params = params.set('id_sede', String(idSede));
        if (idCategoria != null)
            params = params.set('id_categoria', String(idCategoria));
        return this.http.get(this.logisticsUrl + "/products/ventas/stock", {
            headers: this.headers,
            params: params
        });
    };
    VentasAdminService.prototype.buscarProductosVentas = function (query, idSede, idCategoria) {
        var params = new http_1.HttpParams().set('search', query);
        if (idSede != null)
            params = params.set('id_sede', String(idSede));
        if (idCategoria != null)
            params = params.set('id_categoria', String(idCategoria));
        return this.http.get(this.logisticsUrl + "/products/ventas/autocomplete", { headers: this.headers, params: params });
    };
    VentasAdminService.prototype.obtenerCategoriasConStock = function (idSede) {
        var params = new http_1.HttpParams();
        if (idSede != null)
            params = params.set('id_sede', String(idSede));
        return this.http.get(this.logisticsUrl + "/products/categorias-con-stock", { headers: this.headers, params: params });
    };
    VentasAdminService.prototype.mapearProductoConStock = function (p) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        var almacenes = Array.isArray(p.almacenes)
            ? p.almacenes.map(function (a) {
                var _a, _b, _c, _d;
                return ({
                    nombre: (_b = (_a = a.nombre) !== null && _a !== void 0 ? _a : a.nombre_almacen) !== null && _b !== void 0 ? _b : 'Almacén',
                    stock: Number((_d = (_c = a.stock) !== null && _c !== void 0 ? _c : a.cantidad) !== null && _d !== void 0 ? _d : 0)
                });
            })
            : [{ nombre: (_a = p.nombre_almacen) !== null && _a !== void 0 ? _a : 'Almacén', stock: Number((_b = p.stock) !== null && _b !== void 0 ? _b : 0) }];
        return {
            id: Number((_c = p.id) !== null && _c !== void 0 ? _c : p.id_producto),
            codigo: (_e = (_d = p.codigo) !== null && _d !== void 0 ? _d : p.cod_prod) !== null && _e !== void 0 ? _e : '',
            nombre: (_g = (_f = p.nombre) !== null && _f !== void 0 ? _f : p.descripcion) !== null && _g !== void 0 ? _g : '',
            familia: (_j = (_h = p.familia) !== null && _h !== void 0 ? _h : p.categoria) !== null && _j !== void 0 ? _j : '',
            categoriaId: Number((_l = (_k = p.id_categoria) !== null && _k !== void 0 ? _k : p.categoriaId) !== null && _l !== void 0 ? _l : 0) || undefined,
            precioUnidad: Number((_o = (_m = p.precioUnidad) !== null && _m !== void 0 ? _m : p.precio_unitario) !== null && _o !== void 0 ? _o : 0),
            precioCaja: Number((_q = (_p = p.precioCaja) !== null && _p !== void 0 ? _p : p.precio_caja) !== null && _q !== void 0 ? _q : 0),
            precioMayorista: Number((_s = (_r = p.precioMayorista) !== null && _r !== void 0 ? _r : p.precio_mayor) !== null && _s !== void 0 ? _s : 0),
            stock: almacenes.reduce(function (s, a) { return s + a.stock; }, 0),
            sede: (_t = p.sede) !== null && _t !== void 0 ? _t : '',
            almacenes: almacenes
        };
    };
    VentasAdminService.prototype.mapearAutocompleteVentas = function (p) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
        var almacenes = Array.isArray(p.almacenes)
            ? p.almacenes.map(function (a) {
                var _a, _b, _c, _d;
                return ({
                    nombre: (_b = (_a = a.nombre) !== null && _a !== void 0 ? _a : a.nombre_almacen) !== null && _b !== void 0 ? _b : 'Almacén',
                    stock: Number((_d = (_c = a.stock) !== null && _c !== void 0 ? _c : a.cantidad) !== null && _d !== void 0 ? _d : 0)
                });
            })
            : [{ nombre: (_a = p.nombre_almacen) !== null && _a !== void 0 ? _a : 'Almacén', stock: Number((_b = p.stock) !== null && _b !== void 0 ? _b : 0) }];
        return {
            id: (_c = p.id) !== null && _c !== void 0 ? _c : p.id_producto,
            codigo: (_e = (_d = p.codigo) !== null && _d !== void 0 ? _d : p.cod_prod) !== null && _e !== void 0 ? _e : '',
            nombre: (_g = (_f = p.nombre) !== null && _f !== void 0 ? _f : p.descripcion) !== null && _g !== void 0 ? _g : '',
            familia: (_j = (_h = p.familia) !== null && _h !== void 0 ? _h : p.categoria) !== null && _j !== void 0 ? _j : '',
            categoriaId: Number((_l = (_k = p.id_categoria) !== null && _k !== void 0 ? _k : p.categoriaId) !== null && _l !== void 0 ? _l : 0) || undefined,
            precioUnidad: Number((_o = (_m = p.precioUnidad) !== null && _m !== void 0 ? _m : p.precio_unitario) !== null && _o !== void 0 ? _o : 0),
            precioCaja: Number((_q = (_p = p.precioCaja) !== null && _p !== void 0 ? _p : p.precio_caja) !== null && _q !== void 0 ? _q : 0),
            precioMayorista: Number((_s = (_r = p.precioMayorista) !== null && _r !== void 0 ? _r : p.precio_mayor) !== null && _s !== void 0 ? _s : 0),
            stock: almacenes.reduce(function (s, a) { return s + a.stock; }, 0),
            sede: (_t = p.sede) !== null && _t !== void 0 ? _t : '',
            almacenes: almacenes
        };
    };
    // ─── CLIENTES ──────────────────────────────────────────────────────────────
    VentasAdminService.prototype.buscarCliente = function (documentValue) {
        return this.http
            .get(this.salesUrl + "/customers/document/" + documentValue, {
            headers: this.headers
        })
            .pipe(operators_1.map(function (cliente) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            if (!cliente)
                throw { error: { message: 'Cliente no encontrado' } };
            return {
                customerId: (_a = cliente.customerId) !== null && _a !== void 0 ? _a : cliente.id_cliente,
                name: (_d = (_c = (_b = cliente.name) !== null && _b !== void 0 ? _b : cliente.nombres) !== null && _c !== void 0 ? _c : cliente.displayName) !== null && _d !== void 0 ? _d : '',
                documentValue: (_e = cliente.documentValue) !== null && _e !== void 0 ? _e : cliente.valor_doc,
                documentTypeDescription: (_f = cliente.documentTypeDescription) !== null && _f !== void 0 ? _f : '',
                documentTypeSunatCode: (_g = cliente.documentTypeSunatCode) !== null && _g !== void 0 ? _g : '',
                invoiceType: (_j = (_h = cliente.invoiceType) !== null && _h !== void 0 ? _h : cliente.invoice_type) !== null && _j !== void 0 ? _j : '',
                status: (_k = cliente.status) !== null && _k !== void 0 ? _k : cliente.estado,
                address: (_m = (_l = cliente.address) !== null && _l !== void 0 ? _l : cliente.direccion) !== null && _m !== void 0 ? _m : null,
                email: (_o = cliente.email) !== null && _o !== void 0 ? _o : null,
                phone: (_q = (_p = cliente.phone) !== null && _p !== void 0 ? _p : cliente.telefono) !== null && _q !== void 0 ? _q : null,
                displayName: (_s = (_r = cliente.displayName) !== null && _r !== void 0 ? _r : cliente.name) !== null && _s !== void 0 ? _s : ''
            };
        }), operators_1.catchError(function (err) { return rxjs_1.throwError(function () { return err; }); }));
    };
    VentasAdminService.prototype.crearCliente = function (request) {
        return this.http.post(this.salesUrl + "/customers", request, {
            headers: this.headers
        });
    };
    VentasAdminService.prototype.actualizarCliente = function (id, payload) {
        return this.http.put(this.salesUrl + "/customers/" + id, payload, {
            headers: this.headers
        });
    };
    VentasAdminService.prototype.obtenerTiposDocumento = function () {
        return this.http.get(this.url + "/sales/customers/document-types", {
            headers: this.headers
        });
    };
    VentasAdminService.prototype.consultarDocumentoIdentidad = function (numero) {
        return this.http
            .get(this.salesUrl + "/reniec/consultar/" + numero, {
            headers: this.headers
        })
            .pipe(operators_1.catchError(function () {
            return rxjs_1.of({
                nombres: '',
                apellidoPaterno: '',
                apellidoMaterno: '',
                nombreCompleto: '',
                tipoDocumento: ''
            });
        }));
    };
    // ─── DETALLE COMPLETO ──────────────────────────────────────────────────────
    VentasAdminService.prototype.getDetalleCompleto = function (id, historialPage) {
        if (historialPage === void 0) { historialPage = 1; }
        var params = new http_1.HttpParams().set('historialPage', String(historialPage));
        return this.http.get(this.salesUrl + "/receipts/" + id + "/detalle", { headers: this.headers, params: params });
    };
    VentasAdminService = __decorate([
        core_1.Injectable({ providedIn: 'root' })
    ], VentasAdminService);
    return VentasAdminService;
}());
exports.VentasAdminService = VentasAdminService;
