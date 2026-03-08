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
import { AccountReceivableService } from '../../services/account-receivable.service';
import { SedeAlmacenService } from '../../services/sede-almacen.service';
import { ActivatedRoute } from '@angular/router';
import { QuoteService } from '../../services/quote.service';
import { Quote } from '../../interfaces/quote.interface';

import { DispatchService } from '../../services/dispatch.service';
import { CreateDispatchRequest } from '../../interfaces/dispatch.interfaces';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

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
  PromocionAdmin,
  MetodoPagoAdmin,
  TipoVentaAdmin,
  TipoComprobanteAdmin,
} from '../../interfaces/ventas.interface';

export type TipoEntrega = 'recojo' | 'delivery';

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
    LoadingOverlayComponent,
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
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteService = inject(QuoteService);
  private readonly arService = inject(AccountReceivableService);
  private readonly dispatchService = inject(DispatchService);

  readonly tituloKicker = 'VENTAS - GENERAR VENTAS';
  readonly subtituloKicker = 'GENERAR NUEVA VENTA (ADMIN)';
  readonly iconoCabecera = 'pi pi-shopping-cart';

  readonly steps = [
    'Productos',
    'Cliente y Comprobante',
    'Pago, Promociones y Entrega',
    'Confirmar Venta',
  ];

  tiposVenta = signal<TipoVentaAdmin[]>([]);
  tiposComprobante = signal<TipoComprobanteAdmin[]>([]);

  readonly opcionesTipoPrecio = [
    { label: 'Unidad', value: 'unidad' },
    { label: 'Caja', value: 'caja' },
    { label: 'Mayorista', value: 'mayorista' },
  ];

  readonly tipoEntregaOptions = [
    { label: 'Recojo en tienda', value: 'recojo', icon: 'pi pi-shop' },
    { label: 'Delivery', value: 'delivery', icon: 'pi pi-truck' },
  ];

  private readonly SIZE_PAGE = 10;

  tipoDocBusqueda = signal<number | null>(null);
  reniecLoading = signal(false);
  nombreDesdeReniec = signal(false);

  idUsuarioActual = signal<string>('0');
  nombreUsuarioActual = signal('');

  sedes = signal<SedeAdmin[]>([]);
  sedesLoading = signal(false);
  sedeSeleccionada = signal<number | null>(null);

  // ← interno: solo para despacho, sin selector visual
  almacenSeleccionado = signal<number | null>(null);

  activeStep = signal(0);
  isLoading = signal(false);
  tipoComprobante = signal(2);

  clienteDocumento = signal('');
  clienteEncontrado = signal<ClienteBusquedaAdminResponse | null>(null);
  clienteLoading = signal(false);
  busquedaRealizada = signal(false);

  tiposDocumento = signal<TipoDocumentoAdmin[]>([]);
  tipoDocBoleta = signal<number | null>(null);
  creandoCliente = signal(false);
  editandoCliente = signal(false);
  guardandoCliente = signal(false);

  metodosPago = signal<MetodoPagoAdmin[]>([]);

  cotizacionOrigen = signal<number | null>(null);
  tipoPagoOrigen = signal<'contado' | 'credito'>('contado');

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

  productosSeleccionados = signal<ItemVentaUIAdmin[]>([]);

  promocionesDisponibles = signal<PromocionAdmin[]>([]);
  promocionAplicada = signal<PromocionAdmin | null>(null);
  promocionesLoading = signal(false);

  tipoEntrega = signal<TipoEntrega>('recojo');
  direccionDelivery = signal('');
  costoDelivery = signal(0);

  metodoPagoSeleccionado = signal<number | null>(null);
  montoRecibido = signal(0);
  numeroOperacion = signal('');

  comprobanteGenerado = signal<RegistroVentaAdminResponse | null>(null);
  loading = signal(false);

  snapshotCliente = signal<ClienteBusquedaAdminResponse | null>(null);
  snapshotSede = signal<string>('');
  snapshotMetodoPago = signal<string>('');
  snapshotTipoComprobante = signal<number>(2);

  tipoVentaSeleccionado = signal<number>(1);

  codigoPromocionInput = signal('');
  promoNoEncontrada = signal(false);
  promoYaAplicada = signal(false);

  // ─── COMPUTEDS ─────────────────────────────────────────────────────────────

  readonly nombreTipoVentaSeleccionado = computed(
    () => this.tiposVenta().find((t) => t.id === this.tipoVentaSeleccionado())?.descripcion ?? '—',
  );

  private iconoPorMetodoPago(codSunat: string): string {
    const iconos: Record<string, string> = {
      '008': 'pi pi-money-bill',
      '005': 'pi pi-credit-card',
      '006': 'pi pi-credit-card',
      '003': 'pi pi-arrow-right-arrow-left',
      '001': 'pi pi-building',
    };
    return iconos[codSunat] ?? 'pi pi-wallet';
  }

  readonly metodoPagoOptions = computed(() =>
    this.metodosPago().map((m) => ({
      label: m.descripcion,
      value: m.id,
      icon: this.iconoPorMetodoPago(m.codSunat),
    })),
  );

  readonly tiposDocumentoBoleta = computed(() =>
    this.tiposDocumento().filter((t) => !t.description?.toUpperCase().includes('RUC')),
  );

  readonly tiposDocumentoBoleta2 = computed(() =>
    this.tiposDocumento().filter((t) => !t.description?.toUpperCase().includes('RUC')),
  );

  readonly tiposDocumentoParaBusqueda = computed(() =>
    this.tipoComprobante() === 1
      ? this.tiposDocumento().filter((t) => t.description?.toUpperCase().includes('RUC'))
      : this.tiposDocumento(),
  );

  readonly tipoDocRucId = computed(
    () =>
      this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('RUC'))
        ?.documentTypeId ?? null,
  );

  readonly documentoConfig = computed(() => {
    if (this.tipoComprobante() === 1) {
      return {
        maxLength: 11,
        minLength: 11,
        soloNumeros: true,
        placeholder: 'Ingrese RUC (11 dígitos)',
      };
    }
    const tipo = this.tiposDocumento().find((t) => t.documentTypeId === this.tipoDocBoleta());
    const desc = tipo?.description?.toUpperCase() ?? '';
    if (desc.includes('DNI'))
      return {
        maxLength: 8,
        minLength: 8,
        soloNumeros: true,
        placeholder: 'Ingrese DNI (8 dígitos)',
      };
    if (desc.includes('CARNET') || desc.includes('EXTRANJERI'))
      return {
        maxLength: 12,
        minLength: 9,
        soloNumeros: false,
        placeholder: 'Ingrese Carnet de Extranjería',
      };
    if (desc.includes('PASAPORTE'))
      return {
        maxLength: 20,
        minLength: 5,
        soloNumeros: false,
        placeholder: 'Ingrese número de pasaporte',
      };
    return {
      maxLength: 20,
      minLength: 1,
      soloNumeros: false,
      placeholder: 'Ingrese número de documento',
    };
  });

  readonly longitudDocumento = computed(() => this.documentoConfig().maxLength);

  readonly botonClienteHabilitado = computed(() => {
    const len = this.clienteDocumento()?.trim().length ?? 0;
    const config = this.documentoConfig();
    return len >= config.minLength && len <= config.maxLength;
  });

  readonly descuentoPromocion = computed(() => {
    const promo = this.promocionAplicada();
    if (!promo) return 0;
    const base = this.productosSeleccionados().reduce((s, i) => s + i.total, 0);
    return this.esPorcentaje(promo.tipo)
      ? Number(((base * promo.valor) / 100).toFixed(2))
      : Number(promo.valor.toFixed(2));
  });

  readonly total = computed(() => {
    const base = this.productosSeleccionados().reduce((s, i) => s + i.total, 0);
    const delivery = this.tipoEntrega() === 'delivery' ? this.costoDelivery() : 0;
    return Number((base - this.descuentoPromocion() + delivery).toFixed(2));
  });

  readonly subtotal = computed(() => this.total() / (1 + IGV_RATE_ADMIN));
  readonly igv = computed(() => this.subtotal() * IGV_RATE_ADMIN);

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

  readonly esDniSeleccionado = computed(() => {
    const tipoId = this.nuevoClienteForm.documentTypeId;
    if (!tipoId) return false;
    const tipo = this.tiposDocumento().find((t) => t.documentTypeId === tipoId);
    const desc = tipo?.description?.toUpperCase() ?? '';
    return (
      desc.includes('DNI') ||
      desc.includes('IDENTIDAD') ||
      desc.includes('RUC') ||
      desc.includes('CONTRIBUYENTE')
    );
  });

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.cargarSesion();
    this.cargarTiposDocumento();
    this.cargarSedes();
    this.leerParamsCotizacion();
    this.cargarMetodosPago();
    this.cargarTiposVenta();
    this.cargarTiposComprobante();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.cargarFamilias(), 0);
  }

  // ─── SESIÓN ────────────────────────────────────────────────────────────────

  private cargarSesion(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.idUsuarioActual.set(user.userId?.toString() ?? '0');
    this.nombreUsuarioActual.set(`${user.nombres} ${user.apellidos}`.trim());
    if (user.idSede) {
      this.sedeSeleccionada.set(user.idSede);
      this.onSedeChange(user.idSede);
    }
  }

  private cargarMetodosPago(): void {
    this.ventasService.obtenerMetodosPago().subscribe({
      next: (data) => {
        // Solo Efectivo, Tarjeta Débito, Tarjeta Crédito y Transferencia
        const filtrados = data.filter((m) => ['008', '005', '006', '003'].includes(m.codSunat));
        this.metodosPago.set(filtrados);
        const efectivo = filtrados.find((m) => m.codSunat === '008');
        if (efectivo) this.metodoPagoSeleccionado.set(efectivo.id);
      },
    });
  }

  private cargarTiposVenta(): void {
    this.ventasService.obtenerTiposVenta().subscribe({
      next: (data) => this.tiposVenta.set(data),
    });
  }

  private cargarTiposComprobante(): void {
    this.ventasService.obtenerTiposComprobante().subscribe({
      next: (data) => {
        const filtrados = data.filter((t) => t.codSunat === '03' || t.codSunat === '01');
        this.tiposComprobante.set(filtrados);
      },
    });
  }

  private cargarTiposDocumento(): void {
    this.ventasService.obtenerTiposDocumento().subscribe({
      next: (tipos) => {
        this.tiposDocumento.set(tipos);
        const dni = tipos.find((t) => t.description?.toUpperCase().includes('DNI'));
        if (dni) this.tipoDocBoleta.set(dni.documentTypeId);
      },
      error: () => console.warn('No se pudieron cargar tipos de documento'),
    });
  }

  // ─── SEDES ─────────────────────────────────────────────────────────────────

  private cargarSedes(): void {
    this.sedesLoading.set(true);
    this.ventasService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes.set(data.filter((s) => s.activo));
        this.sedesLoading.set(false);
        const cotizId = this.cotizacionOrigen();
        if (cotizId) this.cargarDatosDeCotizacion(cotizId);
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
    this.almacenSeleccionado.set(null);
    this.familiaSeleccionada.set(null);
    this.productoTemp.set(null);
    this.cargarProductos(true);
    this.cargarFamilias();
    if (!sedeId) return;
    // Auto-selección silenciosa del primer almacén (para despacho)
    this.sedeAlmacenService.loadWarehouseOptionsBySede(sedeId).subscribe({
      next: (options) => {
        if (options.length > 0) this.almacenSeleccionado.set(options[0].value);
      },
      error: () => console.warn('No se pudieron cargar almacenes de esta sede'),
    });
  }

  // ─── PRODUCTOS ─────────────────────────────────────────────────────────────

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

  private cargarFamilias(): void {
    const sedeId = this.sedeSeleccionada();
    if (!sedeId) return;
    this.familiasLoading.set(true);
    this.ventasService.obtenerCategoriasConStock(Number(sedeId)).subscribe({
      next: (cats) => {
        this.familiasDisponibles.set(cats.map((c) => ({ label: c.nombre, value: c.id_categoria })));
        this.familiasLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error al cargar familias:', err);
        this.familiasLoading.set(false);
      },
    });
  }

  onFamiliaChange(idCategoria: number | null): void {
    this.familiaSeleccionada.set(idCategoria);
    this.cargarProductos(true);
  }

  cargarMasProductos(): void {
    if (!this.hayMasPaginas() || this.cargandoMas()) return;
    this.paginaActual.update((p) => p + 1);
    this.cargarProductos(false);
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

  // ─── CLIENTE ───────────────────────────────────────────────────────────────

  onTipoDocBoleta(id: number): void {
    this.tipoDocBoleta.set(id);
    this.limpiarCliente();
  }

  validarSoloNumeros(event: any): void {
    const input = event.target;
    const config = this.documentoConfig();
    input.value = config.soloNumeros
      ? input.value.replace(/[^0-9]/g, '').slice(0, config.maxLength)
      : input.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, config.maxLength);
    this.clienteDocumento.set(input.value);
    if (this.clienteEncontrado()) this.limpiarCliente();
    this.busquedaRealizada.set(false);
  }

  buscarCliente(): void {
    if (!this.botonClienteHabilitado() || this.clienteEncontrado()) return;
    this.clienteLoading.set(true);
    this.busquedaRealizada.set(false);
    // ✅ Sin receiptTypeId — el backend determina el invoiceType
    this.ventasService.buscarCliente(this.clienteDocumento()).subscribe({
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

  onDocumentoNuevoClienteChange(valor: string): void {
    this.nuevoClienteForm.documentValue = valor;
    this.nombreDesdeReniec.set(false);
    const tipos = this.tiposDocumento();
    const tipoId = this.nuevoClienteForm.documentTypeId;
    if (!tipoId) return;
    const tipoSel = tipos.find((t) => t.documentTypeId === tipoId);
    const desc = tipoSel?.description?.toUpperCase() ?? '';
    const esDni = desc.includes('DNI') || desc.includes('IDENTIDAD');
    const esRuc = desc.includes('RUC') || desc.includes('CONTRIBUYENTE');
    const debeConsultar = (esDni && valor.length === 8) || (esRuc && valor.length === 11);
    if (!debeConsultar) return;
    this.reniecLoading.set(true);
    this.ventasService.consultarDocumentoIdentidad(valor).subscribe({
      next: (res) => {
        this.reniecLoading.set(false);
        if (res?.nombreCompleto) {
          this.nuevoClienteForm.name = res.nombreCompleto;
          this.nombreDesdeReniec.set(true);
          if (esRuc && res.direccion) this.nuevoClienteForm.address = res.direccion;
          this.messageService.add({
            severity: 'success',
            summary: esRuc ? 'SUNAT' : 'RENIEC',
            detail: res.nombreCompleto,
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: esRuc ? 'RUC no encontrado' : 'DNI no encontrado',
            detail: 'No se encontraron datos. Ingrese el nombre manualmente.',
            life: 3000,
          });
        }
      },
      error: () => {
        this.reniecLoading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin conexión a RENIEC',
          detail: 'Ingrese el nombre manualmente.',
          life: 3000,
        });
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
    const tipoActivo =
      this.tipoComprobante() === 1
        ? tipos.find((t) => t.description?.toUpperCase().includes('RUC'))
        : tipos.find((t) => t.documentTypeId === this.tipoDocBoleta());
    if (tipoActivo) this.nuevoClienteForm.documentTypeId = tipoActivo.documentTypeId;
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
          invoiceType: res.invoiceType,
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

  onTipoComprobanteChange(): void {
    this.limpiarCliente();
    if (this.tipoComprobante() === 2) {
      const dni = this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('DNI'));
      if (dni) this.tipoDocBoleta.set(dni.documentTypeId);
    }
  }

  // ─── COTIZACIÓN ────────────────────────────────────────────────────────────

  private leerParamsCotizacion(): void {
    const cotizacionId = this.route.snapshot.queryParamMap.get('cotizacion');
    const tipo = this.route.snapshot.queryParamMap.get('tipo') as 'contado' | 'credito';
    if (!cotizacionId) return;
    this.cotizacionOrigen.set(Number(cotizacionId));
    this.tipoPagoOrigen.set(tipo ?? 'contado');
  }

  private cargarDatosDeCotizacion(id: number): void {
    this.loading.set(true);
    this.quoteService.getQuoteById(id).subscribe({
      next: (cotizacion) => {
        this.loading.set(false);
        this.prefillDesdeCotizacion(cotizacion);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la cotización',
        });
      },
    });
  }

  private prefillDesdeCotizacion(cotizacion: Quote): void {
    // ✅ onSedeChange ya auto-selecciona el primer almacén internamente
    if (cotizacion.id_sede) {
      this.onSedeChange(cotizacion.id_sede);
    }
    const tipoDoc = cotizacion.cliente?.id_tipo_documento;
    this.tipoComprobante.set(tipoDoc === 1 ? 1 : 2);
    if (cotizacion.cliente?.valor_doc) {
      this.clienteDocumento.set(cotizacion.cliente.valor_doc);
      const nombreCompleto = cotizacion.cliente.razon_social
        ? cotizacion.cliente.razon_social
        : `${cotizacion.cliente.nombre_cliente ?? ''} ${cotizacion.cliente.apellidos_cliente ?? ''}`.trim();
      this.clienteEncontrado.set({
        customerId: String(cotizacion.id_cliente),
        name: nombreCompleto,
        documentValue: cotizacion.cliente.valor_doc,
        documentTypeDescription: tipoDoc === 1 ? 'RUC' : 'DNI',
        documentTypeSunatCode: tipoDoc === 1 ? '6' : '1',
        invoiceType: tipoDoc === 1 ? 'FACTURA' : 'BOLETA',
        status: 'ACTIVO',
        address: cotizacion.cliente.direccion ?? '',
        email: cotizacion.cliente.email ?? '',
        phone: cotizacion.cliente.telefono ?? '',
        displayName: nombreCompleto,
      });
      this.busquedaRealizada.set(true);
    }
    if (cotizacion.detalles?.length) {
      const items: ItemVentaUIAdmin[] = cotizacion.detalles.map((d) => {
        const precio = Number(d.precio);
        const cantidad = Number(d.cantidad);
        return {
          productId: d.id_prod_ref,
          codigo: d.cod_prod,
          quantity: cantidad,
          unitPrice: precio,
          description: d.descripcion,
          total: cantidad * precio,
          igvUnitario: Number((precio - precio / (1 + IGV_RATE_ADMIN)).toFixed(2)),
        };
      });
      this.productosSeleccionados.set(items);
    }
    if (this.tipoPagoOrigen() === 'credito') {
      const credito = this.metodosPago().find((m) => m.codSunat === '003' || m.codSunat === '005');
      if (credito) this.metodoPagoSeleccionado.set(credito.id);
    }
    this.activeStep.set(1);
    this.messageService.add({
      severity: 'info',
      summary: 'Cotización cargada',
      detail: `Datos pre-llenados desde cotización #${this.cotizacionOrigen()}`,
      life: 4000,
    });
  }

  // ─── PROMOCIONES ───────────────────────────────────────────────────────────

  private cargarPromociones(): void {
    this.promocionesLoading.set(true);
    this.ventasService.obtenerPromocionesActivas().subscribe({
      next: (promos) => {
        const normalizadas: PromocionAdmin[] = promos.map((p) => ({
          ...p,
          activo: this.normalizarActivo(p.activo),
        }));
        const activas = normalizadas.filter((p) => p.activo);
        this.promocionesDisponibles.set(activas);
        this.promocionesLoading.set(false);
        if (!activas.length) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin promociones',
            detail: 'No hay promociones disponibles',
            life: 3000,
          });
        }
      },
      error: (err) => {
        this.promocionesLoading.set(false);
        this.promocionesDisponibles.set([]);
        if (err?.status !== 404) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Promociones',
            detail: 'No se pudieron cargar las promociones',
            life: 3000,
          });
        }
      },
    });
  }

  aplicarPromocion(promo: PromocionAdmin): void {
    this.promocionAplicada.set(promo);
    this.messageService.add({
      severity: 'success',
      summary: 'Promoción aplicada',
      detail: `${promo.concepto} — descuento: ${this.esPorcentaje(promo.tipo) ? `${promo.valor}%` : `S/. ${promo.valor.toFixed(2)}`}`,
      life: 3000,
    });
  }

  // ─── ENTREGA ───────────────────────────────────────────────────────────────

  onTipoEntregaChange(tipo: TipoEntrega): void {
    this.tipoEntrega.set(tipo);
    if (tipo === 'recojo') {
      this.direccionDelivery.set('');
      this.costoDelivery.set(0);
    } else {
      const dir = this.clienteEncontrado()?.address ?? '';
      if (dir) this.direccionDelivery.set(dir);
    }
  }

  // ─── WIZARD ────────────────────────────────────────────────────────────────

  nextStep(): void {
    if (!this.validarPasoActual()) return;
    const curr = this.activeStep();
    if (curr < this.steps.length - 1) {
      this.activeStep.set(curr + 1);
      if (curr + 1 === 2) this.cargarPromociones();
    }
  }

  prevStep(): void {
    const curr = this.activeStep();
    if (curr > 0) this.activeStep.set(curr - 1);
  }

  private validarPasoActual(): boolean {
    switch (this.activeStep()) {
      case 0:
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
      case 1:
        if (!this.clienteEncontrado()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cliente Requerido',
            detail: 'Debe buscar y seleccionar un cliente',
          });
          return false;
        }
        return true;
      case 2:
        if (this.tipoEntrega() === 'delivery' && !this.direccionDelivery().trim()) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Dirección Requerida',
            detail: 'Ingrese la dirección de delivery',
          });
          return false;
        }
        if (this.tipoPagoOrigen() === 'credito') return true;
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

  // ─── VENTA ─────────────────────────────────────────────────────────────────

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
    this.snapshotMetodoPago.set(this.getLabelMetodoPago(this.metodoPagoSeleccionado()!));
    this.snapshotTipoComprobante.set(this.tipoComprobante());

    const subtotal = Number(this.subtotal().toFixed(2));
    const igv = Number(this.igv().toFixed(2));
    const total = Number(this.total().toFixed(2));
    const serie = this.tipoComprobante() === 1 ? 'F001' : 'B001';
    const cotizId = this.cotizacionOrigen();

    const fechaVencimiento = new Date();
    if (this.metodoPagoSeleccionado() !== 1)
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    const request: RegistroVentaAdminRequest = {
      customerId: this.clienteEncontrado()!.customerId,
      saleTypeId: this.tipoVentaSeleccionado(),
      serie,
      receiptTypeId: this.tipoComprobante(),
      dueDate: fechaVencimiento.toISOString(),
      operationType: '0101',  
      currencyCode: 'PEN',    
      subtotal,
      igv,
      isc: 0,
      total,
      descuento: Number(this.descuentoPromocion().toFixed(2)),
      promotionId: this.promocionAplicada()?.idPromocion ?? null,
      esCreditoPendiente: this.tipoPagoOrigen() === 'credito',
      responsibleId: this.idUsuarioActual().toString(),
      branchId: this.sedeSeleccionada() ?? 0,
      warehouseId: this.almacenSeleccionado() ?? 0,
      paymentMethodId: this.metodoPagoSeleccionado()!,
      operationNumber: this.metodoPagoSeleccionado() === 1 ? null : this.numeroOperacion(),
      items: this.productosSeleccionados().map((item) => ({
        productId: item.productId.toString(),
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toFixed(2)),
        description: item.description,
        total: Number(item.total.toFixed(2)),
      })),
    };


    
    this.ventasService.registrarVenta(request).subscribe({
      next: (response: any) => {
        this.loading.set(false);

        const idComprobante: number =
          response.receiptId ?? response.id_comprobante ?? response.idComprobante ?? 0;

        const numeroCompleto = `${response.serie ?? serie}-${String(response.receiptNumber ?? response.numero ?? '').padStart(8, '0')}`;

        this.comprobanteGenerado.set({
          numeroCompleto: numeroCompleto,
          fecEmision: response.createdAt ?? response.fecEmision ?? new Date().toISOString(),
          total: response.total ?? total,
          serie: response.serie ?? serie,
          numero: response.receiptNumber ?? response.numero ?? 0,
          idComprobante: response.receiptId ?? response.idComprobante ?? 0,
        } as RegistroVentaAdminResponse);

        this.messageService.add({
          severity: 'success',
          summary: '¡Venta Exitosa!',
          detail: `Comprobante ${numeroCompleto} generado`,
          life: 5000,
        });

        // ─── Despacho automático ──────────────────────────────────────────
        const almacenParaDespacho = this.almacenSeleccionado() ?? request.warehouseId;
        const idVentaParaDespacho =
          Number(idComprobante) ||
          Number(response.receiptId) ||
          Number(response.id_comprobante) ||
          0;

        if (idVentaParaDespacho > 0 && almacenParaDespacho > 0) {
          const direccion =
            this.tipoEntrega() === 'delivery'
              ? this.direccionDelivery().trim()
              : this.clienteEncontrado()?.address?.trim() || 'Recojo en tienda';

          const dispatchPayload: CreateDispatchRequest = {
            id_venta_ref: idVentaParaDespacho,
            id_usuario_ref: this.idUsuarioActual().toString(),
            id_almacen_origen: almacenParaDespacho,
            direccion_entrega: direccion,
            observacion: `Venta ${numeroCompleto}`,
            detalles: this.productosSeleccionados().map((item: ItemVentaUIAdmin) => ({
              id_producto: Number(item.productId),
              cantidad_solicitada: item.quantity,
            })),
          };

          this.dispatchService.createDispatch(dispatchPayload).subscribe({
            next: (despacho) => {
              this.messageService.add({
                severity: 'info',
                summary: 'Despacho Creado',
                detail: `Despacho #${despacho.id_despacho} generado automáticamente`,
                life: 4000,
              });
            },
            error: (err) => {
              console.error('[DESPACHO] error al crear:', err);
              this.messageService.add({
                severity: 'warn',
                summary: 'Venta creada',
                detail:
                  'La venta se registró pero no se pudo crear el despacho. Créalo desde "Nuevo Despacho".',
                life: 6000,
              });
            },
          });
        } else {
          console.warn('[DESPACHO] No se creó despacho automático.', {
            idVentaParaDespacho,
            almacenParaDespacho,
          });
          this.messageService.add({
            severity: 'warn',
            summary: 'Despacho pendiente',
            detail:
              'Venta creada. No se pudo crear el despacho automáticamente. Créalo manualmente.',
            life: 6000,
          });
        }

        // ─── Actualizar cotización de origen ─────────────────────────────
        if (cotizId) {
          this.quoteService.updateQuoteStatus(cotizId, 'APROBADA').subscribe({
            next: () => console.log(`Cotización #${cotizId} marcada como APROBADA`),
            error: () => console.warn('No se pudo actualizar estado de cotización'),
          });
        }

        // ─── Cuenta por cobrar (crédito) ─────────────────────────────────
        if (this.tipoPagoOrigen() === 'credito') {
          const receiptId =
            typeof response.receiptId === 'number' && response.receiptId > 0
              ? response.receiptId
              : typeof response.id_comprobante === 'number' && response.id_comprobante > 0
                ? response.id_comprobante
                : typeof response.idComprobante === 'number' && response.idComprobante > 0
                  ? response.idComprobante
                  : undefined;
          if (!receiptId) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error interno',
              detail:
                'No se pudo registrar la cuenta por cobrar porque el comprobante no tiene ID.',
            });
            return;
          }
          const fechaVenc = new Date();
          fechaVenc.setDate(fechaVenc.getDate() + 30);

          this.arService
            .create({
              salesReceiptId: receiptId,
              userRef: this.clienteEncontrado()!.name,
              totalAmount: total,
              dueDate: fechaVenc.toISOString().split('T')[0],
              paymentTypeId: this.metodoPagoSeleccionado()!,
              currencyCode: 'PEN', // ← literal directo
              observation: cotizId
                ? `Crédito generado desde cotización #${cotizId}`
                : 'Venta a crédito',
            })
            .then((ar) => {
              if (ar) {
                this.messageService.add({
                  severity: 'info',
                  summary: 'Cuenta por Cobrar Creada',
                  detail: `Cuenta #${ar.id} registrada. Saldo: S/. ${ar.pendingBalance.toFixed(2)}`,
                  life: 5000,
                });
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error al crear cuenta por cobrar',
                  detail: this.arService.error() ?? undefined,
                });
              }
            });
        }
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

  // ─── RESET / NAVEGACIÓN ────────────────────────────────────────────────────

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
    const dni = this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('DNI'));
    this.tipoDocBoleta.set(dni?.documentTypeId ?? null);
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
    const efectivo = this.metodosPago().find((m) => m.codSunat === '008');
    this.metodoPagoSeleccionado.set(efectivo?.id ?? null);
    this.montoRecibido.set(0);
    this.numeroOperacion.set('');
    this.comprobanteGenerado.set(null);
    this.snapshotCliente.set(null);
    this.snapshotSede.set('');
    this.snapshotMetodoPago.set('');
    this.snapshotTipoComprobante.set(2);
    this.promocionesDisponibles.set([]);
    this.promocionAplicada.set(null);
    this.tipoEntrega.set('recojo');
    this.direccionDelivery.set('');
    this.costoDelivery.set(0);
    this.activeStep.set(0);
    // ✅ Solo reset interno — sin almacenesOptions
    this.almacenSeleccionado.set(null);
    this.cargarProductos(true);
    this.cargarFamilias();
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  esPorcentaje(tipo: string): boolean {
    return tipo?.toUpperCase().trim() === 'PORCENTAJE';
  }

  private normalizarActivo(activo: any): boolean {
    if (typeof activo === 'boolean') return activo;
    if (typeof activo === 'number') return activo === 1;
    if (activo && typeof activo === 'object' && 'data' in activo) return activo.data[0] === 1;
    return false;
  }

  obtenerSeveridadStock(stock: number | undefined): 'success' | 'warn' | 'danger' {
    if (!stock || stock === 0) return 'danger';
    if (stock <= 5) return 'danger';
    if (stock <= 20) return 'warn';
    return 'success';
  }

  getLabelMetodoPago(id: number | null): string {
    if (id === null) return 'N/A';
    return this.metodosPago().find((m) => m.id === id)?.descripcion ?? 'N/A';
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
    return `${this.obtenerSiglasDocumento(c.documentTypeDescription)} ${c.documentValue}`;
  }

  buscarYAplicarPromocion(): void {
    const texto = this.codigoPromocionInput().trim().toLowerCase();
    this.promoNoEncontrada.set(false);
    this.promoYaAplicada.set(false);

    if (!texto) return;

    const promo = this.promocionesDisponibles().find(
      (p) => p.concepto.trim().toLowerCase() === texto,
    );

    if (!promo) {
      this.promoNoEncontrada.set(true);
      return;
    }

    if (this.promocionAplicada()?.idPromocion === promo.idPromocion) {
      this.promoYaAplicada.set(true);
      return;
    }

    this.aplicarPromocion(promo);
    this.codigoPromocionInput.set('');
  }

  // También limpiar flags al quitar promo (en quitarPromocion ya existente)
  quitarPromocion(): void {
    this.promocionAplicada.set(null);
    this.codigoPromocionInput.set('');
    this.promoNoEncontrada.set(false);
    this.promoYaAplicada.set(false);
    this.messageService.add({ severity: 'info', summary: 'Promoción removida', life: 2000 });
  }
}
