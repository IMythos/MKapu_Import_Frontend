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
import { TagModule } from 'primeng/tag';
import { StepperModule } from 'primeng/stepper';
import {
  ClienteBusquedaResponse,
  ClienteResponse,
  CrearClienteRequest,
  TipoDocumento,
} from '../../../../ventas/interfaces';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductoService } from '../../../services/producto.service';
import { ProductoAutocomplete } from '../../../interfaces/producto.interface';
import { SedeAlmacenService } from '../../../services/sede-almacen.service';

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
    TagModule,
    StepperModule,
  ],
  templateUrl: './cotizacion-formulario.html',
  styleUrl: './cotizacion-formulario.css',
})
export class CotizacionFormulario implements OnInit {
  public iconoCabecera   = 'pi pi-wallet';
  public tituloKicker    = 'ADMINISTRACIÓN';
  public subtituloKicker = 'AGREGAR NUEVA COTIZACIÓN';
  private fb              = inject(FormBuilder);
  private router          = inject(Router);
  private route           = inject(ActivatedRoute);
  private quoteService    = inject(QuoteService);
  private sedeService     = inject(SedeService);
  private clienteService  = inject(ClienteService);
  private productoService = inject(ProductoService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private messageService  = inject(MessageService);

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
  clienteEncontrado     = signal<ClienteBusquedaResponse | null>(null);
  busquedaSinResultado  = signal(false);
  tiposDocumento        = signal<TipoDocumento[]>([]);
  cargandoCliente       = signal(false);
  sedeSeleccionada      = signal<any | null>(null);
  productosAutoComplete = signal<ProductoAutocomplete[]>([]);
  cargandoProducto      = signal(false);
  detalles              = signal<DetalleItem[]>([]);
  esRuc                 = signal(false);
  pasoActual       = signal<number>(0);
  tipoCotizacion   = signal<'VENTA' | 'COMPRA' | null>(null);

  // Almacén: se carga internamente para conocer el nombre, pero no se muestra como selector
  almacenSeleccionado = signal<number | null>(null);
  almacenesOptions    = signal<{ label: string; value: number }[]>([]);

  busquedaProductoVal = '';

  readonly hoy: Date    = new Date();
  readonly manana: Date = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })();

  estadoOptions = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada',  value: 'APROBADA'  },
    { label: 'Rechazada', value: 'RECHAZADA' },
  ];

  seleccionarTipo(tipo: 'VENTA' | 'COMPRA') {
    this.tipoCotizacion.set(tipo);
    this.pasoActual.set(1);
  }

  volverAlPaso1() {
    this.pasoActual.set(0);
  }

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
    id_almacen: [null],   // campo oculto — no se muestra pero se envía al backend
    estado:     [{ value: 'PENDIENTE', disabled: true },  Validators.required],
  });

  nuevoClienteForm: FormGroup = this.fb.group({
    documentTypeId: [null, Validators.required],
    name:           ['',   Validators.required],
    apellidos:      ['',   Validators.required],
    razon_social:   [''],
    email:          ['',   [Validators.required, Validators.email]],
    phone:          [''],
    address:        [''],
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    this.sedeService.loadSedes().subscribe({
      next: () => {
        this.sedes.set(this.sedeService.sedes());

        // Preselecciona la sede del usuario logueado
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
          severity: 'error',
          summary:  'Error al cargar sedes',
          detail:   'No se pudieron obtener las sedes. Recarga la página.',
          life:     5000,
        });
      },
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

    // ── Cambio de sede: carga almacenes en segundo plano ─────────────────
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

      // Carga almacenes en segundo plano para conocer los nombres
      this.sedeAlmacenService.loadWarehouseOptionsBySede(id_sede).subscribe({
        next: (options) => {
          this.almacenesOptions.set(options);
          // Auto-selecciona el primer almacén disponible
          if (options.length > 0) {
            this.almacenSeleccionado.set(options[0].value);
            this.form.get('id_almacen')?.setValue(options[0].value, { emitEvent: false });
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'warn',
            summary:  'Almacenes no disponibles',
            detail:   'No se pudieron cargar los almacenes de esta sede.',
            life:     4000,
          });
        },
      });
    });

    // ── Modo edición ──────────────────────────────────────────────────────
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
              address:                 c.direccion  ?? undefined,
              email:                   c.email      ?? undefined,
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
              almacen:     '',
              stock:       0,
            })));
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary:  'Error al cargar cotización',
            detail:   'No se pudo obtener la cotización. Intenta de nuevo.',
            life:     5000,
          });
        },
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
          this.messageService.add({
            severity: 'success',
            summary:  'Cliente encontrado',
            detail:   `${resp.displayName ?? resp.name} fue cargado correctamente.`,
            life:     3000,
          });
        } else {
          this._sinResultado(doc);
          this.messageService.add({
            severity: 'warn',
            summary:  'Cliente no encontrado',
            detail:   `No existe un cliente con el documento "${doc}". Puedes registrarlo.`,
            life:     4000,
          });
        }
      },
      error: () => {
        this.cargandoCliente.set(false);
        this._sinResultado(doc);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al buscar cliente',
          detail:   'Ocurrió un error en la búsqueda. Verifica tu conexión e intenta de nuevo.',
          life:     5000,
        });
      },
    });
  }

  registrarNuevoCliente() {
    if (this.nuevoClienteForm.invalid) {
      this.nuevoClienteForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary:  'Datos incompletos',
        detail:   'Completa todos los campos obligatorios del nuevo cliente.',
        life:     4000,
      });
      return;
    }

    const doc = this.form.get('documento')?.value?.trim();
    const { apellidos, name, razon_social, ...rest } = this.nuevoClienteForm.value;

    const payload: CrearClienteRequest = {
      ...rest,
      documentValue: doc,
      name:         this.esRuc() ? (razon_social ?? '') : `${name} ${apellidos}`.trim(),
      razon_social: this.esRuc() ? (razon_social ?? '') : undefined,
    };

    this.clienteService.crearCliente(payload).subscribe({
      next: (nuevoCliente: ClienteResponse) => {
        const tipoDoc = this.tiposDocumento().find(
          t => t.documentTypeId === nuevoCliente.documentTypeId
        );

        this.clienteEncontrado.set({
          customerId:              nuevoCliente.customerId,
          name:                    nuevoCliente.name,
          documentValue:           nuevoCliente.documentValue,
          invoiceType:             nuevoCliente.invoiceType as 'BOLETA' | 'FACTURA',
          status:                  nuevoCliente.status,
          documentTypeId:          nuevoCliente.documentTypeId,
          documentTypeDescription: tipoDoc?.description ?? '-',
          documentTypeSunatCode:   nuevoCliente.documentTypeSunatCode,
          address:                 nuevoCliente.address,
          email:                   nuevoCliente.email,
          phone:                   nuevoCliente.phone,
          displayName:             nuevoCliente.displayName,
        });

        this.busquedaSinResultado.set(false);
        this.esRuc.set(false);
        this.nuevoClienteForm.reset();
        this._resetNuevoClienteValidators();
        this.form.get('id_cliente')?.setValue(nuevoCliente.customerId, { emitEvent: false });
        this.messageService.add({
          severity: 'success',
          summary:  'Cliente registrado',
          detail:   'El cliente fue creado y cargado en la cotización.',
          life:     3000,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary:  'Error al registrar cliente',
          detail:   err?.error?.message ?? 'No se pudo registrar el cliente. Intenta de nuevo.',
          life:     5000,
        });
      },
    });
  }

  onTipoDocumentoChange(idTipo: number | null): void {
    const tipoDoc = this.tiposDocumento().find(t => t.documentTypeId === idTipo);
    const cod: string = (tipoDoc as any)?.cod_sunat
                     ?? tipoDoc?.sunatCode
                     ?? tipoDoc?.documentTypeId
                     ?? '';

    const esRuc = cod === '06';
    this.esRuc.set(esRuc);

    if (esRuc) {
      this.nuevoClienteForm.get('name')?.clearValidators();
      this.nuevoClienteForm.get('apellidos')?.clearValidators();
      this.nuevoClienteForm.get('razon_social')?.setValidators([Validators.required]);
      this.nuevoClienteForm.get('name')?.setValue('',      { emitEvent: false });
      this.nuevoClienteForm.get('apellidos')?.setValue('', { emitEvent: false });
    } else {
      this.nuevoClienteForm.get('name')?.setValidators([Validators.required]);
      this.nuevoClienteForm.get('apellidos')?.setValidators([Validators.required]);
      this.nuevoClienteForm.get('razon_social')?.clearValidators();
      this.nuevoClienteForm.get('razon_social')?.setValue('', { emitEvent: false });
    }

    this.nuevoClienteForm.get('name')?.updateValueAndValidity();
    this.nuevoClienteForm.get('apellidos')?.updateValueAndValidity();
    this.nuevoClienteForm.get('razon_social')?.updateValueAndValidity();
  }

  getMaxLengthDoc(): number {
    const idTipo  = this.nuevoClienteForm.get('documentTypeId')?.value;
    const tipoDoc = this.tiposDocumento().find(t => t.documentTypeId === idTipo);
    const cod: string = (tipoDoc as any)?.cod_sunat
                     ?? tipoDoc?.sunatCode
                     ?? tipoDoc?.documentTypeId
                     ?? '';
    if (cod === '01') return 8;
    if (cod === '06') return 11;
    if (cod === '07') return 12;
    return 15;
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
            severity: 'info',
            summary:  'Sin resultados',
            detail:   `No se encontraron productos con "${query}".`,
            life:     3000,
          });
        }
      },
      error: () => {
        this.cargandoProducto.set(false);
        this.productosAutoComplete.set([]);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al buscar producto',
          detail:   'No se pudo realizar la búsqueda. Intenta de nuevo.',
          life:     4000,
        });
      },
    });
  }

  agregarProducto(prod: ProductoAutocomplete) {
    const existe = this.detalles().find(d => d.id_prod_ref === prod.id_producto);
    if (existe) {
      if (existe.cantidad >= existe.stock) {
        this.messageService.add({
          severity: 'warn',
          summary:  'Stock máximo alcanzado',
          detail:   `Solo hay ${existe.stock} unidades disponibles de "${prod.nombre}" en ${existe.almacen || 'el almacén'}.`,
          life:     4000,
        });
        this.busquedaProductoVal = '';
        this.productosAutoComplete.set([]);
        return;
      }

      this.detalles.update(items =>
        items.map(d => d.id_prod_ref === prod.id_producto
          ? { ...d, cantidad: d.cantidad + 1, importe: (d.cantidad + 1) * d.precio }
          : d
        )
      );
      this.busquedaProductoVal = '';
      this.productosAutoComplete.set([]);
      this.messageService.add({
        severity: 'info',
        summary:  'Cantidad actualizada',
        detail:   `Se incrementó la cantidad de "${prod.nombre}".`,
        life:     2500,
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

        // Busca el nombre del almacén en las opciones ya cargadas usando id_almacen
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
          severity: 'success',
          summary:  'Producto agregado',
          detail:   `"${prod.nombre}" fue agregado a la cotización.`,
          life:     2500,
        });
      },
      error: () => {
        this.cargandoProducto.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al agregar producto',
          detail:   `No se pudo obtener el detalle de "${prod.nombre}". Intenta de nuevo.`,
          life:     4000,
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
    const cantidadFinal = Math.min(cantidad, detalle.stock);
    if (cantidad > detalle.stock) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Stock insuficiente',
        detail:   `Máximo disponible: ${detalle.stock} unidades en ${detalle.almacen || 'almacén'}.`,
        life:     3000,
      });
    }

    this.detalles.update(items =>
      items.map((d, i) => i === index
        ? { ...d, cantidad: cantidadFinal, importe: cantidadFinal * d.precio }
        : d
      )
    );
  }

  actualizarPrecio(index: number, precio: number) {
    if (precio == null || precio < 0) return;
    this.detalles.update(items =>
      items.map((d, i) => i === index ? { ...d, precio, importe: d.cantidad * precio } : d)
    );
  }

  eliminarDetalle(index: number) {
    const nombre = this.detalles()[index]?.descripcion ?? 'Producto';
    this.detalles.update(items => items.filter((_, i) => i !== index));
    this.messageService.add({
      severity: 'info',
      summary:  'Producto eliminado',
      detail:   `"${nombre}" fue quitado de la cotización.`,
      life:     2500,
    });
  }

  // ── Totales ───────────────────────────────────────────────────────────────
  get subtotal() { return +this.detalles().reduce((acc, d) => acc + d.importe, 0).toFixed(2); }
  get igv()      { return +(this.subtotal * 0.18).toFixed(2); }
  get total()    { return +(this.subtotal + this.igv).toFixed(2); }

  // ── Guardar ───────────────────────────────────────────────────────────────
  guardar() {
    if (!this.form.get('id_cliente')?.value) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Cliente requerido',
        detail:   'Busca y selecciona un cliente antes de guardar.',
        life:     4000,
      });
      return;
    }

    if (!this.form.get('sede')?.value) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Sede requerida',
        detail:   'Selecciona una sede para la cotización.',
        life:     4000,
      });
      return;
    }

    if (!this.form.get('fec_venc')?.value) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Fecha de vencimiento requerida',
        detail:   'Indica una fecha límite de validez para la cotización.',
        life:     4000,
      });
      return;
    }

    if (this.detalles().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Sin productos',
        detail:   'Agrega al menos un producto a la cotización.',
        life:     4000,
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary:  'Formulario incompleto',
        detail:   'Revisa los campos obligatorios antes de continuar.',
        life:     4000,
      });
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
    id_almacen:        this.almacenSeleccionado() ?? raw.id_almacen ?? null,
    fec_venc:          fecVenc,
    subtotal:          this.subtotal,
    igv:               this.igv,
    total:             this.total,
    tipo:              this.tipoCotizacion() ?? 'VENTA', 
    detalles: this.detalles().map(
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
          summary:  this.esModoEdicion() ? 'Cotización actualizada' : 'Cotización creada',
          detail:   this.esModoEdicion()
            ? 'Los cambios fueron guardados correctamente.'
            : 'La cotización fue registrada exitosamente.',
          life: 2500,
        });
        setTimeout(() => this.router.navigate(['/admin/cotizaciones']), 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al guardar',
          detail:   err?.error?.message ?? 'No se pudo guardar la cotización. Intenta de nuevo.',
          life:     6000,
        });
      },
    });
  }

  cancelar() { this.router.navigate(['/admin/cotizaciones']); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private _limpiarClienteSinDoc() {
    this.clienteEncontrado.set(null);
    this.busquedaSinResultado.set(false);
    this.esRuc.set(false);
    this.nuevoClienteForm.reset();
    this._resetNuevoClienteValidators();
    this.form.get('id_cliente')?.setValue('', { emitEvent: false });
  }

  private _sinResultado(doc: string) {
    this.clienteEncontrado.set(null);
    this.busquedaSinResultado.set(true);
    this.form.get('id_cliente')?.setValue('', { emitEvent: false });
    this.nuevoClienteForm.patchValue({ documentValue: doc });
  }

  private _resetNuevoClienteValidators() {
    this.nuevoClienteForm.get('name')?.setValidators([Validators.required]);
    this.nuevoClienteForm.get('apellidos')?.setValidators([Validators.required]);
    this.nuevoClienteForm.get('razon_social')?.clearValidators();
    this.nuevoClienteForm.get('name')?.updateValueAndValidity();
    this.nuevoClienteForm.get('apellidos')?.updateValueAndValidity();
    this.nuevoClienteForm.get('razon_social')?.updateValueAndValidity();
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