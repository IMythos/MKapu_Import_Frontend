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
import { VentasAdminService } from '../../services/ventas.service';

import {
  ClienteBusquedaAdminResponse,
  CrearClienteAdminRequest,
  ActualizarClienteAdminRequest,
  ClienteAdminResponse,
  TipoDocumentoAdmin,
  ProductoUIAdmin,
  ItemVentaUIAdmin,
  RegistroVentaAdminRequest,
  RegistroVentaAdminResponse,
  SedeAdmin,
  IGV_RATE_ADMIN,
  METODOS_PAGO_ADMIN,
  OPERATION_TYPE_VENTA_INTERNA,
  CURRENCY_PEN_ADMIN,
} from '../../interfaces/ventas.interface';

@Component({
  selector: 'app-generar-ventas-administracion',
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
  providers: [MessageService, ConfirmationService],
  templateUrl: './generar-ventas-administracion.html',
  styleUrls: ['./generar-ventas-administracion.css'],
})
export class GenerarVentasAdministracion implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  private readonly ventasService = inject(VentasAdminService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  readonly tituloKicker = 'VENTAS - GENERAR VENTAS';
  readonly subtituloKicker = 'GENERAR NUEVA VENTA (ADMIN)';
  readonly iconoCabecera = 'pi pi-shopping-cart';

  readonly steps = ['Sede, Comprobante y Cliente', 'Productos', 'Forma de Pago', 'Confirmar Venta'];

  readonly tipoComprobanteOptions = [
    { label: 'Boleta', value: 2, icon: 'pi pi-file' },
    { label: 'Factura', value: 1, icon: 'pi pi-file-edit' },
  ];

  readonly opcionesTipoPrecio = [
    { label: 'Unidad', value: 'unidad' },
    { label: 'Caja', value: 'caja' },
    { label: 'Mayorista', value: 'mayorista' },
  ];

  readonly metodoPagoOptions = [
    { label: 'Efectivo', value: 1, icon: 'pi pi-money-bill' },
    { label: 'Yape / Plin', value: 2, icon: 'pi pi-mobile' },
    { label: 'Tarjeta', value: 3, icon: 'pi pi-credit-card' },
  ];

  private readonly SIZE_PAGE = 10;

  // ─── Sesión ────────────────────────────────────────────────────────────────
  idUsuarioActual = signal<string>('0');
  nombreUsuarioActual = signal('');

  // ─── Sedes ─────────────────────────────────────────────────────────────────
  sedes = signal<SedeAdmin[]>([]);
  sedesLoading = signal(false);
  sedeSeleccionada = signal<number | null>(null);

  // ─── Wizard ────────────────────────────────────────────────────────────────
  activeStep = signal(0);

  // ─── Comprobante ───────────────────────────────────────────────────────────
  tipoComprobante = signal(2);

  // ─── Cliente ───────────────────────────────────────────────────────────────
  clienteDocumento = signal('');
  clienteEncontrado = signal<ClienteBusquedaAdminResponse | null>(null);
  clienteLoading = signal(false);
  busquedaRealizada = signal(false);

  tiposDocumento = signal<TipoDocumentoAdmin[]>([]);
  creandoCliente = signal(false);
  editandoCliente = signal(false);
  guardandoCliente = signal(false);

  nuevoClienteForm: {
    documentTypeId: number | null;
    documentValue: string;
    name: string;
    address: string;
    email: string;
    phone: string;
  } = { documentTypeId: null, documentValue: '', name: '', address: '', email: '', phone: '' };

  editarClienteForm: {
    name: string;
    address: string;
    email: string;
    phone: string;
  } = { name: '', address: '', email: '', phone: '' };

  // ─── Productos ─────────────────────────────────────────────────────────────
  productosLoading = signal(true);
  familiasLoading = signal(true);
  productosCargados = signal<ProductoUIAdmin[]>([]);
  productosFiltrados = signal<ProductoUIAdmin[]>([]);
  productosSugeridos = signal<ProductoUIAdmin[]>([]);
  productoSeleccionadoBusqueda = signal<ProductoUIAdmin | string | null>(null);

  paginaActual = signal(1);
  totalRegistros = signal(0);
  cargandoMas = signal(false);

  familiaSeleccionada = signal<number | null>(null);
  familiasDisponibles = signal<Array<{ label: string; value: number }>>([]);

  productoTemp = signal<ProductoUIAdmin | null>(null);
  cantidadTemp = signal(1);
  tipoPrecioTemp = signal('unidad');

  // ─── Carrito (usa ItemVentaUIAdmin para UI + igvUnitario) ──────────────────
  productosSeleccionados = signal<ItemVentaUIAdmin[]>([]);

  // ─── Pago ──────────────────────────────────────────────────────────────────
  metodoPagoSeleccionado = signal(1);
  montoRecibido = signal(0);
  numeroOperacion = signal('');

  // ─── Resultado ─────────────────────────────────────────────────────────────
  comprobanteGenerado = signal<RegistroVentaAdminResponse | null>(null);
  loading = signal(false);

  // ─── Snapshots para pantalla de éxito ─────────────────────────────────────
  snapshotCliente = signal<ClienteBusquedaAdminResponse | null>(null);
  snapshotSede = signal<string>('');
  snapshotMetodoPago = signal<string>('');
  snapshotTipoComprobante = signal<number>(2);

  // ─── Computed ──────────────────────────────────────────────────────────────
  readonly longitudDocumento = computed(() => (this.tipoComprobante() === 2 ? 8 : 11));

  readonly botonClienteHabilitado = computed(
    () => (this.clienteDocumento()?.trim().length ?? 0) === this.longitudDocumento(),
  );

  readonly subtotal = computed(() => {
    const t = this.productosSeleccionados().reduce((s, i) => s + i.total, 0);
    return t / (1 + IGV_RATE_ADMIN);
  });

  readonly igv = computed(() => this.subtotal() * IGV_RATE_ADMIN);
  readonly total = computed(() => this.productosSeleccionados().reduce((s, i) => s + i.total, 0));

  readonly vuelto = computed(() => {
    const v = this.montoRecibido() - this.total();
    return v >= 0 ? v : 0;
  });

  readonly precioSegunTipo = computed(() => {
    const p = this.productoTemp();
    if (!p) return 0;
    switch (this.tipoPrecioTemp()) {
      case 'caja':
        return p.precioCaja;
      case 'mayorista':
        return p.precioMayorista;
      default:
        return p.precioUnidad;
    }
  });

  readonly hayMasPaginas = computed(() => this.productosCargados().length < this.totalRegistros());

  readonly nombreSedeSeleccionada = computed(() => {
    const id = this.sedeSeleccionada();
    if (!id) return 'Sin sede seleccionada';
    return this.sedes().find((s) => s.id_sede === id)?.nombre ?? '';
  });

  readonly sedesOptions = computed(() =>
    this.sedes().map((s) => ({ label: s.nombre, value: s.id_sede })),
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.cargarSesion();
    this.cargarTiposDocumento();
    this.cargarSedes();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.cargarFamilias(), 0);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SESIÓN
  // ══════════════════════════════════════════════════════════════════════════

  private cargarSesion(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.idUsuarioActual.set(user.userId?.toString() ?? '0');
    this.nombreUsuarioActual.set(`${user.nombres} ${user.apellidos}`.trim());
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SEDES
  // ══════════════════════════════════════════════════════════════════════════

  private cargarSedes(): void {
    this.sedesLoading.set(true);
    this.ventasService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes.set(data.filter((s) => s.activo));
        this.sedesLoading.set(false);
      },
      error: () => {
        this.sedesLoading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Sedes',
          detail: 'No se pudieron cargar las sedes',
        });
      },
    });
  }

  onSedeChange(sedeId: number | null): void {
    this.sedeSeleccionada.set(sedeId);
    this.familiaSeleccionada.set(null);
    this.productoTemp.set(null);
    this.cargarProductos(true);
    this.cargarFamilias();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRODUCTOS
  // ══════════════════════════════════════════════════════════════════════════

  private cargarProductos(resetear = true): void {
    if (!this.sedeSeleccionada()) {
      this.productosCargados.set([]);
      this.productosFiltrados.set([]);
      this.productosLoading.set(false);
      return;
    }

    if (resetear) {
      this.paginaActual.set(1);
      this.productosCargados.set([]);
      this.productosFiltrados.set([]);
      this.productosLoading.set(true);
    } else {
      this.cargandoMas.set(true);
    }

    this.ventasService
      .obtenerProductosConStock(
        this.sedeSeleccionada() ?? undefined,
        this.familiaSeleccionada() ?? undefined,
        this.paginaActual(),
        this.SIZE_PAGE,
      )
      .subscribe({
        next: (response) => {
          this.totalRegistros.set(response.pagination.total_records);
          const nuevos = response.data.map((p) => this.ventasService.mapearProductoConStock(p));
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
            summary: 'Error',
            detail: 'No se pudieron cargar los productos',
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
    const sedeId = this.sedeSeleccionada();
    if (!sedeId) {
      console.warn('Esperando ID de sede para cargar familias...');
      return;
    }
    this.familiasLoading.set(true);
    this.ventasService.obtenerCategoriasConStock(Number(sedeId)).subscribe({
      next: (cats) => {
        this.familiasDisponibles.set(cats.map((c) => ({ label: c.nombre, value: c.id_categoria })));
        this.familiasLoading.set(false);
      },
      error: (err : any) => {
        console.error('Error al cargar familias con stock:', err);
        this.familiasLoading.set(false);
      },
    });
  }

  onFamiliaChange(idCategoria: number | null): void {
    this.familiaSeleccionada.set(idCategoria);
    this.cargarProductos(true);
  }

  buscarProductos(event: AutoCompleteCompleteEvent): void {
    const query = event.query.trim();
    if (query.length < 3) {
      this.productosSugeridos.set([]);
      return;
    }
    this.ventasService
      .buscarProductosVentas(
        query,
        this.sedeSeleccionada() ?? undefined,
        this.familiaSeleccionada() ?? undefined,
      )
      .subscribe({
        next: (res) => {
          this.productosSugeridos.set(
            res.data.map((p) => this.ventasService.mapearAutocompleteVentas(p)),
          );
        },
        error: () => this.productosSugeridos.set([]),
      });
  }

  onProductoSeleccionado(productoOEvento: any): void {
    const producto: ProductoUIAdmin = productoOEvento?.value ?? productoOEvento;
    if (!producto || typeof producto !== 'object' || !producto.nombre) return;
    this.seleccionarProducto(producto);
    setTimeout(() => {
      this.productoSeleccionadoBusqueda.set(null);
      this.productosSugeridos.set([]);
    }, 50);
  }

  seleccionarProducto(producto: ProductoUIAdmin): void {
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
        summary: 'Stock Insuficiente',
        detail: `Solo hay ${producto.stock} unidades disponibles en ${producto.sede}`,
      });
      return;
    }

    const precioUnitario = this.precioSegunTipo();
    const item: ItemVentaUIAdmin = {
      productId: producto.id,
      codigo: producto.codigo,
      quantity: cantidad,
      unitPrice: precioUnitario,
      description: producto.nombre,
      total: precioUnitario * cantidad,
      igvUnitario: Number((precioUnitario - precioUnitario / (1 + IGV_RATE_ADMIN)).toFixed(2)),
    };

    const lista = [...this.productosSeleccionados()];
    const idx = lista.findIndex(
      (p) => p.productId === item.productId && p.unitPrice === item.unitPrice,
    );

    if (idx >= 0) {
      const actualizado = { ...lista[idx] };
      actualizado.quantity += cantidad;
      actualizado.total = actualizado.quantity * actualizado.unitPrice;
      if (actualizado.quantity > producto.stock) {
        this.messageService.add({
          severity: 'error',
          summary: 'Stock Insuficiente',
          detail: `Solo hay ${producto.stock} unidades disponibles`,
        });
        return;
      }
      lista[idx] = actualizado;
    } else {
      lista.push(item);
    }

    this.productosSeleccionados.set(lista);
    this.messageService.add({
      severity: 'success',
      summary: 'Producto Agregado',
      detail: `${cantidad} × ${producto.nombre}`,
    });
    this.productoTemp.set(null);
    this.cantidadTemp.set(1);
  }

  eliminarProducto(index: number): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar este producto del carrito?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const lista = [...this.productosSeleccionados()];
        lista.splice(index, 1);
        this.productosSeleccionados.set(lista);
        this.messageService.add({
          severity: 'info',
          summary: 'Producto Eliminado',
          detail: 'El producto fue removido del carrito',
        });
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CLIENTE
  // ══════════════════════════════════════════════════════════════════════════

  private cargarTiposDocumento(): void {
    this.ventasService.obtenerTiposDocumento().subscribe({
      next: (tipos) => this.tiposDocumento.set(tipos),
      error: () => console.warn('No se pudieron cargar tipos de documento'),
    });
  }

  validarSoloNumeros(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '').slice(0, this.longitudDocumento());
    this.clienteDocumento.set(input.value);
    if (this.clienteEncontrado()) this.limpiarCliente();
    this.busquedaRealizada.set(false);
  }

  buscarCliente(): void {
    if (!this.botonClienteHabilitado() || this.clienteEncontrado()) return;
    this.clienteLoading.set(true);
    this.busquedaRealizada.set(false);
    this.ventasService.buscarCliente(this.clienteDocumento(), this.tipoComprobante()).subscribe({
      next: (res) => {
        this.clienteEncontrado.set(res);
        this.busquedaRealizada.set(true);
        this.clienteLoading.set(false);
        this.editandoCliente.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente Encontrado',
          detail: res.name,
        });
      },
      error: () => {
        this.clienteEncontrado.set(null);
        this.busquedaRealizada.set(true);
        this.clienteLoading.set(false);
        this.sincronizarDocumentoEnForm();
      },
    });
  }

  limpiarCliente(): void {
    this.clienteEncontrado.set(null);
    this.clienteDocumento.set('');
    this.busquedaRealizada.set(false);
    this.editandoCliente.set(false);
    this.resetNuevoClienteForm();
  }

  private sincronizarDocumentoEnForm(): void {
    const doc = this.clienteDocumento().trim();
    const tipos = this.tiposDocumento();
    this.nuevoClienteForm.documentValue = doc;
    if (doc.length === 8) {
      const dni = tipos.find((t) => t.description?.toUpperCase().includes('DNI'));
      if (dni) this.nuevoClienteForm.documentTypeId = dni.documentTypeId;
    } else if (doc.length === 11) {
      const ruc = tipos.find((t) => t.description?.toUpperCase().includes('RUC'));
      if (ruc) this.nuevoClienteForm.documentTypeId = ruc.documentTypeId;
    }
  }

  private resetNuevoClienteForm(): void {
    this.nuevoClienteForm = {
      documentTypeId: null,
      documentValue: '',
      name: '',
      address: '',
      email: '',
      phone: '',
    };
  }

  crearNuevoCliente(): void {
    const { documentTypeId, documentValue, name } = this.nuevoClienteForm;
    if (!documentTypeId || !documentValue.trim() || !name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Tipo de documento, número y nombre son obligatorios',
      });
      return;
    }
    this.creandoCliente.set(true);
    const request: CrearClienteAdminRequest = {
      documentTypeId,
      documentValue: documentValue.trim(),
      name: name.trim(),
      address: this.nuevoClienteForm.address.trim() || undefined,
      email: this.nuevoClienteForm.email.trim() || undefined,
      phone: this.nuevoClienteForm.phone.trim() || undefined,
    };
    this.ventasService.crearCliente(request).subscribe({
      next: (res: ClienteAdminResponse) => {
        this.creandoCliente.set(false);
        const nuevo: ClienteBusquedaAdminResponse = {
          customerId: res.customerId,
          name: res.name,
          documentValue: res.documentValue,
          documentTypeDescription: res.documentTypeDescription,
          documentTypeSunatCode: res.documentTypeSunatCode,
          invoiceType: res.invoiceType as 'BOLETA' | 'FACTURA',
          status: res.status,
          address: res.address,
          email: res.email,
          phone: res.phone,
          displayName: res.displayName,
        };
        this.clienteDocumento.set(res.documentValue);
        this.clienteEncontrado.set(nuevo);
        this.busquedaRealizada.set(true);
        this.editandoCliente.set(false);
        this.resetNuevoClienteForm();
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente Creado',
          detail: `${nuevo.name} fue registrado y seleccionado`,
        });
      },
      error: (err: any) => {
        this.creandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al crear cliente',
          detail: err?.error?.message ?? 'Ocurrió un error al registrar el cliente',
        });
      },
    });
  }

  iniciarEdicionCliente(): void {
    const c = this.clienteEncontrado();
    if (!c) return;
    this.editarClienteForm = {
      name: c.name ?? '',
      address: c.address ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
    };
    this.editandoCliente.set(true);
  }

  cancelarEdicionCliente(): void {
    this.editandoCliente.set(false);
  }

  guardarCambiosCliente(): void {
    const cliente = this.clienteEncontrado();
    if (!cliente) return;
    this.guardandoCliente.set(true);
    const payload: ActualizarClienteAdminRequest = {
      name: this.editarClienteForm.name.trim() || undefined,
      address: this.editarClienteForm.address.trim() || undefined,
      email: this.editarClienteForm.email.trim() || undefined,
      phone: this.editarClienteForm.phone.trim() || undefined,
    };
    this.ventasService.actualizarCliente(cliente.customerId, payload).subscribe({
      next: (res: ClienteAdminResponse) => {
        this.guardandoCliente.set(false);
        this.editandoCliente.set(false);
        this.clienteEncontrado.set({
          ...cliente,
          name: res.name,
          address: res.address,
          email: res.email,
          phone: res.phone,
        });
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente Actualizado',
          detail: 'Los datos del cliente se actualizaron correctamente',
        });
      },
      error: (err: any) => {
        this.guardandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al actualizar cliente',
          detail: err?.error?.message ?? 'Ocurrió un error al actualizar el cliente',
        });
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // WIZARD
  // ══════════════════════════════════════════════════════════════════════════

  nextStep(): void {
    if (!this.validarPasoActual()) return;
    const curr = this.activeStep();
    if (curr < this.steps.length - 1) this.activeStep.set(curr + 1);
  }

  prevStep(): void {
    const curr = this.activeStep();
    if (curr > 0) this.activeStep.set(curr - 1);
  }

  private validarPasoActual(): boolean {
    switch (this.activeStep()) {
      case 0:
        if (!this.clienteEncontrado()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cliente Requerido',
            detail: 'Debe buscar y seleccionar un cliente',
          });
          return false;
        }
        return true;
      case 1:
        if (!this.sedeSeleccionada()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Sede Requerida',
            detail: 'Debe seleccionar una sede para continuar',
          });
          return false;
        }
        if (this.productosSeleccionados().length === 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Carrito Vacío',
            detail: 'Debe agregar al menos un producto',
          });
          return false;
        }
        return true;
      case 2:
        if (this.metodoPagoSeleccionado() === 1 && this.montoRecibido() < this.total()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Monto Insuficiente',
            detail: 'El monto recibido debe ser mayor o igual al total',
          });
          return false;
        }
        if (this.metodoPagoSeleccionado() !== 1 && !this.numeroOperacion().trim()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Número de Operación Requerido',
            detail: 'Debe ingresar el número de operación',
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  generarVenta(): void {
    if (!this.clienteEncontrado()) return;
    this.confirmationService.confirm({
      message: '¿Está seguro de generar esta venta?',
      header: 'Confirmar Venta',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept: () => this.procesarVenta(),
    });
  }

  private procesarVenta(): void {
    this.loading.set(true);

    this.snapshotCliente.set(this.clienteEncontrado());
    this.snapshotSede.set(this.nombreSedeSeleccionada());
    this.snapshotMetodoPago.set(this.getLabelMetodoPago(this.metodoPagoSeleccionado()));
    this.snapshotTipoComprobante.set(this.tipoComprobante());

    const subtotal = Number(this.subtotal().toFixed(2));
    const igv = Number(this.igv().toFixed(2));
    const total = Number(this.total().toFixed(2));
    const serie = this.tipoComprobante() === 1 ? 'F001' : 'B001';

    const fechaVencimiento = new Date();
    if (this.metodoPagoSeleccionado() !== 1) {
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    }

    const request: RegistroVentaAdminRequest = {
      customerId: this.clienteEncontrado()!.customerId,
      saleTypeId: 1,
      serie,
      receiptTypeId: this.tipoComprobante(),
      dueDate: fechaVencimiento.toISOString(),
      operationType: OPERATION_TYPE_VENTA_INTERNA, // ← '0101'
      subtotal,
      igv,
      isc: 0,
      total,
      currencyCode: CURRENCY_PEN_ADMIN, // ← 'PEN'
      responsibleId: this.idUsuarioActual().toString(),
      branchId: this.sedeSeleccionada() ?? 0,
      paymentMethodId: this.metodoPagoSeleccionado(),
      operationNumber: this.metodoPagoSeleccionado() === 1 ? null : this.numeroOperacion(),
      items: this.productosSeleccionados().map((item) => {
        const producto = this.productosCargados().find((p) => p.id === item.productId);
        return {
          productId: producto ? producto.id.toString() : item.productId.toString(),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice.toFixed(2)),
          description: item.description,
          total: Number(item.total.toFixed(2)),
        };
      }),
    };

    console.log('📦 Body enviado (admin):', JSON.stringify(request, null, 2));

    this.ventasService.registrarVenta(request).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        this.comprobanteGenerado.set({
          numero_completo: `${response.serie ?? serie}-${String(response.receiptNumber ?? response.numero ?? '').padStart(8, '0')}`,
          fec_emision: response.createdAt ?? response.fec_emision ?? new Date().toISOString(),
          total: response.total ?? total,
          serie: response.serie ?? serie,
          numero: response.receiptNumber ?? response.numero ?? 0,
          id_comprobante: response.receiptId ?? response.id_comprobante ?? 0,
        });
        this.messageService.add({
          severity: 'success',
          summary: '¡Venta Exitosa!',
          detail: `Comprobante ${serie}-${String(response.receiptNumber ?? response.numero ?? '').padStart(8, '0')} generado`,
          life: 5000,
        });
      },
      error: (err: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Generar Venta',
          detail: err.error?.message ?? 'Ocurrió un error al procesar la venta',
        });
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UTILIDADES
  // ══════════════════════════════════════════════════════════════════════════

  nuevaVenta(): void {
    this.confirmationService.confirm({
      message: '¿Desea realizar una nueva venta?',
      header: 'Nueva Venta',
      icon: 'pi pi-refresh',
      accept: () => this.resetearFormulario(),
    });
  }

  verListado(): void {
    this.router.navigate(['/admin/historial-ventas-administracion']);
  }

  private resetearFormulario(): void {
    this.tipoComprobante.set(2);
    this.clienteDocumento.set('');
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
    this.snapshotCliente.set(null);
    this.snapshotSede.set('');
    this.snapshotMetodoPago.set('');
    this.snapshotTipoComprobante.set(2);
    this.activeStep.set(0);
    this.cargarProductos(true);
    this.cargarFamilias();
  }

  obtenerSeveridadStock(stock: number | undefined): 'success' | 'warn' | 'danger' {
    if (!stock || stock === 0) return 'danger';
    if (stock <= 5) return 'danger';
    if (stock <= 20) return 'warn';
    return 'success';
  }

  getLabelMetodoPago(id: number): string {
    return METODOS_PAGO_ADMIN.find((m) => m.id === id)?.description ?? 'N/A';
  }

  obtenerSiglasDocumento(desc: string): string {
    if (!desc) return '';
    if (desc.includes('DNI')) return 'DNI';
    if (desc.includes('RUC')) return 'RUC';
    const match = desc.match(/\(([^)]+)\)/);
    return match ? match[1] : desc;
  }

  formatearDocumentoCompleto(): string {
    const c = this.clienteEncontrado();
    if (!c?.documentTypeDescription) return '';
    return `${this.obtenerSiglasDocumento(c.documentTypeDescription)}: ${c.documentValue}`;
  }

  formatearDocumentoSnapshot(): string {
    const c = this.snapshotCliente();
    if (!c?.documentTypeDescription) return '';
    return `${this.obtenerSiglasDocumento(c.documentTypeDescription)}: ${c.documentValue}`;
  }

  onTipoComprobanteChange(): void {
    this.clienteDocumento.set('');
    this.clienteEncontrado.set(null);
    this.busquedaRealizada.set(false);
  }
}
