import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { QuoteService } from '../../../services/quote.service';
import { SedeService } from '../../../services/sede.service';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { TagModule } from 'primeng/tag';
import { ProductoService } from '../../../services/producto.service';
import { ProductoAutocomplete } from '../../../interfaces/producto.interface';
import { SedeAlmacenService } from '../../../services/sede-almacen.service';
import { ProveedorService } from '../../../services/proveedor.service';
import { SupplierResponse, CreateSupplierRequest } from '../../../interfaces/supplier.interface';

interface DetalleItem {
  id_prod_ref: number;
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  precio:      number;
  importe:     number;
  uni_med:     string;
  tipoPrecio:  'unitario' | 'mayor' | 'caja';
  pre_unit:    number;
  pre_may:     number;
  pre_caja:    number;
  almacen:     string;
  stock:       number;
}

@Component({
  selector: 'app-cotizacion-compra-formulario',
  standalone: true,
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    CardModule,
    SelectModule,
    ConfirmDialogModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    DividerModule,
    TooltipModule,
    DatePickerModule,
    TagModule,
  ],
  templateUrl: './cotizacion-compra-formulario.html',
  styleUrl: './cotizacion-compra-formulario.css',
})
export class CotizacionCompraFormulario implements OnInit {
  public iconoCabecera = 'pi pi-truck';
  public tituloKicker  = 'ADMINISTRACIÓN';

  get subtituloKicker(): string {
    return this.esModoEdicion() ? 'EDITAR COTIZACIÓN DE COMPRA' : 'NUEVA COTIZACIÓN DE COMPRA';
  }

