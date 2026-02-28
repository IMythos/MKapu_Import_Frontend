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
import { ClienteService } from '../../../../ventas/services/cliente.service';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import {
  ClienteBusquedaResponse,
  ClienteResponse,
  CrearClienteRequest,
  TipoDocumento,
} from '../../../../ventas/interfaces';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductoService } from '../../../services/producto.service';
import { ProductoAutocomplete } from '../../../interfaces/producto.interface';

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
}

@Component({
  selector: 'app-cotizacion-formulario',
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
  ],
  templateUrl: './cotizacion-formulario.html',
  styleUrl: './cotizacion-formulario.css',
})
export class CotizacionFormulario implements OnInit {
  private fb              = inject(FormBuilder);
  private router          = inject(Router);
  private route           = inject(ActivatedRoute);
  private quoteService    = inject(QuoteService);
  private sedeService     = inject(SedeService);
  private clienteService  = inject(ClienteService);
  private productoService = inject(ProductoService);
  private messageService  = inject(MessageService);

  // ── Signals ───────────────────────────────────────────────────────────────
  isSubmitting          = signal(false);
  esModoEdicion         = signal(false);
  sedes                 = signal<any[]>([]);
  clienteEncontrado     = signal<ClienteBusquedaResponse | null>(null);
  busquedaSinResultado  = signal(false);
  tiposDocumento        = signal<TipoDocumento[]>([]);
  cargandoCliente       = signal(false);
  sedeSeleccionada      = signal<any | null>(null);
  almacenes             = signal<any[]>([]);
  productosAutoComplete = signal<ProductoAutocomplete[]>([]);
  cargandoProducto      = signal(false);
  detalles              = signal<DetalleItem[]>([]);

  busquedaProductoVal = '';

  // Fechas
  readonly hoy: Date    = new Date();
  readonly manana: Date = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();

