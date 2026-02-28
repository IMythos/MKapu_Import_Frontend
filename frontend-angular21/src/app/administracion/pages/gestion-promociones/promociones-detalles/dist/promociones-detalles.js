"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PromocionesDetalles = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var router_1 = require("@angular/router");
// PrimeNG Modules
var button_1 = require("primeng/button");
var card_1 = require("primeng/card");
var tag_1 = require("primeng/tag");
var progressbar_1 = require("primeng/progressbar");
var toast_1 = require("primeng/toast");
var confirmdialog_1 = require("primeng/confirmdialog");
var tooltip_1 = require("primeng/tooltip");
var api_1 = require("primeng/api");
// Services & Interfaces
var promociones_service_1 = require("../../../services/promociones.service");
var PromocionesDetalles = /** @class */ (function () {
    function PromocionesDetalles() {
        var _this = this;
        // Inyecciones mediante inject()
        this.route = core_1.inject(router_1.ActivatedRoute);
        this.router = core_1.inject(router_1.Router);
        this.promocionesService = core_1.inject(promociones_service_1.PromocionesService);
        this.messageService = core_1.inject(api_1.MessageService);
        this.confirmationService = core_1.inject(api_1.ConfirmationService);
        // Signals de estado
        this.cargando = core_1.signal(true);
        this.promocion = core_1.signal(null);
        /**
         * Determina el color del Tag basado en el estado de la promoción
         */
        this.severidadEstado = core_1.computed(function () {
            var _a;
            var estado = (_a = _this.promocion()) === null || _a === void 0 ? void 0 : _a.estado;
            switch (estado) {
                case 'Activa': return 'success';
                case 'Inactiva': return 'warn';
                case 'Expirada': return 'danger';
                default: return 'secondary';
            }
        });
        /**
         * Calcula el texto amigable para el tiempo restante
         */
        this.diasRestantes = core_1.computed(function () {
            var promo = _this.promocion();
            if (!promo || !promo.fechaFin)
                return '-';
            var hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            var fin = new Date(promo.fechaFin);
            fin.setHours(0, 0, 0, 0);
            var diffTime = fin.getTime() - hoy.getTime();
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 0)
                return 'Expirada';
            if (diffDays === 0)
                return 'Vence hoy';
            return diffDays + " d\u00EDa" + (diffDays === 1 ? '' : 's');
        });
        /**
         * Calcula el porcentaje de avance entre la fecha inicio y fin
         */
        this.progresoVigencia = core_1.computed(function () {
            var promo = _this.promocion();
            if (!promo || !promo.fechaInicio || !promo.fechaFin)
                return 0;
            var inicio = new Date(promo.fechaInicio).getTime();
            var fin = new Date(promo.fechaFin).getTime();
            var hoy = Date.now();
            if (hoy <= inicio)
                return 0;
            if (hoy >= fin)
                return 100;
            var total = fin - inicio;
            var transcurrido = hoy - inicio;
            return Math.round((transcurrido / total) * 100);
        });
    }
    PromocionesDetalles.prototype.ngOnInit = function () {
        this.cargarDatos();
    };
    PromocionesDetalles.prototype.cargarDatos = function () {
        var _this = this;
        var id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.cargando.set(false);
            this.router.navigate(['/administracion/gestion-promociones']);
            return;
        }
        this.promocionesService.getPromocionById(Number(id)).subscribe({
            next: function (promo) {
                if (promo) {
                    _this.promocion.set(promo);
                }
                else {
                    _this.messageService.add({
                        severity: 'error',
                        summary: 'No encontrada',
                        detail: 'La promoción solicitada no existe.'
                    });
                }
                _this.cargando.set(false);
            },
            error: function (err) {
                console.error('Error cargando promoción:', err);
                _this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error de conexión con el servidor.'
                });
                _this.cargando.set(false);
            }
        });
    };
    PromocionesDetalles.prototype.irEditar = function () {
        var _a;
        var id = (_a = this.promocion()) === null || _a === void 0 ? void 0 : _a.id;
        if (id) {
            this.router.navigate(['/administracion/gestion-promociones/editar', id]);
        }
    };
    PromocionesDetalles.prototype.volver = function () {
        this.router.navigate(['/administracion/gestion-promociones']);
    };
    PromocionesDetalles.prototype.confirmarEliminar = function () {
        var _this = this;
        var promo = this.promocion();
        if (!promo)
            return;
        this.confirmationService.confirm({
            message: "\u00BFEst\u00E1s seguro de eliminar la promoci\u00F3n <b>" + promo.nombre + "</b>? Esta acci\u00F3n no se puede deshacer.",
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger p-button-text',
            rejectButtonStyleClass: 'p-button-text p-button-secondary',
            accept: function () { return _this.eliminar(promo.id); }
        });
    };
    PromocionesDetalles.prototype.eliminar = function (id) {
        var _this = this;
        this.promocionesService.deletePromocion(id).subscribe({
            next: function () {
                _this.messageService.add({
                    severity: 'success',
                    summary: 'Eliminado',
                    detail: 'Promoción eliminada con éxito'
                });
                // Pequeña pausa para que el usuario vea el Toast antes de redirigir
                setTimeout(function () { return _this.volver(); }, 1200);
            },
            error: function () {
                _this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo eliminar la promoción.'
                });
            }
        });
    };
    PromocionesDetalles = __decorate([
        core_1.Component({
            selector: 'app-promociones-detalles',
            standalone: true,
            imports: [
                common_1.CommonModule,
                common_1.DatePipe,
                common_1.DecimalPipe,
                common_1.CurrencyPipe,
                button_1.ButtonModule,
                card_1.CardModule,
                tag_1.TagModule,
                progressbar_1.ProgressBarModule,
                toast_1.ToastModule,
                confirmdialog_1.ConfirmDialogModule,
                tooltip_1.TooltipModule,
            ],
            providers: [api_1.MessageService, api_1.ConfirmationService],
            templateUrl: './promociones-detalles.html',
            styleUrl: './promociones-detalles.css'
        })
    ], PromocionesDetalles);
    return PromocionesDetalles;
}());
exports.PromocionesDetalles = PromocionesDetalles;
