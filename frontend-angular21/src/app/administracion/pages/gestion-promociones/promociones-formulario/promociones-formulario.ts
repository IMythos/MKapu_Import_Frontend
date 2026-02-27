import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ButtonModule }        from 'primeng/button';
import { CardModule }          from 'primeng/card';
import { InputTextModule }     from 'primeng/inputtext';
import { InputNumberModule }   from 'primeng/inputnumber';
import { SelectModule }        from 'primeng/select';
import { ToastModule }         from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule }       from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PromotionsService } from '../../../services/promotions.service';
import { CategoriaService }  from '../../../services/categoria.service';
import { CategoriaResponse } from '../../../interfaces/categoria.interface';

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
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './promociones-formulario.html',
  styleUrl:    './promociones-formulario.css',
})
export class PromocionesFormulario implements OnInit {
  private fb                  = inject(FormBuilder);
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private promotionsService   = inject(PromotionsService);
  private categoriaService    = inject(CategoriaService);
  private messageService      = inject(MessageService);

  // ── Estado ───────────────────────────────────────────────────────────────
  isSubmitting      = signal(false);
  esModoEdicion     = signal(false);
  idPromocion       = signal<number | null>(null);
  mostrarInputValor = signal(true);

  // ── Catálogos ─────────────────────────────────────────────────────────────
  tiposPromocion = [
    { label: 'Porcentaje (%)',  value: 'PORCENTAJE' },
    { label: 'Monto Fijo (S/)', value: 'MONTO' },
  ];

  tiposCondicion = [
    { label: 'Mínimo de compra',   value: 'MINIMO_COMPRA' },
    { label: 'Cliente nuevo',      value: 'CLIENTE_NUEVO' },
    { label: 'Categoría',          value: 'CATEGORIA' },
    { label: 'Código de producto', value: 'PRODUCTO' },
  ];

  categorias = signal<{ label: string; value: string }[]>([]);

  // ── Formulario ───────────────────────────────────────────────────────────
  // NOTA: reglas y descuentosAplicados NO tienen validators en el FormArray
  // porque son secciones opcionales; la validación se hace en guardar()
  form: FormGroup = this.fb.group({
    concepto: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    tipo:     ['PORCENTAJE', [Validators.required]],
    valor:    [null, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    activo:   [true],
    reglas:             this.fb.array([]),
    descuentosAplicados: this.fb.array([]),
  });

  get reglas():    FormArray { return this.form.get('reglas') as FormArray; }
  get descuentos():FormArray { return this.form.get('descuentosAplicados') as FormArray; }

  // ── Signals ───────────────────────────────────────────────────────────────
  tituloPrincipal = computed(() => this.esModoEdicion() ? 'Editar Promoción' : 'Crear Promoción');
  iconoCabecera   = computed(() => this.esModoEdicion() ? 'pi pi-pencil' : 'pi pi-plus');
  esModoMonto     = signal(false);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarCategorias();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.esModoEdicion.set(true);
      this.idPromocion.set(id);
      this.cargarPromocion(id);
    }