  // ── Opciones ──────────────────────────────────────────────────────────────
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
    id_cliente: ['',                                      Validators.required],
    documento:  ['',                                      Validators.required],
    fec_emision:[{ value: new Date(), disabled: true },   Validators.required],
    fec_venc:   [null,                                    Validators.required],
    sede:       [null,                                    Validators.required],
    id_almacen: [null],
    estado:     [{ value: 'PENDIENTE', disabled: true },  Validators.required],
  });

  nuevoClienteForm: FormGroup = this.fb.group({
    documentTypeId: [null, Validators.required],
    name:           ['',   Validators.required],
    apellidos:      ['',   Validators.required],
    email:          ['',   [Validators.required, Validators.email]],
    phone:          [''],
    address:        [''],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.sedeService.loadSedes().subscribe({
      next:  () => this.sedes.set(this.sedeService.sedes()),
      error: () => this.sedes.set([]),
    });

    this.clienteService.obtenerTiposDocumento().subscribe({
      next:  (tipos) => this.tiposDocumento.set(tipos),
      error: () => this.tiposDocumento.set([]),
    });

    this.form.get('documento')?.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe((value: string) => {
      if (value && value.length >= 8) this.buscarClientePorDocumento();
      else this._limpiarClienteSinDoc();
    });

    this.form.get('sede')?.valueChanges.subscribe((id_sede: number) => {
      this.sedeSeleccionada.set(null);
      this.almacenes.set([]);
      this.form.get('id_almacen')?.setValue(null, { emitEvent: false });
      this.productosAutoComplete.set([]);
      this.busquedaProductoVal = '';
      if (!id_sede) return;

      this.sedeService.getSedeById(id_sede).subscribe({
        next: (sede) => {
          this.sedeSeleccionada.set(sede);
          this.almacenes.set([]); // ← vacío por ahora, sin backend aún
        },
        error: () => this.sedeSeleccionada.set(null),
      });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esModoEdicion.set(true);
      this.form.get('estado')?.enable();

      this.quoteService.getQuoteById(Number(id)).subscribe({
        next: (cot) => {
          this.form.patchValue({
            id_cliente:  cot.id_cliente,
            documento:   cot.cliente?.valor_doc ?? '',
            sede:        cot.id_sede,
            estado:      cot.estado,
            fec_venc:    cot.fec_venc ? new Date(cot.fec_venc) : null,
            fec_emision: cot.fec_emision ? new Date(cot.fec_emision) : new Date(),
          });

          if (cot.cliente) {
            const c = cot.cliente;
            this.clienteEncontrado.set({
              customerId:              cot.id_cliente ?? '',
              name:                    `${c.nombre_cliente} ${c.apellidos_cliente ?? ''}`.trim(),
              documentValue:           c.valor_doc,
              invoiceType:             'BOLETA',
              status:                  true,
              documentTypeId:          c.id_tipo_documento,
              documentTypeDescription: undefined,
              documentTypeSunatCode:   undefined,
              address:                 c.direccion ?? undefined,
              email:                   c.email     ?? undefined,
              phone:                   c.telefono,
              displayName:             c.razon_social
                                         ?? `${c.nombre_cliente} ${c.apellidos_cliente ?? ''}`.trim(),
            });
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
            })));
          }
        },
        error: () => {},
      });
    }
  }

  // ── Cliente ───────────────────────────────────────────────────────────────
  buscarClientePorDocumento() {
    const doc = this.form.get('documento')?.value?.trim();
    if (!doc) return;

    this.cargandoCliente.set(true);
    this._limpiarClienteSinDoc();

    this.clienteService.buscarCliente(doc).subscribe({
      next: (resp) => {
        this.cargandoCliente.set(false);
        if (resp?.customerId) {
          this.clienteEncontrado.set(resp);
          this.busquedaSinResultado.set(false);
          this.form.get('id_cliente')?.setValue(resp.customerId, { emitEvent: false });
        } else {
          this._sinResultado(doc);
        }
      },
      error: () => { this.cargandoCliente.set(false); this._sinResultado(doc); },
    });
  }

  registrarNuevoCliente() {
    if (this.nuevoClienteForm.invalid) { this.nuevoClienteForm.markAllAsTouched(); return; }

    const doc = this.form.get('documento')?.value?.trim();
    const { apellidos, name, ...rest } = this.nuevoClienteForm.value;

    const payload: CrearClienteRequest = {
      ...rest,
      documentValue: doc,
      name: `${name} ${apellidos}`.trim(),
    };

    this.clienteService.crearCliente(payload).subscribe({
      next: (nuevoCliente: ClienteResponse) => {
        this.clienteEncontrado.set({
          customerId:              nuevoCliente.customerId,
          name:                    nuevoCliente.name,
          documentValue:           nuevoCliente.documentValue,
          invoiceType:             nuevoCliente.invoiceType as 'BOLETA' | 'FACTURA',
          status:                  nuevoCliente.status,
          documentTypeId:          nuevoCliente.documentTypeId,
          documentTypeDescription: nuevoCliente.documentTypeDescription,
          documentTypeSunatCode:   nuevoCliente.documentTypeSunatCode,
          address:                 nuevoCliente.address,
          email:                   nuevoCliente.email,
          phone:                   nuevoCliente.phone,
          displayName:             nuevoCliente.displayName,
        });
        this.busquedaSinResultado.set(false);
        this.nuevoClienteForm.reset();
        this.form.get('id_cliente')?.setValue(nuevoCliente.customerId, { emitEvent: false });
        this.messageService.add({ severity: 'success', summary: 'Cliente registrado', detail: 'El cliente fue creado exitosamente.' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo registrar el cliente.' });
      },
    });
  }

  // ── Productos ─────────────────────────────────────────────────────────────
  buscarProducto(query: string) {
    const idSede = this.form.get('sede')?.value;
    if (!query || query.length < 2 || !idSede) { this.productosAutoComplete.set([]); return; }
    this.cargandoProducto.set(true);
    this.productoService.getProductosAutocomplete(query, idSede).subscribe({
      next:  (resp) => { this.cargandoProducto.set(false); this.productosAutoComplete.set(resp.data ?? []); },
      error: () => { this.cargandoProducto.set(false); this.productosAutoComplete.set([]); },
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
      return;
    }

    const idSede = this.form.get('sede')?.value;
    this.cargandoProducto.set(true);

    this.productoService.getProductoDetalleStock(prod.id_producto, idSede).subscribe({
      next: (resp) => {
        this.cargandoProducto.set(false);
        const p = resp.producto;
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
        }]);
      },
      error: () => {
        this.cargandoProducto.set(false);
        this.detalles.update(items => [...items, {
          id_prod_ref: prod.id_producto,
          cod_prod:    prod.codigo,
          descripcion: prod.nombre,
          cantidad:    1,
          tipoPrecio:  'unitario',
          pre_unit:    0, pre_may: 0, pre_caja: 0,
          precio:      0, importe: 0, uni_med:  '',
        }]);
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
    this.detalles.update(items =>
      items.map((d, i) => i === index ? { ...d, cantidad, importe: cantidad * d.precio } : d)
    );
  }

  actualizarPrecio(index: number, precio: number) {
    if (precio == null || precio < 0) return;
    this.detalles.update(items =>
      items.map((d, i) => i === index ? { ...d, precio, importe: d.cantidad * precio } : d)
    );
  }

  eliminarDetalle(index: number) {
    this.detalles.update(items => items.filter((_, i) => i !== index));
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  get subtotal() { return +this.detalles().reduce((acc, d) => acc + d.importe, 0).toFixed(2); }
  get igv()      { return +(this.subtotal * 0.18).toFixed(2); }
  get total()    { return +(this.subtotal + this.igv).toFixed(2); }

  // ── Guardar ───────────────────────────────────────────────────────────────
  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.detalles().length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin productos', detail: 'Agrega al menos un producto.' });
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const fecVenc = raw.fec_venc instanceof Date
      ? raw.fec_venc.toISOString()
      : new Date(raw.fec_venc).toISOString();

    const payload = {
      documento_cliente: raw.documento,
      id_sede:           raw.sede,
      fec_venc:          fecVenc,
      subtotal:          this.subtotal,
      igv:               this.igv,
      total:             this.total,
      detalles:          this.detalles().map(({ importe, uni_med, tipoPrecio, pre_unit, pre_may, pre_caja, ...d }) => d),
    };

    const req$ = this.esModoEdicion()
      ? this.quoteService.approveQuote(raw.id_cotizacion)
      : this.quoteService.createQuote(payload as any);

    req$.subscribe({
      next:  () => { this.isSubmitting.set(false); this.router.navigate(['/admin/gestion-cotizaciones']); },
      error: () => { this.isSubmitting.set(false); },
    });
  }

  cancelar() { this.router.navigate(['/admin/cotizaciones']); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _limpiarClienteSinDoc() {
    this.clienteEncontrado.set(null);
    this.busquedaSinResultado.set(false);
    this.nuevoClienteForm.reset();
    this.form.get('id_cliente')?.setValue('', { emitEvent: false });
  }

  private _sinResultado(doc: string) {
    this.clienteEncontrado.set(null);
    this.busquedaSinResultado.set(true);
    this.form.get('id_cliente')?.setValue('', { emitEvent: false });
    this.nuevoClienteForm.patchValue({ documentValue: doc });
  }
}