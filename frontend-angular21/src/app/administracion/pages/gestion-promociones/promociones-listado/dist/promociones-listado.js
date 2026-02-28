"use strict";
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
exports.PromocionesListado = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var forms_1 = require("@angular/forms");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
// PrimeNG
var card_1 = require("primeng/card");
var button_1 = require("primeng/button");
var inputtext_1 = require("primeng/inputtext");
var select_1 = require("primeng/select");
var confirmdialog_1 = require("primeng/confirmdialog");
var toast_1 = require("primeng/toast");
var table_1 = require("primeng/table");
var tag_1 = require("primeng/tag");
var tooltip_1 = require("primeng/tooltip");
var datepicker_1 = require("primeng/datepicker");
var api_1 = require("primeng/api");
var PromocionesListado = /** @class */ (function () {
    function PromocionesListado(promocionesService, confirmationService, messageService, router) {
        var _this = this;
        this.promocionesService = promocionesService;
        this.confirmationService = confirmationService;
        this.messageService = messageService;
        this.router = router;
        // Signals
        this.promocionesSignal = core_1.signal([]);
        this.filteredPromociones = core_1.signal([]);
        this.loading = core_1.signal(false);
        this.itemsPorPagina = core_1.signal(10);
        this.paginaActual = core_1.signal(0);
        this.totalItems = core_1.signal(0);
        // Filtros
        this.filtros = {
            busqueda: '',
            fechaInicio: null,
            fechaFin: null,
            tipo: '',
            estado: '',
            rangoDescuento: ''
        };
        this.tiposPromocion = [
            { label: 'Porcentaje', value: 'Porcentaje' },
            { label: 'Monto', value: 'Monto' },
        ];
        this.estadosPromocion = [
            { label: 'Activa', value: 'Activa' },
            { label: 'Inactiva', value: 'Inactiva' },
            { label: 'Expirada', value: 'Expirada' },
        ];
        this.rangosDescuento = [
            { label: 'Hasta 10%', value: '0-10' },
            { label: 'De 10% a 25%', value: '10-25' },
            { label: 'De 25% a 50%', value: '25-50' },
            { label: 'Más de 50%', value: '50-100' },
        ];
        this.destroy$ = new rxjs_1.Subject();
        // Computed KPIs
        this.kpiPromocionesActivas = core_1.computed(function () {
            return _this.promocionesSignal().filter(function (p) { return p.estado === 'Activa'; }).length;
        });
        this.kpiTotalPromociones = core_1.computed(function () { return _this.promocionesSignal().length; });
        this.kpiProximasExpirar = core_1.computed(function () {
            var hoy = new Date();
            var proximosMeses = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
            return _this.promocionesSignal().filter(function (p) {
                return p.estado === 'Activa' &&
                    new Date(p.fechaFin) <= proximosMeses &&
                    new Date(p.fechaFin) > hoy;
            }).length;
        });
        this.kpiExpiradas = core_1.computed(function () {
            var hoy = new Date();
            return _this.promocionesSignal().filter(function (p) { return new Date(p.fechaFin) < hoy; }).length;
        });
    }
    PromocionesListado.prototype.ngOnInit = function () {
        this.cargarPromociones();
    };
    PromocionesListado.prototype.cargarPromociones = function () {
        var _this = this;
        this.loading.set(true);
        var pagina = this.paginaActual() + 1;
        this.promocionesService
            .getPromociones(pagina, this.itemsPorPagina())
            .pipe(operators_1.takeUntil(this.destroy$))
            .subscribe({
            next: function (data) {
                _this.promocionesSignal.set(data.promociones);
                _this.totalItems.set(data.total);
                _this.aplicarFiltros();
                _this.loading.set(false);
            },
            error: function () {
                _this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar promociones' });
                _this.loading.set(false);
            }
        });
    };
    PromocionesListado.prototype.aplicarFiltros = function () {
        var _this = this;
        var filtradas = __spreadArrays(this.promocionesSignal());
        if (this.filtros.busqueda) {
            var termino_1 = this.filtros.busqueda.toLowerCase();
            filtradas = filtradas.filter(function (p) {
                return p.nombre.toLowerCase().includes(termino_1) ||
                    p.codigo.toLowerCase().includes(termino_1);
            });
        }
        if (this.filtros.tipo) {
            filtradas = filtradas.filter(function (p) { return p.tipo === _this.filtros.tipo; });
        }
        if (this.filtros.estado) {
            filtradas = filtradas.filter(function (p) { return p.estado === _this.filtros.estado; });
        }
        this.filteredPromociones.set(filtradas);
    };
    PromocionesListado.prototype.limpiarFiltros = function () {
        this.filtros = {
            busqueda: '',
            fechaInicio: null,
            fechaFin: null,
            tipo: '',
            estado: '',
            rangoDescuento: ''
        };
        this.paginaActual.set(0);
        this.aplicarFiltros();
        this.messageService.add({
            severity: 'info',
            summary: 'Filtros limpiados',
            detail: 'Se han limpiado todos los filtros'
        });
    };
    PromocionesListado.prototype.onPageChange = function (event) {
        this.paginaActual.set(event.first / event.rows);
        this.itemsPorPagina.set(event.rows);
        this.cargarPromociones();
    };
    PromocionesListado.prototype.verPromocion = function (id) {
        if (!id)
            return;
        this.router.navigate(['/admin/promociones/ver-detalle', id]);
    };
    PromocionesListado.prototype.editarPromocion = function (id) {
        if (!id)
            return;
        this.router.navigate(['/admin/promociones/editar', id]);
    };
    PromocionesListado.prototype.irANueva = function () {
        this.router.navigate(['/admin/promociones/crear']);
    };
    PromocionesListado.prototype.eliminarPromocion = function (id, nombre) {
        var _this = this;
        this.confirmationService.confirm({
            message: "\u00BFDeseas eliminar la promoci\u00F3n \"" + nombre + "\"?",
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: function () {
                _this.loading.set(true);
                _this.promocionesService.deletePromocion(id).subscribe(function () {
                    _this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Promoción eliminada' });
                    _this.cargarPromociones();
                });
            }
        });
    };
    PromocionesListado.prototype.obtenerSeveridadEstado = function (estado) {
        switch (estado) {
            case 'Activa': return 'success';
            case 'Inactiva': return 'warn';
            case 'Expirada': return 'danger';
            default: return 'info';
        }
    };
    PromocionesListado.prototype.getFirstRecord = function () {
        return this.paginaActual() * this.itemsPorPagina() + 1;
    };
    PromocionesListado.prototype.getLastRecord = function () {
        var last = (this.paginaActual() + 1) * this.itemsPorPagina();
        return last > this.totalItems() ? this.totalItems() : last;
    };
    PromocionesListado.prototype.obtenerValorDescuento = function (promo) {
        return promo.porcentaje || promo.monto || 0;
    };
    PromocionesListado.prototype.ngOnDestroy = function () {
        this.destroy$.next();
        this.destroy$.complete();
    };
    PromocionesListado = __decorate([
        core_1.Component({
            selector: 'app-promociones-listado',
            standalone: true,
            imports: [
                common_1.CommonModule,
                forms_1.FormsModule,
                card_1.CardModule,
                button_1.ButtonModule,
                inputtext_1.InputTextModule,
                select_1.SelectModule,
                confirmdialog_1.ConfirmDialogModule,
                toast_1.ToastModule,
                table_1.TableModule,
                tag_1.TagModule,
                tooltip_1.TooltipModule,
                datepicker_1.DatePickerModule,
            ],
            templateUrl: './promociones-listado.html',
            styleUrl: './promociones-listado.css',
            providers: [api_1.ConfirmationService, api_1.MessageService]
        })
    ], PromocionesListado);
    return PromocionesListado;
}());
exports.PromocionesListado = PromocionesListado;
