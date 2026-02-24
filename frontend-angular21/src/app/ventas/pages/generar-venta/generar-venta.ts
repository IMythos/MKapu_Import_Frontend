import { Component, OnInit, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { AuthService } from '../../../auth/services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { VentaService } from '../../services/venta.service';
import { ProductoService } from '../../services/producto.service';

import {
  ClienteBusquedaResponse,
  CrearClienteRequest,
  CrearClienteResponse,
  ActualizarClienteRequest,
  TipoDocumento,
  ItemVenta,
  Producto,
  ProductoStockVentas,
  RegistroVentaRequest,
  RegistroVentaResponse,
  METODOS_PAGO,
  OPERATION_TYPE_VENTA_INTERNA,
  CURRENCY_PEN,
  IGV_RATE,
  ProductoConStock,
} from '../../interfaces';

@Component({
  selector: 'app-generar-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ConfirmDialogModule,
    CardModule,
    ButtonModule,
    DividerModule,
    InputTextModule,
    SelectButtonModule,
    AutoCompleteModule,
    SelectModule,
    TagModule,
    InputNumberModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './generar-venta.html',
  styleUrls: ['./generar-venta.css'],
  providers: [MessageService, ConfirmationService],
})
export class GenerarVenta implements OnInit, AfterViewInit {
  private readonly authService         = inject(AuthService);
  private readonly clienteService      = inject(ClienteService);
  private readonly ventaService        = inject(VentaService);
  private readonly productoService     = inject(ProductoService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router              = inject(Router);

  // ─── Cabecera ─────────────────────────────────────────────────────────────
  readonly iconoCabecera   = 'pi pi-shopping-cart';
  readonly tituloKicker    = 'VENTAS - GENERAR VENTA';
  readonly subtituloKicker = 'GENERAR NUEVA VENTA';
  readonly steps           = ['Comprobante y Cliente', 'Productos', 'Forma de Pago', 'Confirmar Venta'];

  // ─── Opciones estáticas ───────────────────────────────────────────────────
  readonly tipoComprobanteOptions = [
    { label: 'Boleta',   value: 2, icon: 'pi pi-file'      },
    { label: 'Factura',  value: 1, icon: 'pi pi-file-edit' },
  ];

  readonly opcionesTipoPrecio = [
    { label: 'Unidad',    value: 'unidad'    },
    { label: 'Caja',      value: 'caja'      },
    { label: 'Mayorista', value: 'mayorista' },
  ];

  readonly metodoPagoOptions = [
    { label: 'Efectivo',      value: 1, icon: 'pi pi-money-bill'           },
    { label: 'Débito',        value: 2, icon: 'pi pi-credit-card'          },
    { label: 'Crédito',       value: 3, icon: 'pi pi-credit-card'          },
    { label: 'Yape/Plin',     value: 4, icon: 'pi pi-mobile'               },
    { label: 'Transferencia', value: 5, icon: 'pi pi-building'             },
  ];

  // ─── Sesión ───────────────────────────────────────────────────────────────
  idSedeActual        = signal<number>(0);
  nombreSedeActual    = signal('');
  idUsuarioActual     = signal<number>(0);
  nombreUsuarioActual = signal('');

  // ─── Wizard ───────────────────────────────────────────────────────────────
  activeStep = signal(0);

  // ─── Paso 1: Comprobante / Cliente ────────────────────────────────────────
  tipoComprobante      = signal(2);
  clienteAutoComplete  = signal('');
  clienteEncontrado    = signal<ClienteBusquedaResponse | null>(null);
  loading              = signal(false);
  busquedaRealizada    = signal(false);

  tiposDocumento       = signal<TipoDocumento[]>([]);
  creandoCliente       = signal(false);
  editandoCliente      = signal(false);
  actualizandoCliente  = signal(false);

  nuevoClienteForm: {
    documentTypeId: number | null;
    documentValue:  string;
    name:           string;
    address:        string;
    email:          string;
    phone:          string;
  } = {
    documentTypeId: null,
    documentValue:  '',
    name:           '',
    address:        '',
    email:          '',
    phone:          '',
  };

  editarClienteForm: {
    name:    string;
    address: string;
    email:   string;
    phone:   string;
  } = { name: '', address: '', email: '', phone: '' };

  // ─── Paso 2: Productos ────────────────────────────────────────────────────
  private readonly SIZE_PAGE = 10;
  private productosCargadosOnce = false;

  productosLoading              = signal(true);
  familiasLoading               = signal(true);
  productosCargados             = signal<Producto[]>([]);
  productosFiltrados            = signal<Producto[]>([]);
  productosSugeridos            = signal<Producto[]>([]);
  productoSeleccionadoBusqueda  = signal<any>(null);

  paginaActual    = signal(1);
  totalRegistros  = signal(0);
  cargandoMas     = signal(false);

  familiaSeleccionada  = signal<number | null>(null);
  familiasDisponibles  = signal<Array<{ label: string; value: number }>>([]);

  productoTemp   = signal<Producto | null>(null);
  cantidadTemp   = signal(1);
  tipoPrecioTemp = signal('unidad');

  productosSeleccionados = signal<ItemVenta[]>([]);

  // ─── Paso 3: Pago ─────────────────────────────────────────────────────────
  metodoPagoSeleccionado = signal(1);
  montoRecibido          = signal(0);
  numeroOperacion        = signal('');

  // ─── Paso 4: Resultado ────────────────────────────────────────────────────
  comprobanteGenerado = signal<RegistroVentaResponse['data'] | null>(null);

  // ─── Computed ─────────────────────────────────────────────────────────────

  textoBotonCliente = computed(() =>
    this.clienteEncontrado() ? 'Cliente Seleccionado' : 'Buscar Cliente',
  );

  iconoBotonCliente = computed(() =>
    this.clienteEncontrado() ? 'pi pi-check' : 'pi pi-search',
  );

  longitudDocumento = computed(() => (this.tipoComprobante() === 2 ? 8 : 11));

  botonClienteHabilitado = computed(
    () => (this.clienteAutoComplete()?.length ?? 0) === this.longitudDocumento(),
  );

  subtotal = computed(() => {
    const t = this.productosSeleccionados().reduce((sum, i) => sum + i.total, 0);
    return t / (1 + IGV_RATE);
  });

  igv   = computed(() => this.subtotal() * IGV_RATE);
  total = computed(() => this.productosSeleccionados().reduce((sum, i) => sum + i.total, 0));

  vuelto = computed(() => {
    const v = this.montoRecibido() - this.total();
    return v >= 0 ? v : 0;
  });

  precioSegunTipo = computed(() => {
    const p = this.productoTemp();
    if (!p) return 0;
    switch (this.tipoPrecioTemp()) {
      case 'caja':      return p.precioCaja;
      case 'mayorista': return p.precioMayorista;
      default:          return p.precioUnidad;
    }
  });

  hayMasPaginas = computed(() => this.productosCargados().length < this.totalRegistros());

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarConfiguracionInicial();
    this.cargarTiposDocumento();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cargarProductos(true);
      this.cargarFamilias();
    }, 0);
  }

  // ─── Sesión ───────────────────────────────────────────────────────────────
  private cargarConfiguracionInicial(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary:  'Sesión no válida',
        detail:   'Por favor, inicie sesión nuevamente',
      });
      this.router.navigate(['/login']);
      return;
    }
    
    this.idSedeActual.set(user.idSede || 1); // Fallback a 1 si no viene
    this.nombreSedeActual.set(user.sedeNombre || '');
    this.idUsuarioActual.set(user.userId || 0);
    this.nombreUsuarioActual.set(`${user.nombres} ${user.apellidos}`.trim());
  }

  private cargarTiposDocumento(): void {
    this.clienteService.obtenerTiposDocumento().subscribe({
      next:  (tipos) => this.tiposDocumento.set(tipos),
      error: ()      => console.warn('No se pudieron cargar los tipos de documento'),
    });
  }

  // ─── Helpers form ────────────────────────────────────────────────────────
  private resetNuevoClienteForm(): void {
    this.nuevoClienteForm = {
      documentTypeId: null,
      documentValue:  '',
      name:           '',
      address:        '',
      email:          '',
      phone:          '',
    };
  }

  private sincronizarDocumentoEnForm(): void {
    const doc = this.clienteAutoComplete().trim();
    if (!doc) return;

    this.nuevoClienteForm.documentValue = doc;

    const tipos = this.tiposDocumento();
    if (doc.length === 8) {
      const dni = tipos.find((t) => t.description?.toUpperCase().includes('DNI'));
      if (dni) this.nuevoClienteForm.documentTypeId = dni.documentTypeId;
    } else if (doc.length === 11) {
      const ruc = tipos.find((t) => t.description?.toUpperCase().includes('RUC'));
      if (ruc) this.nuevoClienteForm.documentTypeId = ruc.documentTypeId;
    }
  }

  // ─── Alta cliente ─────────────────────────────────────────────────────────
  crearNuevoCliente(): void {
    const { documentTypeId, documentValue, name } = this.nuevoClienteForm;

    if (!documentTypeId || !documentValue.trim() || !name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary:  'Campos requeridos',
        detail:   'Tipo de documento, número y nombre son obligatorios',
      });
      return;
    }

    this.creandoCliente.set(true);

    const request: CrearClienteRequest = {
      documentTypeId,
      documentValue: documentValue.trim(),
      name:          name.trim(),
      address:       this.nuevoClienteForm.address.trim() || undefined,
      email:         this.nuevoClienteForm.email.trim()   || undefined,
      phone:         this.nuevoClienteForm.phone.trim()   || undefined,
    };

    this.clienteService.crearCliente(request).subscribe({
      next: (response: CrearClienteResponse) => {
        this.creandoCliente.set(false);

        const clienteCreado: ClienteBusquedaResponse = {
          customerId:              response.customerId,
          name:                    response.name,
          documentValue:           response.documentValue,
          documentTypeDescription: response.documentTypeDescription,
          documentTypeSunatCode:   response.documentTypeSunatCode,
          invoiceType:             response.invoiceType as 'BOLETA' | 'FACTURA',
          status:                  response.status,
          address:                 response.address,
          email:                   response.email,
          phone:                   response.phone,
          displayName:             response.displayName,
        };

        this.clienteAutoComplete.set(response.documentValue);
        this.clienteEncontrado.set(clienteCreado);
        this.busquedaRealizada.set(true);
        this.editandoCliente.set(false);
        this.resetNuevoClienteForm();

        this.messageService.add({
          severity: 'success',
          summary:  'Cliente Creado',
          detail:   `${clienteCreado.name} fue registrado y seleccionado`,
        });
      },
      error: (error: any) => {
        this.creandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al crear cliente',
          detail:   error?.error?.message ?? 'Ocurrió un error al registrar el cliente',
        });
      },
    });
  }

  // ─── Edición cliente existente ───────────────────────────────────────────
  iniciarEdicionCliente(): void {
    const c = this.clienteEncontrado();
    if (!c) return;
    this.editarClienteForm = {
      name:    c.name    ?? '',
      address: c.address ?? '',
      email:   c.email   ?? '',
      phone:   c.phone   ?? '',
    };
    this.editandoCliente.set(true);
  }

  cancelarEdicionCliente(): void {
    this.editandoCliente.set(false);
  }

  guardarCambiosCliente(): void {
    const cliente = this.clienteEncontrado();
    if (!cliente) return;

    const payload: ActualizarClienteRequest = {
      name:    this.editarClienteForm.name.trim()    || undefined,
      address: this.editarClienteForm.address.trim() || undefined,
      email:   this.editarClienteForm.email.trim()   || undefined,
      phone:   this.editarClienteForm.phone.trim()   || undefined,
    };

    this.actualizandoCliente.set(true);

    this.clienteService.actualizarCliente(cliente.customerId, payload).subscribe({
      next: (response: CrearClienteResponse) => {
        this.actualizandoCliente.set(false);
        this.editandoCliente.set(false);

        const actualizado: ClienteBusquedaResponse = {
          customerId:              response.customerId,
          name:                    response.name,
          documentValue:           response.documentValue,
          documentTypeDescription: response.documentTypeDescription,
          documentTypeSunatCode:   response.documentTypeSunatCode,
          invoiceType:             response.invoiceType as 'BOLETA' | 'FACTURA',
          status:                  response.status,
          address:                 response.address,
          email:                   response.email,
          phone:                   response.phone,
          displayName:             response.displayName,
        };

        this.clienteEncontrado.set(actualizado);
        this.messageService.add({
          severity: 'success',
          summary:  'Cliente Actualizado',
          detail:   'Los datos del cliente se actualizaron correctamente',
        });
      },
      error: (error: any) => {
        this.actualizandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al actualizar cliente',
          detail:   error?.error?.message ?? 'Ocurrió un error al actualizar el cliente',
        });
      },
    });
  }

  // ─── Productos ────────────────────────────────────────────────────────────
  private cargarProductos(resetear = true): void {
    if (resetear) {
      this.paginaActual.set(1);
      this.productosCargados.set([]);
      this.productosFiltrados.set([]);
      this.productosLoading.set(true);
    } else {
      this.cargandoMas.set(true);
    }

    const idCategoria = this.familiaSeleccionada() ?? undefined;

    this.productoService
      .obtenerProductosConStock(
        this.idSedeActual(),
        idCategoria,
        this.paginaActual(),
        this.SIZE_PAGE,
      )
      .subscribe({
        next: (response) => {
          this.totalRegistros.set(response.pagination.total_records);

          // Asumimos que mapearProductoConStock acepta la data correctamente
          const nuevos: Producto[] = response.data.map((prod: any) =>
            this.productoService.mapearProductoConStock(prod)
          );

          if (resetear) {
            this.productosCargados.set(nuevos);
          } else {
            this.productosCargados.update((prev) => [...prev, ...nuevos]);
          }

          this.productosFiltrados.set([...this.productosCargados()]);
          this.productosLoading.set(false);
          this.cargandoMas.set(false);
        },
        error: () => {
          this.productosLoading.set(false);
          this.cargandoMas.set(false);
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'No se pudieron cargar los productos',
          });
        },
      });
  }

  cargarMasProductos(): void {
    if (!this.hayMasPaginas() || this.cargandoMas()) return;
    this.paginaActual.update((p) => p + 1);
    this.cargarProductos(false);
  }

  private cargarFamilias(): void {
    this.familiasLoading.set(true);
    this.productoService.obtenerCategoriasConStock(this.idSedeActual()).subscribe({
      next: (categorias) => {
        this.familiasDisponibles.set(
          categorias.map((c) => ({ label: c.nombre, value: c.id_categoria })),
        );
        this.familiasLoading.set(false);
      },
      error: () => {
        this.familiasLoading.set(false);
        console.warn('No se pudieron cargar las familias');
      },
    });
  }

  // ─── Paso 1: lógica cliente ──────────────────────────────────────────────
  onTipoComprobanteChange(nuevoTipo: number): void {
    this.tipoComprobante.set(nuevoTipo);
    this.limpiarCliente();
  }

  validarSoloNumeros(event: any): void {
    const input  = event.target;
    const maxLen = this.longitudDocumento(); 
    input.value  = input.value.replace(/[^0-9]/g, '').slice(0, maxLen);
    this.clienteAutoComplete.set(input.value);
  }

  onInputCambioDocumento(): void {
    if (this.clienteEncontrado()) this.limpiarCliente();
    this.busquedaRealizada.set(false);
  }

  manejarAccionCliente(): void {
    if (!this.botonClienteHabilitado() || this.clienteEncontrado()) return;
    this.buscarCliente();
  }

  private buscarCliente(): void {
    this.loading.set(true);
    this.busquedaRealizada.set(false);

    this.clienteService
      .buscarCliente(this.clienteAutoComplete(), this.tipoComprobante())
      .subscribe({
        next: (response: ClienteBusquedaResponse) => {
          this.clienteEncontrado.set(response);
          this.busquedaRealizada.set(true);
          this.loading.set(false);
          this.editandoCliente.set(false);
          this.messageService.add({
            severity: 'success',
            summary:  'Cliente Encontrado',
            detail:   `Cliente: ${response.name}`,
          });
        },
        error: () => {
          this.clienteEncontrado.set(null);
          this.busquedaRealizada.set(true);
          this.loading.set(false);
          this.editandoCliente.set(false);
          this.sincronizarDocumentoEnForm();
        },
      });
  }

  limpiarCliente(): void {
    this.clienteEncontrado.set(null);
    this.clienteAutoComplete.set('');
    this.busquedaRealizada.set(false);
    this.editandoCliente.set(false);
    this.resetNuevoClienteForm();
  }

  obtenerSiglasDocumento(documentTypeDescription: string): string {
    if (!documentTypeDescription) return '';
    if (documentTypeDescription.includes('DNI')) return 'DNI';
    if (documentTypeDescription.includes('RUC')) return 'RUC';
    const match = documentTypeDescription.match(/\(([^)]+)\)/);
    return match ? match[1] : documentTypeDescription;
  }

  formatearDocumentoCompleto(): string {
    const cliente = this.clienteEncontrado();
    if (!cliente?.documentTypeDescription) return '';
    const siglas = this.obtenerSiglasDocumento(cliente.documentTypeDescription);
    return `${siglas}: ${cliente.documentValue}`;
  }

  // ─── Paso 2: Productos ────────────────────────────────────────────────────
  buscarProductos(event: AutoCompleteCompleteEvent): void {
    const query = event.query.trim();
    if (query.length < 3) { this.productosSugeridos.set([]); return; }

    this.productoService
      .buscarProductosVentas(query, this.idSedeActual(), this.familiaSeleccionada() ?? undefined)
      .subscribe({
        next: (response) => {
          const sugeridos: Producto[] = response.data.map((prod) =>
            this.productoService.mapearAutocompleteVentas(prod, this.nombreSedeActual()),
          );
          this.productosSugeridos.set(sugeridos);
        },
        error: () => this.productosSugeridos.set([]),
      });
  }

  onProductoSeleccionado(event: any): void {
    if (event) {
      this.seleccionarProducto(event);
      this.productoSeleccionadoBusqueda.set(null);
    }
  }

  onLimpiarBusqueda(): void { this.productoSeleccionadoBusqueda.set(null); }

  onFamiliaChange(nuevaFamilia: number | null): void {
    this.familiaSeleccionada.set(nuevaFamilia);
    this.cargarProductos(true);
  }

  seleccionarProducto(producto: Producto): void {
    this.productoTemp.set(producto);
    this.cantidadTemp.set(1);
    this.tipoPrecioTemp.set('unidad');
  }

  agregarProducto(): void {
    const producto = this.productoTemp();
    const cantidad = this.cantidadTemp();
    if (!producto || cantidad <= 0) return;

    if (cantidad > producto.stock) {
      this.messageService.add({
        severity: 'error',
        summary:  'Stock Insuficiente',
        detail:   `Solo hay ${producto.stock} unidades disponibles`,
      });
      return;
    }

    const precioUnitario = this.precioSegunTipo();
    const item: ItemVenta = {
      productId:   producto.codigo,
      quantity:    cantidad,
      unitPrice:   precioUnitario,
      description: producto.nombre,
      total:       precioUnitario * cantidad,
    };

    const productos = [...this.productosSeleccionados()];
    const idx = productos.findIndex(
      (p) => p.productId === item.productId && p.unitPrice === item.unitPrice,
    );

    if (idx >= 0) {
      const nuevoItem = { ...productos[idx] };
      nuevoItem.quantity += cantidad;
      nuevoItem.total = nuevoItem.quantity * nuevoItem.unitPrice;

      if (nuevoItem.quantity > producto.stock) {
        this.messageService.add({
          severity: 'error',
          summary:  'Stock Insuficiente',
          detail:   `Solo hay ${producto.stock} unidades disponibles`,
        });
        return;
      }
      productos[idx] = nuevoItem;
    } else {
      productos.push(item);
    }

    this.productosSeleccionados.set(productos);
    this.messageService.add({
      severity: 'success',
      summary:  'Producto Agregado',
      detail:   `${cantidad} x ${producto.nombre}`,
    });
    this.productoTemp.set(null);
    this.cantidadTemp.set(1);
  }

  eliminarProducto(index: number): void {
    this.confirmationService.confirm({
      message:     '¿Está seguro de eliminar este producto del carrito?',
      header:      'Confirmar Eliminación',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const productos = [...this.productosSeleccionados()];
        productos.splice(index, 1);
        this.productosSeleccionados.set(productos);
        this.messageService.add({
          severity: 'info',
          summary:  'Producto Eliminado',
          detail:   'El producto fue removido del carrito',
        });
      },
    });
  }

  obtenerSeveridadStock(stock: number | undefined): 'success' | 'warn' | 'danger' {
    if (!stock || stock === 0) return 'danger';
    if (stock <= 5)            return 'danger';
    if (stock <= 20)           return 'warn';
    return 'success';
  }

  getLabelMetodoPago(id: number): string {
    return METODOS_PAGO.find((m) => m.id === id)?.description ?? 'N/A';
  }

  // ─── Wizard ───────────────────────────────────────────────────────────────
  nextStep(): void {
    if (!this.validarPasoActual()) return;
    const current = this.activeStep();
    if (current < this.steps.length - 1) this.activeStep.set(current + 1);
  }

  prevStep(): void {
    const current = this.activeStep();
    if (current > 0) this.activeStep.set(current - 1);
  }

  private validarPasoActual(): boolean {
    switch (this.activeStep()) {
      case 0:
        if (!this.clienteEncontrado()) {
          this.messageService.add({
            severity: 'warn',
            summary:  'Cliente Requerido',
            detail:   'Debe buscar y seleccionar un cliente',
          });
          return false;
        }
        return true;
      case 1:
        if (this.productosSeleccionados().length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary:  'Carrito Vacío',
            detail:   'Debe agregar al menos un producto',
          });
          return false;
        }
        return true;
      case 2:
        if (this.metodoPagoSeleccionado() === 1 && this.montoRecibido() < this.total()) {
          this.messageService.add({
            severity: 'warn',
            summary:  'Monto Insuficiente',
            detail:   'El monto recibido debe ser mayor o igual al total',
          });
          return false;
        }
        if (this.metodoPagoSeleccionado() !== 1 && !this.numeroOperacion().trim()) {
          this.messageService.add({
            severity: 'warn',
            summary:  'Número de Operación Requerido',
            detail:   'Debe ingresar el número de operación',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  // ─── Generar venta ────────────────────────────────────────────────────────
  generarVenta(): void {
    if (!this.clienteEncontrado()) {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'No hay cliente seleccionado',
      });
      return;
    }

    this.confirmationService.confirm({
      message:     '¿Está seguro de generar esta venta?',
      header:      'Confirmar Venta',
      icon:        'pi pi-question-circle',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept:      () => this.procesarVenta(),
    });
  }

  private procesarVenta(): void {
    this.loading.set(true);

    const subtotal = Number(this.subtotal().toFixed(2));
    const igv      = Number(this.igv().toFixed(2));
    const total    = Number(this.total().toFixed(2));
    const serie    = this.tipoComprobante() === 1 ? 'F001' : 'B001';

    const fechaVencimiento = new Date();
    if (this.metodoPagoSeleccionado() !== 1) {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    }

    const request: RegistroVentaRequest = {
      customerId:      this.clienteEncontrado()!.customerId,
      saleTypeId:      1,
      serie,
      receiptTypeId:   this.tipoComprobante(),
      dueDate:         fechaVencimiento.toISOString(),
      operationType:   OPERATION_TYPE_VENTA_INTERNA,
      subtotal,
      igv,
      isc:             0,
      total,
      currencyCode:    CURRENCY_PEN,
      responsibleId:   this.idUsuarioActual().toString(),
      branchId:        this.idSedeActual(),
      paymentMethodId: this.metodoPagoSeleccionado(),
      operationNumber: this.metodoPagoSeleccionado() === 1 ? null : this.numeroOperacion(),
      items: this.productosSeleccionados().map((item) => {
        const producto = this.productosCargados().find((p) => p.codigo === item.productId);
        return {
          productId:   producto ? producto.id.toString() : item.productId,
          quantity:    item.quantity,
          unitPrice:   Number(item.unitPrice.toFixed(2)),
          description: item.description,
          total:       Number(item.total.toFixed(2)),
        };
      }),
    };

    this.ventaService.registrarVenta(request).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        const comprobante = {
          receiptId:     response.receiptId     || response.id_comprobante || 'N/A',
          receiptNumber: response.receiptNumber || response.numero          || 'N/A',
          serie:         response.serie         || serie,
          total:         response.total         || total,
          createdAt:     response.createdAt     || response.fec_emision     || new Date().toISOString(),
        };

        this.comprobanteGenerado.set(comprobante);
        this.messageService.add({
          severity: 'success',
          summary:  '¡Venta Exitosa!',
          detail:   `Comprobante ${comprobante.serie}-${comprobante.receiptNumber} generado`,
          life:     5000,
        });
      },
      error: (error: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al Generar Venta',
          detail:   error.error?.message || 'Ocurrió un error al procesar la venta',
        });
      },
    });
  }

  // ─── Acciones finales ─────────────────────────────────────────────────────
  nuevaVenta(): void {
    this.confirmationService.confirm({
      message:     '¿Desea realizar una nueva venta?',
      header:      'Nueva Venta',
      icon:        'pi pi-refresh',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept:      () => this.resetearFormulario(),
    });
  }

  verListado(): void {
    this.router.navigate(['/ventas/historial-ventas']);
  }

  private resetearFormulario(): void {
    this.tipoComprobante.set(2);
    this.clienteAutoComplete.set('');
    this.clienteEncontrado.set(null);
    this.busquedaRealizada.set(false);
    this.editandoCliente.set(false);
    this.resetNuevoClienteForm();

    this.productoTemp.set(null);
    this.cantidadTemp.set(1);
    this.tipoPrecioTemp.set('unidad');
    this.productosSeleccionados.set([]);
    this.familiaSeleccionada.set(null);

    this.metodoPagoSeleccionado.set(1);
    this.montoRecibido.set(0);
    this.numeroOperacion.set('');

    this.comprobanteGenerado.set(null);
    this.activeStep.set(0);

    this.cargarProductos(true);
    this.cargarFamilias();
  }
}