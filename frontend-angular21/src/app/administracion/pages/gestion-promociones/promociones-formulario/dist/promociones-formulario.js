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
exports.__esModule = true;
exports.PromocionesFormulario = void 0;
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var forms_1 = require("@angular/forms");
var router_1 = require("@angular/router");
// PrimeNG
var button_1 = require("primeng/button");
var card_1 = require("primeng/card");
var inputtext_1 = require("primeng/inputtext");
var inputnumber_1 = require("primeng/inputnumber");
var select_1 = require("primeng/select");
var datepicker_1 = require("primeng/datepicker");
var textarea_1 = require("primeng/textarea");
var toast_1 = require("primeng/toast");
var confirmdialog_1 = require("primeng/confirmdialog");
var tooltip_1 = require("primeng/tooltip");
var api_1 = require("primeng/api");
var promociones_service_1 = require("../../../../core/services/promociones.service");
var PromocionesFormulario = /** @class */ (function () {
    function PromocionesFormulario() {
        var _this = this;
        this.fb = core_1.inject(forms_1.FormBuilder);
        this.route = core_1.inject(router_1.ActivatedRoute);
        this.router = core_1.inject(router_1.Router);
        this.promocionesService = core_1.inject(promociones_service_1.PromocionesService);
        this.messageService = core_1.inject(api_1.MessageService);
        this.confirmationService = core_1.inject(api_1.ConfirmationService);
        // ── Estado ──────────────────────────────────────────────────────────────
        this.isSubmitting = core_1.signal(false);
        this.esModoEdicion = core_1.signal(false);
        this.idPromocion = core_1.signal(null);
        // ── Opciones de Selects ──────────────────────────────────────────────────
        this.tiposPromocion = core_1.signal([
            { label: 'Porcentaje (%)', value: 'PORCENTAJE' },
            { label: 'Monto Fijo (S/)', value: 'MONTO_FIJO' },
        ]);
        this.tiposComprobante = core_1.signal([
            { label: 'Cualquiera', value: 'AMBOS' },
            { label: 'Solo Factura', value: '01' },
            { label: 'Solo Boleta', value: '03' },
        ]);
        // ── Formulario ───────────────────────────────────────────────────────────
        this.promocionForm = this.fb.group({
            codigo: ['', [forms_1.Validators.required, forms_1.Validators.minLength(3)]],
            descripcion: ['', [forms_1.Validators.required]],
            tipo_descuento: ['PORCENTAJE', [forms_1.Validators.required]],
            valor_descuento: [null, [forms_1.Validators.required, forms_1.Validators.min(0.01)]],
            fecha_inicio: [null, [forms_1.Validators.required]],
            fecha_fin: [null, [forms_1.Validators.required]],
            monto_minimo: [0],
            uso_maximo: [null],
            tipo_comprobante: ['AMBOS'],
            estado: [true]
        });
        // ── Computed ─────────────────────────────────────────────────────────────
        this.tituloKicker = core_1.computed(function () { return _this.esModoEdicion() ? 'ADMINISTRACIÓN - CAMPAÑAS' : 'ADMINISTRACIÓN - CAMPAÑAS'; });
        this.tituloPrincipal = core_1.computed(function () { return _this.esModoEdicion() ? 'Editar Promoción' : 'Crear Promoción'; });
        this.iconoCabecera = core_1.computed(function () { return _this.esModoEdicion() ? 'pi pi-pencil' : 'pi pi-plus'; });
        /** true cuando el tipo seleccionado es MONTO_FIJO */
        this.esModoMonto = core_1.computed(function () { var _a; return ((_a = _this.promocionForm.get('tipo_descuento')) === null || _a === void 0 ? void 0 : _a.value) === 'MONTO_FIJO'; });
    }
    // ── Lifecycle ────────────────────────────────────────────────────────────
    PromocionesFormulario.prototype.ngOnInit = function () {
        var _this = this;
        var _a;
        var id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.esModoEdicion.set(true);
            this.idPromocion.set(id);
            this.cargarDatosPromocion(id);
        }
        // Resetear valor_descuento al cambiar tipo para evitar valores inválidos
        (_a = this.promocionForm.get('tipo_descuento')) === null || _a === void 0 ? void 0 : _a.valueChanges.subscribe(function () {
            _this.promocionForm.patchValue({ valor_descuento: null });
        });
    };
    // ── Métodos ──────────────────────────────────────────────────────────────
    PromocionesFormulario.prototype.cargarDatosPromocion = function (id) {
        var promo = this.promocionesService.getPromocionPorId(id);
        if (promo) {
            this.promocionForm.patchValue(__assign(__assign({}, promo), { fecha_inicio: new Date(promo.fecha_inicio), fecha_fin: new Date(promo.fecha_fin) }));
        }
        else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Promoción no encontrada'
            });
            this.cancelar();
        }
    };
    PromocionesFormulario.prototype.guardarPromocion = function () {
        var _this = this;
        if (this.promocionForm.invalid) {
            this.promocionForm.markAllAsTouched();
            return;
        }
        this.isSubmitting.set(true);
        var formValue = this.promocionForm.value;
        // Simula llamada asíncrona al servicio
        setTimeout(function () {
            if (_this.esModoEdicion()) {
                _this.promocionesService.actualizarPromocion(_this.idPromocion(), formValue);
                _this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Promoción actualizada correctamente'
                });
            }
            else {
                _this.promocionesService.crearPromocion(formValue);
                _this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Promoción creada correctamente'
                });
            }
            _this.isSubmitting.set(false);
            setTimeout(function () { return _this.cancelar(); }, 1000);
        }, 800);
    };
    PromocionesFormulario.prototype.cancelar = function () {
        this.router.navigate(['/administracion/promociones-listado']);
    };
    PromocionesFormulario = __decorate([
        core_1.Component({
            selector: 'app-promociones-formulario',
            standalone: true,
            imports: [
                common_1.CommonModule,
                forms_1.ReactiveFormsModule,
                button_1.ButtonModule,
                card_1.CardModule,
                inputtext_1.InputTextModule,
                inputnumber_1.InputNumberModule,
                select_1.SelectModule,
                datepicker_1.DatePickerModule,
                textarea_1.TextareaModule,
                toast_1.ToastModule,
                confirmdialog_1.ConfirmDialogModule,
                tooltip_1.TooltipModule,
            ],
            providers: [api_1.MessageService, api_1.ConfirmationService],
            templateUrl: './promociones-formulario.html',
            styleUrl: './promociones-formulario.css'
        })
    ], PromocionesFormulario);
    return PromocionesFormulario;
}());
exports.PromocionesFormulario = PromocionesFormulario;
