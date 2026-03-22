import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { CommissionService } from '../../../services/commission.service';
import { ProductoService } from '../../../services/producto.service';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
  selector: 'app-comision-regla',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    CardModule, ButtonModule, InputTextModule, InputNumberModule,
    SelectModule, DatePickerModule, ToastModule, TooltipModule, TagModule,
  ],
  templateUrl: './comisionregla.html',
  styleUrls: ['./comisionregla.css'],
})
export class ComisionRegla implements OnInit {
  private readonly fb                = inject(FormBuilder);
  private readonly router            = inject(Router);
  private readonly route             = inject(ActivatedRoute);
  private readonly commissionService = inject(CommissionService);
  private readonly productoService   = inject(ProductoService);
  private readonly categoriaService  = inject(CategoriaService);
  private readonly messageService    = inject(MessageService);

  readonly isSubmitting   = signal(false);
  readonly cargandoObjeto = signal(false);
  readonly cargandoDatos  = signal(false);

  // ── Modo dual ─────────────────────────────────────────────────────────────
  readonly idRegla       = signal<number | null>(null);
  readonly esModoEdicion = computed(() => this.idRegla() !== null);

  get tituloKicker(): string {
    return this.esModoEdicion() ? 'EDITAR REGLA DE COMISIÓN' : 'NUEVA REGLA DE COMISIÓN';
  }

  // ── Opciones ──────────────────────────────────────────────────────────────
  tiposObjetivo = [
    { label: 'Producto',  value: 'PRODUCTO'  },
    { label: 'Categoría', value: 'CATEGORIA' },
  ];

  tiposRecompensa = [
    { label: 'Porcentaje (%)',  value: 'PORCENTAJE' },
    { label: 'Monto Fijo (S/)', value: 'MONTO_FIJO' },
  ];

  readonly productos        = signal<{ label: string; value: number }[]>([]);
  readonly categorias       = signal<{ label: string; value: number }[]>([]);
  readonly objetivoOpciones = signal<{ label: string; value: number }[]>([]);

