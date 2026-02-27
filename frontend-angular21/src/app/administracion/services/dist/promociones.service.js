"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.PromocionesService = void 0;
var core_1 = require("@angular/core");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var PromocionesService = /** @class */ (function () {
    function PromocionesService() {
        this.dataMock = [
            {
                id: 1,
                codigo: 'PROM-001',
                nombre: 'Descuento Verano',
                descripcion: 'Descuento especial para los productos de temporada de verano',
                porcentaje: 20,
                tipo: 'Porcentaje',
                fechaInicio: new Date('2026-01-01'),
                fechaFin: new Date('2026-03-31'),
                estado: 'Activa',
                productosCantidad: 45
            },
            {
                id: 2,
                codigo: 'PROM-002',
                nombre: 'Black Friday',
                descripcion: 'Gran descuento en toda la tienda durante Black Friday',
                porcentaje: 50,
                tipo: 'Porcentaje',
                fechaInicio: new Date('2026-11-25'),
                fechaFin: new Date('2026-12-01'),
                estado: 'Inactiva',
                productosCantidad: 120
            },
            {
                id: 3,
                codigo: 'PROM-003',
                nombre: 'Compre 2 Lleve 3',
                descripcion: 'Promoción especial: Compra 2 productos y lleva 3',
                porcentaje: 33,
                tipo: 'Porcentaje',
                fechaInicio: new Date('2025-12-01'),
                fechaFin: new Date('2026-01-15'),
                estado: 'Expirada',
                productosCantidad: 80
            },
            {
                id: 4,
                codigo: 'PROM-004',
                nombre: 'Envío Gratis',
                descripcion: 'Envío gratuito en compras mayores a $100',
                monto: 100,
                tipo: 'Monto',
                fechaInicio: new Date('2026-02-01'),
                fechaFin: new Date('2026-12-31'),
                estado: 'Activa',
                productosCantidad: 200
            }
        ];
    }
    PromocionesService.prototype.getPromociones = function (pagina, limite, estado) {
        if (pagina === void 0) { pagina = 1; }
        if (limite === void 0) { limite = 10; }
        var promociones = __spreadArrays(this.dataMock);
        if (estado && estado !== '') {
            promociones = promociones.filter(function (p) { return p.estado === estado; });
        }
        var inicio = (pagina - 1) * limite;
        var fin = inicio + limite;
        var paginadas = promociones.slice(inicio, fin);
        return rxjs_1.of({
            promociones: paginadas,
            total: promociones.length
        }).pipe(operators_1.delay(500));
    };
    PromocionesService.prototype.getPromocionById = function (id) {
        var promocion = this.dataMock.find(function (p) { return p.id === id; });
        return rxjs_1.of(promocion).pipe(operators_1.delay(300));
    };
    PromocionesService.prototype.createPromocion = function (promocion) {
        var nuevoId = Math.max.apply(Math, __spreadArrays(this.dataMock.map(function (p) { return p.id; }), [0])) + 1;
        var nueva = __assign(__assign({}, promocion), { id: nuevoId });
        this.dataMock.push(nueva);
        return rxjs_1.of(nueva).pipe(operators_1.delay(500));
    };
    PromocionesService.prototype.updatePromocion = function (id, promocion) {
        var index = this.dataMock.findIndex(function (p) { return p.id === id; });
        if (index !== -1) {
            this.dataMock[index] = __assign(__assign({}, this.dataMock[index]), promocion);
            return rxjs_1.of(this.dataMock[index]).pipe(operators_1.delay(500));
        }
        return rxjs_1.of({}).pipe(operators_1.delay(500));
    };
    PromocionesService.prototype.deletePromocion = function (id) {
        var index = this.dataMock.findIndex(function (p) { return p.id === id; });
        if (index !== -1) {
            this.dataMock.splice(index, 1);
        }
        return rxjs_1.of(void 0).pipe(operators_1.delay(500));
    };
    PromocionesService = __decorate([
        core_1.Injectable({
            providedIn: 'root'
        })
    ], PromocionesService);
    return PromocionesService;
}());
exports.PromocionesService = PromocionesService;