  private fb                          = inject(FormBuilder);
  private router                      = inject(Router);
  private route                       = inject(ActivatedRoute);
  private quoteService                = inject(QuoteService);
  private sedeService                 = inject(SedeService);
  private productoService             = inject(ProductoService);
  private proveedorService            = inject(ProveedorService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private messageService              = inject(MessageService);

  private getSedeUsuarioActual(): number | null {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.idSede ?? null;
      }
    } catch (e) { console.error('Error parseando usuario', e); }
    return null;
  }

  // ── Signals ───────────────────────────────────────────────────────────────
  isSubmitting          = signal(false);
  esModoEdicion         = signal(false);
  sedes                 = signal<any[]>([]);
  sedeSeleccionada      = signal<any | null>(null);
  productosAutoComplete = signal<ProductoAutocomplete[]>([]);
  cargandoProducto      = signal(false);
  detalles              = signal<DetalleItem[]>([]);
  almacenSeleccionado   = signal<number | null>(null);
  almacenesOptions      = signal<{ label: string; value: number }[]>([]);

  // ── Proveedor signals ─────────────────────────────────────────────────────
  proveedorEncontrado   = signal<SupplierResponse | null>(null);
  busquedaProvSinResult = signal(false);
  cargandoProveedor     = signal(false);
  rucQuery              = signal('');
  sugerenciasRUC        = signal<SupplierResponse[]>([]);
  mostrarSugerencias    = signal(false);
  mostrarFormNuevo      = signal(false);

  busquedaProductoVal = '';

  readonly manana: Date = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d;
  })();

  estadoOptions = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada',  value: 'APROBADA'  },
    { label: 'Rechazada', value: 'RECHAZADA' },
  ];

  tipoPrecioOpciones = (item: DetalleItem) => {
    const opciones = [];
    if (item.pre_unit > 0) opciones.push({ label: `Unitario  S/ ${item.pre_unit.toFixed(2)}`, value: 'unitario' });
    if (item.pre_may  > 0) opciones.push({ label: `Mayor     S/ ${item.pre_may.toFixed(2)}`,  value: 'mayor'    });
    if (item.pre_caja > 0) opciones.push({ label: `Caja      S/ ${item.pre_caja.toFixed(2)}`, value: 'caja'     });
    if (opciones.length === 0) opciones.push({ label: 'Unitario  S/ 0.00', value: 'unitario' });
    return opciones;
  };

  // ── Formularios ───────────────────────────────────────────────────────────
  form: FormGroup = this.fb.group({
    id_proveedor: [null],
    ruc:          ['', Validators.required],
    fec_emision:  [{ value: new Date(), disabled: true }, Validators.required],
    fec_venc:     [null, Validators.required],
    sede:         [null, Validators.required],
    id_almacen:   [null],
    estado:       [{ value: 'PENDIENTE', disabled: true }, Validators.required],
  });

  nuevoProveedorForm: FormGroup = this.fb.group({
    razon_social: ['', Validators.required],
    ruc:          ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    contacto:     [''],
    email:        ['', Validators.email],
    telefono:     [''],
    dir_fiscal:   [''],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.sedeService.loadSedes().subscribe({
      next: () => {
        this.sedes.set(this.sedeService.sedes());
        const idSedeUsuario = this.getSedeUsuarioActual();
        if (idSedeUsuario) {
          const sedeMatch = this.sedes().find(s => s.id_sede === idSedeUsuario);
          if (sedeMatch) {
            this.form.get('sede')?.setValue(idSedeUsuario, { emitEvent: true });
          }
        }
      },
      error: () => {
        this.sedes.set([]);
        this.messageService.add({
          severity: 'error', summary: 'Error al cargar sedes',
          detail: 'No se pudieron obtener las sedes. Recarga la página.', life: 5000,
        });
      },
    });

    this.form.get('sede')?.valueChanges.subscribe((id_sede: number) => {
      this.almacenSeleccionado.set(null);
      this.almacenesOptions.set([]);
      this.form.get('id_almacen')?.setValue(null, { emitEvent: false });
      this.productosAutoComplete.set([]);
      this.busquedaProductoVal = '';
      this.sedeSeleccionada.set(null);

      if (!id_sede) return;

      this.sedeService.getSedeById(id_sede).subscribe({
        next:  (sede) => this.sedeSeleccionada.set(sede),
        error: () => this.sedeSeleccionada.set(null),
      });

      this.sedeAlmacenService.loadWarehouseOptionsBySede(id_sede).subscribe({
        next: (options) => {
          this.almacenesOptions.set(options);
          if (options.length > 0) {
            this.almacenSeleccionado.set(options[0].value);
            this.form.get('id_almacen')?.setValue(options[0].value, { emitEvent: false });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'warn', summary: 'Almacenes no disponibles',
            detail: 'No se pudieron cargar los almacenes de esta sede.', life: 4000,
          });
        },
      });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esModoEdicion.set(true);
      this.form.get('estado')?.enable();

      this.quoteService.getQuoteById(Number(id)).subscribe({
        next: (cot) => {
          this.form.patchValue({
            ruc:         cot.proveedor?.ruc ?? '',
            sede:        cot.id_sede,
            estado:      cot.estado,
            fec_venc:    cot.fec_venc    ? new Date(cot.fec_venc)    : null,
            fec_emision: cot.fec_emision ? new Date(cot.fec_emision) : new Date(),
          });

          if (cot.id_sede) {
            this.sedeAlmacenService.loadWarehouseOptionsBySede(cot.id_sede).subscribe({
              next: (options) => {
                this.almacenesOptions.set(options);
                const idAlmacen = (cot as any).id_almacen ?? null;
                if (idAlmacen) {
                  this.almacenSeleccionado.set(idAlmacen);
                  this.form.get('id_almacen')?.setValue(idAlmacen, { emitEvent: false });
                } else if (options.length > 0) {
                  this.almacenSeleccionado.set(options[0].value);
                  this.form.get('id_almacen')?.setValue(options[0].value, { emitEvent: false });
                }
              },
              error: () => {},
            });
          }

          if (cot.proveedor) {
            const p = cot.proveedor;
            const prov: SupplierResponse = {
              id_proveedor: Number(p.id),
              razon_social: p.razon_social,
              ruc:          p.ruc,
              contacto:     p.contacto ?? undefined,
              email:        p.email    ?? undefined,
              telefono:     p.telefono ?? undefined,
              estado:       true,
            };
            this.proveedorEncontrado.set(prov);
            this.rucQuery.set(p.ruc);
            this.form.get('ruc')?.setValue(p.ruc, { emitEvent: false });
            this.form.get('id_proveedor')?.setValue(Number(p.id), { emitEvent: false });
          }

          if (cot.detalles?.length) {
            this.detalles.set(cot.detalles.map(d => ({
              id_prod_ref: d.id_prod_ref,
              cod_prod:    d.cod_prod,
              descripcion: d.descripcion,
              cantidad:    d.cantidad,
              precio:      d.precio,
              importe:     d.cantidad * d.precio,
              uni_med:     '',
              tipoPrecio:  'unitario' as const,
              pre_unit:    d.precio,
              pre_may:     0,
              pre_caja:    0,
              almacen:     '',
              stock:       0,
            })));
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error', summary: 'Error al cargar cotización',
            detail: 'No se pudo obtener la cotización. Intenta de nuevo.', life: 5000,
          });
        },
      });
    }
  }

  // ── Proveedor — Autocomplete ──────────────────────────────────────────────

  /** Llamado en cada (input) del campo RUC */
  onRucInput(event: Event) {
    const val = (event.target as HTMLInputElement).value.trim();
    this.rucQuery.set(val);
    this.form.get('ruc')?.setValue(val, { emitEvent: false });
    this.mostrarFormNuevo.set(false);
    this.busquedaProvSinResult.set(false);

    if (val.length < 3) {
      this.sugerenciasRUC.set([]);
      this.mostrarSugerencias.set(false);
      this._limpiarProveedor();
      return;
    }

    this.cargandoProveedor.set(true);
    this.proveedorService.listSuppliers({ search: val }).subscribe({
      next: (resp) => {
        this.cargandoProveedor.set(false);
        this.sugerenciasRUC.set(resp.suppliers.slice(0, 8));
        this.mostrarSugerencias.set(resp.suppliers.length > 0);

        // RUC completo sin resultados → ofrecer alta
        if (resp.suppliers.length === 0 && val.length === 11) {
          this.busquedaProvSinResult.set(true);
          this.nuevoProveedorForm.patchValue({ ruc: val });
        }
      },
      error: () => {
        this.cargandoProveedor.set(false);
        this.sugerenciasRUC.set([]);
        this.mostrarSugerencias.set(false);
      },
    });
  }

  /** Selecciona un proveedor del dropdown */
  seleccionarProveedor(prov: SupplierResponse) {
    this.proveedorEncontrado.set(prov);
    this.busquedaProvSinResult.set(false);
    this.mostrarSugerencias.set(false);
    this.mostrarFormNuevo.set(false);
    this.sugerenciasRUC.set([]);
    this.rucQuery.set(prov.ruc);
    this.form.get('ruc')?.setValue(prov.ruc, { emitEvent: false });
    this.form.get('id_proveedor')?.setValue(prov.id_proveedor, { emitEvent: false });
    this.messageService.add({
      severity: 'success', summary: 'Proveedor seleccionado',
      detail: prov.razon_social, life: 2500,
    });
  }

  /** Abre el mini-formulario de alta rápida */
  abrirFormNuevoProveedor() {
    this.mostrarSugerencias.set(false);
    this.mostrarFormNuevo.set(true);
    this.nuevoProveedorForm.patchValue({ ruc: this.rucQuery() });
  }

  /** Cierra el dropdown al salir del input (blur) */
  cerrarSugerencias() {
    setTimeout(() => this.mostrarSugerencias.set(false), 180);
  }

  /** Registra el nuevo proveedor y lo selecciona */
  registrarNuevoProveedor() {
    if (this.nuevoProveedorForm.invalid) {
      this.nuevoProveedorForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn', summary: 'Datos incompletos',
        detail: 'Completa todos los campos obligatorios del proveedor.', life: 4000,
      });
      return;
    }

    const ruc = this.rucQuery();
    const payload: CreateSupplierRequest = { ...this.nuevoProveedorForm.value, ruc };

    this.proveedorService.createSupplier(payload).subscribe({
      next: (prov) => {
        this.seleccionarProveedor(prov);
        this.mostrarFormNuevo.set(false);
        this.nuevoProveedorForm.reset();
        this.messageService.add({
          severity: 'success', summary: 'Proveedor registrado',
          detail: 'El proveedor fue creado y cargado en la cotización.', life: 3000,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error', summary: 'Error al registrar proveedor',
          detail: err?.error?.message ?? err?.message ?? 'No se pudo registrar el proveedor.',
          life: 5000,
        });
      },
    });
  }

  // ── Productos ─────────────────────────────────────────────────────────────
  buscarProducto(query: string) {
    const idSede = this.form.get('sede')?.value;
    if (!query || query.length < 2 || !idSede) {
      this.productosAutoComplete.set([]);
      return;
    }

    this.cargandoProducto.set(true);
    this.productoService.getProductosAutocomplete(query, idSede).subscribe({
      next: (resp) => {
        this.cargandoProducto.set(false);
        const productos = resp.data ?? [];
        this.productosAutoComplete.set(productos);
        if (productos.length === 0) {
          this.messageService.add({
            severity: 'info', summary: 'Sin resultados',
            detail: `No se encontraron productos con "${query}".`, life: 3000,
          });
        }
      },
      error: () => {
        this.cargandoProducto.set(false);
        this.productosAutoComplete.set([]);
        this.messageService.add({
          severity: 'error', summary: 'Error al buscar producto',
          detail: 'No se pudo realizar la búsqueda. Intenta de nuevo.', life: 4000,
        });
      },
    });
  }

  agregarProducto(prod: ProductoAutocomplete) {
    const existe = this.detalles().find(d => d.id_prod_ref === prod.id_producto);
    if (existe) {
      this.detalles.update(items =>
        items.map(d => d.id_prod_ref === prod.id_producto
          ? { ...d, cantidad: d.cantidad + 1, importe: (d.cantidad + 1) * d.precio }
          : d
        )
      );
      this.busquedaProductoVal = '';
      this.productosAutoComplete.set([]);
      this.messageService.add({
        severity: 'info', summary: 'Cantidad actualizada',
        detail: `Se incrementó la cantidad de "${prod.nombre}".`, life: 2500,
      });
      return;
    }

    const idSede = this.form.get('sede')?.value;
    this.cargandoProducto.set(true);

    this.productoService.getProductoDetalleStock(prod.id_producto, idSede).subscribe({
      next: (resp) => {
        this.cargandoProducto.set(false);
        const p = resp.producto;
        const s = resp.stock;

        const nombreAlmacen = this.almacenesOptions()
          .find(a => a.value === s?.id_almacen)?.label ?? s?.sede ?? '';

        this.detalles.update(items => [...items, {
          id_prod_ref: prod.id_producto,
          cod_prod:    prod.codigo,
          descripcion: prod.nombre,
          cantidad:    1,
          tipoPrecio:  'unitario',
          pre_unit:    p.precio_unitario ?? 0,
          pre_may:     p.precio_mayor    ?? 0,
          pre_caja:    p.precio_caja     ?? 0,
          precio:      p.precio_unitario ?? 0,
          importe:     p.precio_unitario ?? 0,
          uni_med:     p.unidad_medida?.nombre ?? '',
          almacen:     nombreAlmacen,
          stock:       s?.cantidad ?? 0,
        }]);

        this.messageService.add({
          severity: 'success', summary: 'Producto agregado',
          detail: `"${prod.nombre}" fue agregado a la cotización.`, life: 2500,
        });
      },
      error: () => {
        this.cargandoProducto.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al agregar producto',
          detail: `No se pudo obtener el detalle de "${prod.nombre}". Intenta de nuevo.`, life: 4000,
        });
      },
    });

    this.busquedaProductoVal = '';
    this.productosAutoComplete.set([]);
  }

  cambiarTipoPrecio(index: number, tipo: 'unitario' | 'mayor' | 'caja') {
    this.detalles.update(items =>
      items.map((d, i) => {
        if (i !== index) return d;
        const precio = tipo === 'unitario' ? d.pre_unit : tipo === 'mayor' ? d.pre_may : d.pre_caja;
        return { ...d, tipoPrecio: tipo, precio, importe: d.cantidad * precio };
      })
    );
  }

  actualizarCantidad(index: number, cantidad: number) {
    if (!cantidad || cantidad < 1) return;
    const detalle = this.detalles()[index];
    if (!detalle) return;
    this.detalles.update(items =>
      items.map((d, i) => i === index
        ? { ...d, cantidad, importe: cantidad * d.precio }
        : d
      )
    );
  }

  eliminarDetalle(index: number) {
    const nombre = this.detalles()[index]?.descripcion ?? 'Producto';
    this.detalles.update(items => items.filter((_, i) => i !== index));
    this.messageService.add({
      severity: 'info', summary: 'Producto eliminado',
      detail: `"${nombre}" fue quitado de la cotización.`, life: 2500,
    });
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  get subtotal() { return +this.detalles().reduce((acc, d) => acc + d.importe, 0).toFixed(2); }
  get igv()      { return +(this.subtotal * 0.18).toFixed(2); }
  get total()    { return +(this.subtotal + this.igv).toFixed(2); }

  // ── Guardar ───────────────────────────────────────────────────────────────
  guardar() {
    if (!this.form.get('id_proveedor')?.value) {
      this.messageService.add({
        severity: 'warn', summary: 'Proveedor requerido',
        detail: 'Busca y selecciona un proveedor antes de guardar.', life: 4000,
      });
      return;
    }
    if (!this.form.get('sede')?.value) {
      this.messageService.add({
        severity: 'warn', summary: 'Sede requerida',
        detail: 'Selecciona una sede para la cotización.', life: 4000,
      });
      return;
    }
    if (!this.form.get('fec_venc')?.value) {
      this.messageService.add({
        severity: 'warn', summary: 'Fecha de vencimiento requerida',
        detail: 'Indica una fecha límite de validez para la cotización.', life: 4000,
      });
      return;
    }
    if (this.detalles().length === 0) {
      this.messageService.add({
        severity: 'warn', summary: 'Sin productos',
        detail: 'Agrega al menos un producto a la cotización.', life: 4000,
      });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const fecVenc = raw.fec_venc instanceof Date
      ? raw.fec_venc.toISOString()
      : new Date(raw.fec_venc).toISOString();

    const payload = {
      id_proveedor: this.form.get('id_proveedor')?.value,
      id_sede:      raw.sede,
      id_almacen:   this.almacenSeleccionado() ?? raw.id_almacen ?? null,
      fec_venc:     fecVenc,
      subtotal:     this.subtotal,
      igv:          this.igv,
      total:        this.total,
      tipo:         'COMPRA' as const,
      detalles:     this.detalles().map(
        ({ importe, uni_med, tipoPrecio, pre_unit, pre_may, pre_caja, almacen, stock, ...d }) => d
      ),
    };

    const req$ = this.esModoEdicion()
      ? this.quoteService.approveQuote(raw.id_cotizacion)
      : this.quoteService.createQuote(payload as any);

    req$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'success',
          summary:  this.esModoEdicion() ? 'Cotización actualizada' : 'Cotización de compra creada',
          detail:   this.esModoEdicion()
            ? 'Los cambios fueron guardados correctamente.'
            : 'La cotización de compra fue registrada exitosamente.',
          life: 2500,
        });
        setTimeout(() => this.router.navigate(['/admin/cotizaciones-compra']), 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al guardar',
          detail: err?.error?.message ?? err?.message ?? 'No se pudo guardar la cotización.',
          life: 6000,
        });
      },
    });
  }

  cancelar() { this.router.navigate(['/admin/cotizaciones-compra']); }

  // ── Helpers privados ──────────────────────────────────────────────────────
  _limpiarProveedor() {
    this.proveedorEncontrado.set(null);
    this.busquedaProvSinResult.set(false);
    this.mostrarFormNuevo.set(false);
    this.nuevoProveedorForm.reset();
    this.form.get('id_proveedor')?.setValue(null, { emitEvent: false });
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const char = event.key;
    if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(char)) return true;
    if (!/^\d$/.test(char)) { event.preventDefault(); return false; }
    return true;
  }

  soloAlfanumericoMayus(event: KeyboardEvent): boolean {
    const char = event.key;
    if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(char)) return true;
    if (!/^[a-zA-Z0-9]$/.test(char)) { event.preventDefault(); return false; }
    return true;
  }

  aMayusculas(event: Event): void {
    const input = event.target as HTMLInputElement;
    const pos = input.selectionStart ?? 0;
    input.value = input.value.toUpperCase();
    this.busquedaProductoVal = input.value;
    input.setSelectionRange(pos, pos);
  }
}