    this.form.get('tipo')?.valueChanges.subscribe((tipo) => {
      this.esModoMonto.set(tipo === 'MONTO');
      this.reconstruirControlValor(tipo);
    });
  }

  // ── Reconstruye p-inputNumber desde cero al cambiar tipo ─────────────────
  private reconstruirControlValor(tipo: string, valorInicial: number | null = null): void {
    const validators = tipo === 'MONTO'
      ? [Validators.required, Validators.min(0.01)]
      : [Validators.required, Validators.min(0.01), Validators.max(100)];

    this.mostrarInputValor.set(false);
    this.form.setControl('valor', this.fb.control(valorInicial, validators));
    setTimeout(() => this.mostrarInputValor.set(true), 0);
  }

  // ── Carga categorías ──────────────────────────────────────────────────────
  private cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (res: CategoriaResponse) => {
        this.categorias.set(
          (res.categories ?? []).map(c => ({
            label: c.nombre,
            value: String(c.id_categoria),
          }))
        );
      },
      error: () => {}
    });
  }

  // ── Carga edición ─────────────────────────────────────────────────────────
  private cargarPromocion(id: number): void {
    this.promotionsService.getPromotionById(id).subscribe({
      next: promo => {
        this.esModoMonto.set(promo.tipo === 'MONTO');
        this.reconstruirControlValor(promo.tipo, promo.valor);
        this.form.patchValue({
          concepto: promo.concepto,
          tipo:     promo.tipo,
          activo:   promo.activo,
        });
        promo.reglas.forEach(r => this.agregarRegla(r.tipoCondicion, r.valorCondicion));
        promo.descuentosAplicados.forEach(d => this.agregarDescuento(d.monto, d.idDescuento));
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la promoción' });
        this.cancelar();
      },
    });
  }

  // ── Reglas ────────────────────────────────────────────────────────────────
  // Sin Validators.required para no bloquear el form; se valida en guardar()
  agregarRegla(tipoCondicion = '', valorCondicion: any = ''): void {
    this.reglas.push(this.fb.group({
      tipoCondicion:  [tipoCondicion],
      valorCondicion: [valorCondicion],
    }));
  }

  eliminarRegla(i: number): void { this.reglas.removeAt(i); }

  tipoRegla(i: number): string {
    return this.reglas.at(i).get('tipoCondicion')?.value ?? '';
  }

  onTipoCondicionChange(i: number): void {
    this.reglas.at(i).patchValue({ valorCondicion: '' });
  }

  // ── Descuentos aplicados ──────────────────────────────────────────────────
  agregarDescuento(monto: number | null = null, idDescuento?: number): void {
    this.descuentos.push(this.fb.group({
      idDescuento: [idDescuento ?? null],
      monto:       [monto, [Validators.required, Validators.min(0.01)]],
    }));
  }

  eliminarDescuento(i: number): void { this.descuentos.removeAt(i); }

  // ── Validación manual de reglas ───────────────────────────────────────────
  private validarReglas(): boolean {
    for (let i = 0; i < this.reglas.length; i++) {
      const r = this.reglas.at(i);
      const tipo  = r.get('tipoCondicion')?.value;
      const valor = r.get('valorCondicion')?.value;

      if (!tipo) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Regla incompleta',
          detail: `La regla #${i + 1} no tiene tipo de condición seleccionado`,
        });
        return false;
      }

      // CLIENTE_NUEVO no necesita valor — el backend recibe 'true' automáticamente
      if (tipo !== 'CLIENTE_NUEVO' && (valor === null || valor === '' || valor === undefined || valor === 0)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Regla incompleta',
          detail: `La regla #${i + 1} requiere un valor`,
        });
        return false;
      }
    }
    return true;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.validarReglas()) return;

    this.isSubmitting.set(true);

    const v = this.form.value;
    const payload = {
      concepto: v.concepto,
      tipo:     v.tipo,
      valor:    Number(v.valor),
      activo:   v.activo,
      reglas: v.reglas
        .filter((r: any) => r.tipoCondicion) // descartar reglas sin tipo
        .map((r: any) => ({
          tipoCondicion:  r.tipoCondicion,
          // CLIENTE_NUEVO no tiene input pero el backend requiere un valor no vacío
          valorCondicion: r.tipoCondicion === 'CLIENTE_NUEVO'
            ? 'true'
            : String(r.valorCondicion ?? ''),
        })),
      descuentosAplicados: v.descuentosAplicados
        .filter((d: any) => d.monto > 0)
        .map((d: any) => ({
          ...(d.idDescuento ? { idDescuento: d.idDescuento } : {}),
          monto: Number(d.monto),
        })),
    };

    const req$ = this.esModoEdicion()
      ? this.promotionsService.updatePromotion(this.idPromocion()!, payload)
      : this.promotionsService.createPromotion(payload);

    req$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.esModoEdicion() ? 'Promoción actualizada' : 'Promoción creada',
        });
        this.isSubmitting.set(false);
        setTimeout(() => this.cancelar(), 1000);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la promoción' });
        this.isSubmitting.set(false);
      },
    });
  }

  cancelar(): void { this.router.navigate(['/admin/promociones']); }
}