  // ── Formulario ────────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    nombre:           ['', [Validators.required, Validators.maxLength(100)]],
    descripcion:      ['', Validators.maxLength(255)],
    tipo_objetivo:    ['PRODUCTO', Validators.required],
    id_objetivo:      [null, Validators.required],
    meta_unidades:    [1, [Validators.required, Validators.min(1)]],
    tipo_recompensa:  ['PORCENTAJE', Validators.required],
    valor_recompensa: [null, [Validators.required, Validators.min(0.01)]],
    fecha_inicio:     [new Date(), Validators.required],
    fecha_fin:        [null],
  });

  get labelObjetivo(): string {
    return this.form.get('tipo_objetivo')?.value === 'CATEGORIA'
      ? 'Categoría objetivo' : 'Producto objetivo';
  }

  get labelValor(): string {
    return this.form.get('tipo_recompensa')?.value === 'PORCENTAJE'
      ? 'Porcentaje (%)' : 'Monto fijo (S/)';
  }

  get maxValor(): number {
    return this.form.get('tipo_recompensa')?.value === 'PORCENTAJE' ? 100 : 999999;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) this.idRegla.set(Number(idParam));

    this.categoriaService.loadCategorias().subscribe({
      next: () => {
        this.categorias.set(
          this.categoriaService.categorias().map(c => ({ label: c.nombre, value: c.id_categoria }))
        );
        this._cargarObjetivos(this.form.get('tipo_objetivo')?.value ?? 'PRODUCTO');
      },
    });

    this.form.get('tipo_objetivo')?.valueChanges.subscribe((tipo: string) => {
      this.form.get('id_objetivo')?.setValue(null);
      this._cargarObjetivos(tipo);
    });

    if (this.esModoEdicion()) {
      this._cargarRegla(this.idRegla()!);
    }
  }

  private _cargarObjetivos(tipo: string) {
    if (tipo === 'CATEGORIA') {
      this.objetivoOpciones.set(this.categorias());
    } else {
      this.cargandoObjeto.set(true);
      this.productoService.getProductos(1, 1000, true).subscribe({
        next: (resp) => {
          this.cargandoObjeto.set(false);
          const lista = resp.products.map(p => ({
            label: `${p.codigo} — ${p.descripcion}`,
            value: p.id_producto,
          }));
          this.productos.set(lista);
          this.objetivoOpciones.set(lista);
        },
        error: () => { this.cargandoObjeto.set(false); this.objetivoOpciones.set([]); },
      });
    }
  }

  private _cargarRegla(id: number) {
    this.cargandoDatos.set(true);
    const enCache = this.commissionService.rules().find(r => r.id_regla === id);

    if (enCache) {
      this._patchForm(enCache);
      this.cargandoDatos.set(false);
    } else {
      this.commissionService.loadRules().subscribe({
        next: () => {
          const regla = this.commissionService.rules().find(r => r.id_regla === id);
          if (regla) {
            this._patchForm(regla);
          } else {
            this.messageService.add({
              severity: 'error', summary: 'Regla no encontrada',
              detail: 'No se pudo cargar la regla.', life: 5000,
            });
            this.router.navigate(['/admin/comision']);
          }
          this.cargandoDatos.set(false);
        },
        error: () => {
          this.cargandoDatos.set(false);
          this.messageService.add({
            severity: 'error', summary: 'Error', detail: 'No se pudo obtener la regla.', life: 5000,
          });
        },
      });
    }
  }

  private _patchForm(regla: any) {
    this.form.patchValue({ tipo_objetivo: regla.tipo_objetivo });
    this._cargarObjetivosYPatch(regla);
  }

  private _cargarObjetivosYPatch(regla: any) {
    const patch = () => {
      this.form.patchValue({
        nombre:           regla.nombre,
        descripcion:      regla.descripcion ?? '',
        tipo_objetivo:    regla.tipo_objetivo,
        id_objetivo:      regla.id_objetivo,
        meta_unidades:    regla.meta_unidades,
        tipo_recompensa:  regla.tipo_recompensa,
        valor_recompensa: Number(regla.valor_recompensa),
        fecha_inicio:     regla.fecha_inicio ? new Date(regla.fecha_inicio) : new Date(),
        fecha_fin:        regla.fecha_fin    ? new Date(regla.fecha_fin)    : null,
      });
    };

    if (regla.tipo_objetivo === 'CATEGORIA') {
      this.objetivoOpciones.set(this.categorias());
      patch();
    } else {
      this.cargandoObjeto.set(true);
      this.productoService.getProductos(1, 1000, true).subscribe({
        next: (resp) => {
          const lista = resp.products.map(p => ({
            label: `${p.codigo} — ${p.descripcion}`,
            value: p.id_producto,
          }));
          this.productos.set(lista);
          this.objetivoOpciones.set(lista);
          this.cargandoObjeto.set(false);
          patch();
        },
        error: () => { this.cargandoObjeto.set(false); patch(); },
      });
    }
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn', summary: 'Formulario incompleto',
        detail: 'Revisa los campos obligatorios.', life: 4000,
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const dto = {
      nombre:           raw.nombre.trim(),
      descripcion:      raw.descripcion?.trim() || undefined,
      tipo_objetivo:    raw.tipo_objetivo,
      id_objetivo:      raw.id_objetivo,
      meta_unidades:    raw.meta_unidades,
      tipo_recompensa:  raw.tipo_recompensa,
      valor_recompensa: raw.valor_recompensa,
      fecha_inicio:     raw.fecha_inicio instanceof Date
                          ? raw.fecha_inicio.toISOString().split('T')[0]
                          : raw.fecha_inicio,
      fecha_fin:        raw.fecha_fin
                          ? (raw.fecha_fin instanceof Date
                              ? raw.fecha_fin.toISOString().split('T')[0]
                              : raw.fecha_fin)
                          : undefined,
    };

    // ── Edición → PUT, Creación → POST ────────────────────────────────────
    const req$ = this.esModoEdicion()
      ? this.commissionService.updateRule(this.idRegla()!, dto)
      : raw.tipo_objetivo === 'PRODUCTO'
        ? this.commissionService.createProductRule(dto)
        : this.commissionService.createCategoryRule(dto);

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  this.esModoEdicion() ? 'Regla actualizada' : 'Regla creada',
          detail:   this.esModoEdicion()
            ? 'Los cambios fueron guardados correctamente.'
            : 'La regla de comisión fue registrada exitosamente.',
          life: 2500,
        });
        setTimeout(() => this.router.navigate(['/admin/comision']), 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al guardar',
          detail: err?.error?.message ?? 'No se pudo guardar la regla.', life: 5000,
        });
      },
    });
  }

  cancelar() {
    this.router.navigate(['/admin/comision']);
  }
}