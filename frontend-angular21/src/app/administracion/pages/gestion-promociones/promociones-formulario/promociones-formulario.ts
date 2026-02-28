import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PromocionesService, Promocion } from '../../../../core/services/promociones.service';

@Component({
  selector: 'app-promociones-formulario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './promociones-formulario.html',
  styleUrl: './promociones-formulario.css',
})
export class PromocionesFormulario implements OnInit {
  private fb                  = inject(FormBuilder);
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private promocionesService  = inject(PromocionesService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Estado ──────────────────────────────────────────────────────────────
  isSubmitting = signal(false);
  esModoEdicion = signal(false);
  idPromocion = signal<string | null>(null);

  // ── Opciones de Selects ──────────────────────────────────────────────────
  tiposPromocion = signal([
    { label: 'Porcentaje (%)',  value: 'PORCENTAJE' },
    { label: 'Monto Fijo (S/)', value: 'MONTO_FIJO' },
  ]);

  tiposComprobante = signal([
    { label: 'Cualquiera',    value: 'AMBOS' },
    { label: 'Solo Factura',  value: '01' },
    { label: 'Solo Boleta',   value: '03' },
  ]);

  // ── Formulario ───────────────────────────────────────────────────────────
  promocionForm: FormGroup = this.fb.group({
    codigo:          ['', [Validators.required, Validators.minLength(3)]],
    descripcion:     ['', [Validators.required]],
    tipo_descuento:  ['PORCENTAJE', [Validators.required]],
    valor_descuento: [null, [Validators.required, Validators.min(0.01)]],
    fecha_inicio:    [null, [Validators.required]],
    fecha_fin:       [null, [Validators.required]],
    monto_minimo:    [0],
    uso_maximo:      [null],
    tipo_comprobante:['AMBOS'],
    estado:          [true],
  });

  // ── Computed ─────────────────────────────────────────────────────────────
  tituloKicker   = computed(() => this.esModoEdicion() ? 'ADMINISTRACIÓN - CAMPAÑAS' : 'ADMINISTRACIÓN - CAMPAÑAS');
  tituloPrincipal = computed(() => this.esModoEdicion() ? 'Editar Promoción' : 'Crear Promoción');
  iconoCabecera  = computed(() => this.esModoEdicion() ? 'pi pi-pencil' : 'pi pi-plus');

  /** true cuando el tipo seleccionado es MONTO_FIJO */
  esModoMonto = computed(() =>
    this.promocionForm.get('tipo_descuento')?.value === 'MONTO_FIJO'
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esModoEdicion.set(true);
      this.idPromocion.set(id);
      this.cargarDatosPromocion(id);
    }

    // Resetear valor_descuento al cambiar tipo para evitar valores inválidos
    this.promocionForm.get('tipo_descuento')?.valueChanges.subscribe(() => {
      this.promocionForm.patchValue({ valor_descuento: null });
    });
  }

  // ── Métodos ──────────────────────────────────────────────────────────────
  cargarDatosPromocion(id: string): void {
    const promo = this.promocionesService.getPromocionPorId(id);

    if (promo) {
      this.promocionForm.patchValue({
        ...promo,
        fecha_inicio: new Date(promo.fecha_inicio),
        fecha_fin:    new Date(promo.fecha_fin),
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'Promoción no encontrada',
      });
      this.cancelar();
    }
  }

  guardarPromocion(): void {
    if (this.promocionForm.invalid) {
      this.promocionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.promocionForm.value;

    // Simula llamada asíncrona al servicio
    setTimeout(() => {
      if (this.esModoEdicion()) {
        this.promocionesService.actualizarPromocion(this.idPromocion()!, formValue);
        this.messageService.add({
          severity: 'success',
          summary:  'Éxito',
          detail:   'Promoción actualizada correctamente',
        });
      } else {
        this.promocionesService.crearPromocion(formValue);
        this.messageService.add({
          severity: 'success',
          summary:  'Éxito',
          detail:   'Promoción creada correctamente',
        });
      }

      this.isSubmitting.set(false);
      setTimeout(() => this.cancelar(), 1000);
    }, 800);
  }

  cancelar(): void {
    this.router.navigate(['/administracion/promociones-listado']);
  }
}