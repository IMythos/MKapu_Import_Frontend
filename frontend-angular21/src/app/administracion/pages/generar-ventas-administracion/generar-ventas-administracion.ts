import { Component, OnInit, AfterViewInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { AuthService } from '../../../auth/services/auth.service';
import { VentasAdminService } from '../../services/ventas.service';
import { AccountReceivableService } from '../../services/account-receivable.service';
import { SedeAlmacenService } from '../../services/sede-almacen.service';
import { QuoteService } from '../../services/quote.service';
import { Quote } from '../../interfaces/quote.interface';
import { DispatchService } from '../../services/dispatch.service';
import { CreateDispatchRequest } from '../../interfaces/dispatch.interfaces';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { UserRole } from '../../../core/constants/roles.constants';
import { CajaService } from '../../../ventas/services/caja.service';
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
export type TipoPrecio = 'unidad' | 'caja' | 'mayorista';

export interface ProductoPendiente {
  id: number;
  codigo: string;
  nombre: string;
  stock: number;
  precioUnidad: number;
  precioCaja: number;
  precioMayorista: number;
  tipoPrecio: TipoPrecio;
  cantidad: number;
  sede: string;
  categoriaId?: number;
}

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
    SelectModule,
    TagModule,
    InputNumberModule,
    TooltipModule,
    LoadingOverlayComponent,
    DrawerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './generar-ventas-administracion.html',
  styleUrls: ['./generar-ventas-administracion.css'],
})
export class GenerarVentasAdministracion implements OnInit, AfterViewInit {
  private readonly authService = inject(AuthService);
  readonly ventasService = inject(VentasAdminService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteService = inject(QuoteService);
  private readonly arService = inject(AccountReceivableService);
  private readonly dispatchService = inject(DispatchService);
  private readonly cajaService = inject(CajaService);

  readonly esAdmin: boolean;
  readonly sedeNombreVentas: string;

  private readonly SIZE_PAGE = 10;
  private searchTimeout: any = null;

  sidebarClienteVisible = false;
  promosBuscadas = false;

  queryBusqueda = signal('');
  panelVisible = signal(false);
  buscandoProductos = signal(false);

  reniecLoading = signal(false);
  nombreDesdeReniec = signal(false);
  idUsuarioActual = signal<string>('0');
  nombreUsuarioActual = signal('');
  sedes = signal<SedeAdmin[]>([]);
  sedesLoading = signal(false);
  sedeSeleccionada = signal<number | null>(null);
  almacenSeleccionado = signal<number | null>(null);
  isLoading = signal(false);
  tipoComprobante = signal(2);
  clienteDocumento = signal('');
  clienteEncontrado = signal<ClienteBusquedaAdminResponse | null>(null);
  clienteLoading = signal(false);
  busquedaRealizada = signal(false);
  tiposDocumento = signal<TipoDocumentoAdmin[]>([]);
  tiposVenta = signal<TipoVentaAdmin[]>([]);
  tiposComprobante = signal<TipoComprobanteAdmin[]>([]);
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
  editarClienteForm: { name: string; address: string; email: string; phone: string } = {
    name: '',
    address: '',
    email: '',
    phone: '',
  };

  productosLoading = signal(true);
  familiasLoading = signal(true);
  productosCargados = signal<ProductoUIAdmin[]>([]);
  productosFiltrados = signal<ProductoUIAdmin[]>([]);
  productosSugeridos = signal<ProductoUIAdmin[]>([]);
  paginaActual = signal(1);
  totalRegistros = signal(0);
  cargandoMas = signal(false);
  familiaSeleccionada = signal<number | null>(null);
  familiasDisponibles = signal<Array<{ label: string; value: number }>>([]);
  productosPendientes = signal<ProductoPendiente[]>([]);
  productosSeleccionados = signal<ItemVentaUIAdmin[]>([]);
  promocionesDisponibles = signal<PromocionAdmin[]>([]);
  promocionesFiltradas = signal<PromocionAdmin[]>([]);
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
  saldoCaja = signal<number | null>(null);

  constructor() {
    const user = this.authService.getCurrentUser();
    this.esAdmin = this.authService.getRoleId() === UserRole.ADMIN;
    this.sedeNombreVentas = user?.sedeNombre ?? 'Mi sede';
  }

  readonly idMetodoPagoEfectivo = computed(
    () => this.metodosPago().find((m) => m.codSunat === '008')?.id ?? null,
  );

  private iconoPorMetodoPago(codSunat: string): string {
    const map: Record<string, string> = {
      '008': 'pi pi-money-bill',
      '005': 'pi pi-credit-card',
      '006': 'pi pi-credit-card',
      '003': 'pi pi-arrow-right-arrow-left',
      '001': 'pi pi-building',
    };
    return map[codSunat] ?? 'pi pi-wallet';
  }

  readonly metodoPagoOptions = computed(() =>
    this.metodosPago().map((m) => ({
      label: m.descripcion,
      value: m.id,
      icon: this.iconoPorMetodoPago(m.codSunat),
    })),
  );
  readonly tipoDocRucId = computed(
    () =>
      this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('RUC'))
        ?.documentTypeId ?? null,
  );

  readonly documentoConfig = computed(() => {
    const docActual = this.clienteDocumento();
    if (docActual.length === 11 && /^\d+$/.test(docActual))
      return {
        maxLength: 11,
        minLength: 11,
        soloNumeros: true,
        placeholder: 'Ingrese RUC (11 dígitos)',
      };
    if (this.tipoComprobante() === 1)
      return {
        maxLength: 11,
        minLength: 11,
        soloNumeros: true,
        placeholder: 'Ingrese RUC (11 dígitos)',
      };
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
    const cfg = this.documentoConfig();
    return len >= cfg.minLength && len <= cfg.maxLength;
  });

  readonly descuentoPromocion = computed(() => {
    const promo = this.promocionAplicada();
    if (!promo) return 0;
    const regla = promo.reglas?.find((r) => r.tipoCondicion === 'PRODUCTO');
    let base: number;
    if (regla) {
      const item = this.productosSeleccionados().find(
        (i) => i.codigo === regla.valorCondicion || i.productId.toString() === regla.valorCondicion,
      );
      base = item ? item.total : 0;
    } else {
      base = this.productosSeleccionados().reduce((s, i) => s + Number(i.total), 0);
    }
    return this.esPorcentaje(promo.tipo)
      ? Number(((base * Number(promo.valor)) / 100).toFixed(2))
      : Number(Number(promo.valor).toFixed(2));
  });

  readonly total = computed(() => {
    const base = this.productosSeleccionados().reduce((s, i) => s + i.total, 0);
    const delivery = this.tipoEntrega() === 'delivery' ? this.costoDelivery() : 0;
    return Number((base - this.descuentoPromocion() + delivery).toFixed(2));
  });

  readonly subtotal = computed(() => Number((this.total() / (1 + IGV_RATE_ADMIN)).toFixed(2)));
  readonly igv = computed(() => Number((this.total() - this.subtotal()).toFixed(2)));
  readonly vuelto = computed(() => {
    const v = this.montoRecibido() - this.total();
    return v >= 0 ? v : 0;
  });
  readonly hayMasPaginas = computed(() => this.productosCargados().length < this.totalRegistros());
  readonly nombreSedeSeleccionada = computed(() => {
    const id = this.sedeSeleccionada();
    if (!id) return 'Sin sede';
    if (this.esAdmin) return this.sedes().find((s) => s.id_sede === id)?.nombre ?? '';
    return this.sedeNombreVentas;
  });
  readonly sedesOptions = computed(() =>
    this.sedes().map((s) => ({ label: s.nombre, value: s.id_sede })),
  );

  ngOnInit(): void {
    this.isLoading.set(true);
    this.cargarSesion();
    this.cargarTiposDocumento();
    this.cargarMetodosPago();
    this.cargarTiposVenta();
    this.cargarTiposComprobante();
    this.leerParamsCotizacion();
    this.cargarSaldoCaja();
    if (this.esAdmin) {
      this.cargarSedes();
    } else {
      setTimeout(() => this.isLoading.set(false), 800);
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.cargarFamilias(), 0);
  }

  onQueryChange(value: string): void {
    this.queryBusqueda.set(value);
    this.productosSugeridos.set([]);
    this.panelVisible.set(false);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    if (!value || value.trim().length < 3) return;
    this.buscandoProductos.set(true);
    this.searchTimeout = setTimeout(() => {
      this.ventasService
        .buscarProductosVentas(
          value.trim(),
          this.sedeSeleccionada() ?? undefined,
          this.familiaSeleccionada() ?? undefined,
        )
        .subscribe({
          next: (res) => {
            this.productosSugeridos.set(
              res.data.map((p) => this.ventasService.mapearAutocompleteVentas(p)),
            );
            this.panelVisible.set(true);
            this.buscandoProductos.set(false);
          },
          error: () => {
            this.productosSugeridos.set([]);
            this.buscandoProductos.set(false);
          },
        });
    }, 300);
  }

  cerrarPanelConDelay(): void {
    setTimeout(() => this.panelVisible.set(false), 200);
  }

  estaEnPendientes(idProducto: number): boolean {
    return this.productosPendientes().some((p) => p.id === idProducto);
  }

  onProductoToggle(producto: ProductoUIAdmin): void {
    if (!producto || typeof producto !== 'object' || !producto.nombre) return;
    if (producto.stock <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin stock',
        detail: `${producto.nombre} no tiene stock disponible`,
        life: 3000,
      });
      return;
    }
    const lista = [...this.productosPendientes()];
    const idx = lista.findIndex((p) => p.id === producto.id);
    if (idx >= 0) {
      lista.splice(idx, 1);
      this.productosPendientes.set(lista);
      return;
    }
    const pendiente: ProductoPendiente = {
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      stock: producto.stock,
      precioUnidad: producto.precioUnidad,
      precioCaja: producto.precioCaja,
      precioMayorista: producto.precioMayorista,
      tipoPrecio: 'unidad',
      cantidad: 1,
      sede: producto.sede ?? '',
      categoriaId: producto.categoriaId,
    };
    this.productosPendientes.set([...lista, pendiente]);
  }

  getPrecioPendiente(p: ProductoPendiente): number {
    switch (p.tipoPrecio) {
      case 'caja':
        return p.precioCaja;
      case 'mayorista':
        return p.precioMayorista;
      default:
        return p.precioUnidad;
    }
  }

  actualizarPrecioPendiente(_i: number): void {
    this.productosPendientes.update((v) => [...v]);
  }
  decrementarPendiente(i: number): void {
    const l = [...this.productosPendientes()];
    if (l[i].cantidad > 1) {
      l[i] = { ...l[i], cantidad: l[i].cantidad - 1 };
      this.productosPendientes.set(l);
    }
  }
  incrementarPendiente(i: number): void {
    const l = [...this.productosPendientes()];
    if (l[i].cantidad < l[i].stock) {
      l[i] = { ...l[i], cantidad: l[i].cantidad + 1 };
      this.productosPendientes.set(l);
    }
  }
  clampCantidadPendiente(i: number): void {
    const l = [...this.productosPendientes()];
    let c = l[i].cantidad;
    if (isNaN(c) || c < 1) c = 1;
    if (c > l[i].stock) c = l[i].stock;
    l[i] = { ...l[i], cantidad: c };
    this.productosPendientes.set(l);
  }
  quitarPendiente(i: number): void {
    const l = [...this.productosPendientes()];
    l.splice(i, 1);
    this.productosPendientes.set(l);
  }
  limpiarPendientes(): void {
    this.productosPendientes.set([]);
  }

  agregarTodosAlCarrito(): void {
    const pendientes = this.productosPendientes();
    if (!pendientes.length) return;
    let lista = [...this.productosSeleccionados()];
    const errores: string[] = [];
    for (const p of pendientes) {
      const precioBase = this.getPrecioPendiente(p);
      const precioConIgv = Number((precioBase * (1 + IGV_RATE_ADMIN)).toFixed(2));
      const item: ItemVentaUIAdmin = {
        productId: p.id,
        codigo: p.codigo,
        quantity: p.cantidad,
        unitPrice: precioBase,
        description: p.nombre,
        total: Number((precioConIgv * p.cantidad).toFixed(2)),
        igvUnitario: Number((precioBase * IGV_RATE_ADMIN).toFixed(2)),
        categoriaId: p.categoriaId,
      };
      const idx = lista.findIndex(
        (x) => x.productId === item.productId && x.unitPrice === item.unitPrice,
      );
      if (idx >= 0) {
        const actualizado = { ...lista[idx] };
        const nuevaCant = actualizado.quantity + p.cantidad;
        if (nuevaCant > p.stock) {
          errores.push(`${p.nombre}: stock insuficiente (máx. ${p.stock})`);
          continue;
        }
        actualizado.quantity = nuevaCant;
        actualizado.total = Number((precioConIgv * nuevaCant).toFixed(2));
        lista[idx] = actualizado;
      } else {
        lista.push(item);
      }
    }
    this.productosSeleccionados.set(lista);
    this.productosPendientes.set([]);
    this.productosSugeridos.set([]);
    if (errores.length)
      errores.forEach((e) =>
        this.messageService.add({
          severity: 'warn',
          summary: 'Stock insuficiente',
          detail: e,
          life: 4000,
        }),
      );
    const agregados = pendientes.length - errores.length;
    if (agregados > 0)
      this.messageService.add({
        severity: 'success',
        summary: 'Productos agregados',
        detail: `${agregados} producto${agregados > 1 ? 's' : ''} añadido${agregados > 1 ? 's' : ''} al carrito`,
        life: 3000,
      });
  }

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
        const f = data.filter((m) => ['008', '005', '006', '003'].includes(m.codSunat));
        this.metodosPago.set(f);
        const e = f.find((m) => m.codSunat === '008');
        if (e) this.metodoPagoSeleccionado.set(e.id);
      },
    });
  }

  private cargarTiposVenta(): void {
    this.ventasService.obtenerTiposVenta().subscribe({ next: (d) => this.tiposVenta.set(d) });
  }

  private cargarTiposComprobante(): void {
    this.ventasService
      .obtenerTiposComprobante()
      .subscribe({
        next: (d) =>
          this.tiposComprobante.set(d.filter((t) => t.codSunat === '03' || t.codSunat === '01')),
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

  private cargarSaldoCaja(): void {
    const sedeId = this.sedeSeleccionada();
    if (!sedeId) return;
    this.cajaService
      .getResumenDia(sedeId)
      .subscribe({
        next: (res) => this.saldoCaja.set(res?.dineroEnCaja ?? null),
        error: () => this.saldoCaja.set(null),
      });
  }

  private cargarSedes(): void {
    if (!this.esAdmin) return;
    this.sedesLoading.set(true);
    this.ventasService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes.set(data.filter((s) => s.activo));
        this.sedesLoading.set(false);
        this.isLoading.set(false);
        const cotizId = this.cotizacionOrigen();
        if (cotizId) this.cargarDatosDeCotizacion(cotizId);
      },
      error: () => {
        this.sedesLoading.set(false);
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Sedes',
          detail: 'No se pudieron cargar las sedes',
        });
      },
    });
  }

  onSedeChange(sedeId: number | null): void {
    if (!this.esAdmin) {
      const user = this.authService.getCurrentUser();
      if (sedeId !== user?.idSede) return;
    }
    this.sedeSeleccionada.set(sedeId);
    this.almacenSeleccionado.set(null);
    this.familiaSeleccionada.set(null);
    this.productosPendientes.set([]);
    this.cargarProductos(true);
    this.cargarFamilias();
    this.cargarSaldoCaja();
    if (!sedeId) return;
    this.sedeAlmacenService.loadWarehouseOptionsBySede(sedeId).subscribe({
      next: (opts) => {
        if (opts.length > 0) this.almacenSeleccionado.set(opts[0].value);
      },
      error: () => console.warn('No se pudieron cargar almacenes'),
    });
  }

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
        console.error(err);
        this.familiasLoading.set(false);
      },
    });
  }

  onFamiliaChange(idCategoria: number | null): void {
    this.familiaSeleccionada.set(idCategoria);
    this.cargarProductos(true);
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

  onTipoDocBoleta(id: number): void {
    this.tipoDocBoleta.set(id);
    this.limpiarCliente();
  }

  validarSoloNumeros(event: any): void {
    const input = event.target;
    const cfg = this.documentoConfig();
    input.value = cfg.soloNumeros
      ? input.value.replace(/[^0-9]/g, '').slice(0, cfg.maxLength)
      : input.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, cfg.maxLength);
    this.clienteDocumento.set(input.value);
    if (this.clienteEncontrado()) this.limpiarCliente();
    this.busquedaRealizada.set(false);
  }

  buscarCliente(): void {
    if (!this.botonClienteHabilitado() || this.clienteEncontrado()) return;
    this.clienteLoading.set(true);
    this.busquedaRealizada.set(false);
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
        this.creandoCliente.set(false);
      },
    });
  }

  onDocumentoNuevoClienteChange(valor: string): void {
    this.nuevoClienteForm.documentValue = valor;
    this.nombreDesdeReniec.set(false);
    const tipoId = this.nuevoClienteForm.documentTypeId;
    if (!tipoId) return;
    const tipoSel = this.tiposDocumento().find((t) => t.documentTypeId === tipoId);
    const desc = tipoSel?.description?.toUpperCase() ?? '';
    const esDni = desc.includes('DNI') || desc.includes('IDENTIDAD');
    const esRuc = desc.includes('RUC') || desc.includes('CONTRIBUYENTE');
    if (!((esDni && valor.length === 8) || (esRuc && valor.length === 11))) return;
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
            summary: 'No encontrado',
            detail: 'Ingrese el nombre manualmente.',
            life: 3000,
          });
        }
      },
      error: () => {
        this.reniecLoading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin conexión',
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
    this.nuevoClienteForm.documentValue = doc;
    let tipoActivo;
    if (doc.length === 11 && /^\d+$/.test(doc)) {
      tipoActivo = this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('RUC'));
    } else if (doc.length === 8 && /^\d+$/.test(doc)) {
      tipoActivo = this.tiposDocumento().find((t) => t.description?.toUpperCase().includes('DNI'));
    } else {
      tipoActivo = this.tiposDocumento().find((t) => t.documentTypeId === this.tipoDocBoleta());
    }
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
    this.guardandoCliente.set(true);
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
        this.guardandoCliente.set(false);
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
        this.guardandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al crear cliente',
          detail: err?.error?.message ?? 'Ocurrió un error',
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
          detail: 'Datos actualizados correctamente',
        });
      },
      error: (err: any) => {
        this.guardandoCliente.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'Error al actualizar',
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
  abrirSidebarCliente(): void {
    this.sidebarClienteVisible = true;
  }

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
      next: (c) => {
        this.loading.set(false);
        this.prefillDesdeCotizacion(c);
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
    if (cotizacion.id_sede && this.esAdmin) this.onSedeChange(cotizacion.id_sede);
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
        const precioBase = Number(d.precio);
        const precioConIgv = Number((precioBase * (1 + IGV_RATE_ADMIN)).toFixed(2));
        const cantidad = Number(d.cantidad);
        return {
          productId: d.id_prod_ref,
          codigo: d.cod_prod,
          quantity: cantidad,
          unitPrice: precioBase,
          description: d.descripcion,
          total: Number((precioConIgv * cantidad).toFixed(2)),
          igvUnitario: Number((precioBase * IGV_RATE_ADMIN).toFixed(2)),
        };
      });
      this.productosSeleccionados.set(items);
    }
    if (this.tipoPagoOrigen() === 'credito') {
      const credito = this.metodosPago().find((m) => m.codSunat === '003' || m.codSunat === '005');
      if (credito) this.metodoPagoSeleccionado.set(credito.id);
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Cotización cargada',
      detail: `Datos pre-llenados desde cotización #${this.cotizacionOrigen()}`,
      life: 4000,
    });
  }

  private cargarPromociones(): void {
    if (this.promocionesDisponibles().length > 0) return;
    this.promocionesLoading.set(true);
    this.promosBuscadas = true;
    this.ventasService.obtenerPromocionesActivas().subscribe({
      next: (promos) => {
        const activas = promos
          .map((p) => ({ ...p, activo: this.normalizarActivo(p.activo) }))
          .filter((p) => p.activo);
        this.promocionesDisponibles.set(activas);
        this.promocionesLoading.set(false);
      },
      error: (err) => {
        this.promocionesLoading.set(false);
        this.promocionesDisponibles.set([]);
        if (err?.status !== 404)
          this.messageService.add({
            severity: 'warn',
            summary: 'Promociones',
            detail: 'No se pudieron cargar',
            life: 3000,
          });
      },
    });
  }

  filtrarPromociones(): void {
    const texto = this.codigoPromocionInput().trim().toLowerCase();
    if (!texto) {
      this.promocionesFiltradas.set([]);
      return;
    }
    if (this.promocionesDisponibles().length === 0) this.cargarPromociones();
    this.promocionesFiltradas.set(
      this.promocionesDisponibles().filter((p) => p.concepto.toLowerCase().includes(texto)),
    );
  }

aplicarPromocion(promo: PromocionAdmin): void {
  // Validar si la promo tiene regla de producto específico
  const reglaProducto = promo.reglas?.find((r) => r.tipoCondicion === 'PRODUCTO');
  
  if (reglaProducto) {
    const productoEnCarrito = this.productosSeleccionados().some(
      (i) => i.codigo === reglaProducto.valorCondicion || 
             i.productId.toString() === reglaProducto.valorCondicion,
    );

    if (!productoEnCarrito) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Producto requerido',
        detail: `Esta promoción requiere el producto "${reglaProducto.valorCondicion}" en el carrito`,
        life: 4000,
      });
      return;
    }
  }

  this.promocionAplicada.set(promo);
  this.codigoPromocionInput.set('');
  this.promocionesFiltradas.set([]);
  this.promoNoEncontrada.set(false);
  this.messageService.add({
    severity: 'success',
    summary: 'Promoción aplicada',
    detail: `${promo.concepto} — descuento: ${this.esPorcentaje(promo.tipo) ? `${promo.valor}%` : `S/. ${promo.valor.toFixed(2)}`}`,
    life: 3000,
  });
}

// Computed para saber si una promo aplica al carrito actual
promoAplicaAlCarrito(promo: PromocionAdmin): boolean {
  const regla = promo.reglas?.find((r) => r.tipoCondicion === 'PRODUCTO');
  if (!regla) return true; // sin restricción de producto, aplica siempre
  return this.productosSeleccionados().some(
    (i) => i.codigo === regla.valorCondicion || 
           i.productId.toString() === regla.valorCondicion,
  );
}

  buscarYAplicarPromocion(): void {
    const codigo = this.codigoPromocionInput().trim();
    if (!codigo) return;
    this.promoNoEncontrada.set(false);
    if (this.promocionAplicada()) return;
    if (this.promocionesDisponibles().length === 0) {
      this.cargarPromociones();
      this.messageService.add({
        severity: 'info',
        summary: 'Cargando...',
        detail: 'Intente nuevamente.',
        life: 2000,
      });
      return;
    }
    const encontrada = this.promocionesDisponibles().find(
      (p) => p.concepto.toLowerCase() === codigo.toLowerCase(),
    );
    if (!encontrada) {
      this.promoNoEncontrada.set(true);
      return;
    }
    this.aplicarPromocion(encontrada);
  }

  quitarPromocion(): void {
    this.promocionAplicada.set(null);
    this.codigoPromocionInput.set('');
    this.promocionesFiltradas.set([]);
    this.promoNoEncontrada.set(false);
    this.promoYaAplicada.set(false);
    this.messageService.add({
      severity: 'info',
      summary: 'Promoción removida',
      detail: 'Se quitó el descuento',
      life: 2000,
    });
  }

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

  generarVenta(): void {
    if (!this.clienteEncontrado()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cliente Requerido',
        detail: 'Seleccione un cliente',
      });
      return;
    }
    if (!this.sedeSeleccionada()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sede Requerida',
        detail: 'Seleccione una sede',
      });
      return;
    }
    if (this.productosSeleccionados().length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Carrito Vacío',
        detail: 'Agregue al menos un producto',
      });
      return;
    }
    if (this.tipoEntrega() === 'delivery' && !this.direccionDelivery().trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dirección Requerida',
        detail: 'Ingrese la dirección de delivery',
      });
      return;
    }
    if (this.tipoPagoOrigen() !== 'credito') {
      const esEfectivo = this.metodoPagoSeleccionado() === this.idMetodoPagoEfectivo();
      if (esEfectivo && this.montoRecibido() < this.total()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Monto Insuficiente',
          detail: 'El monto recibido es menor al total',
        });
        return;
      }
      if (!esEfectivo && !this.numeroOperacion().trim()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Nº Operación Requerido',
          detail: 'Ingrese el número de operación',
        });
        return;
      }
    }
    if (this.loading()) return;
    this.confirmationService.confirm({
      message: '¿Está seguro de generar esta venta?',
      header: 'Confirmar Venta',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept: () => {
        if (!this.loading()) this.procesarVenta();
      },
    });
  }

  private procesarVenta(): void {
    this.loading.set(true);
    this.snapshotCliente.set(this.clienteEncontrado());
    this.snapshotSede.set(this.nombreSedeSeleccionada());
    this.snapshotMetodoPago.set(this.getLabelMetodoPago(this.metodoPagoSeleccionado()!));
    this.snapshotTipoComprobante.set(this.tipoComprobante());
    const delivery = this.tipoEntrega() === 'delivery' ? this.costoDelivery() : 0;
    const totalBruto = Number(
      (this.productosSeleccionados().reduce((s, i) => s + i.total, 0) + delivery).toFixed(2),
    );
    const subtotalBruto = Number((totalBruto / 1.18).toFixed(2));
    const igvBruto = Number((totalBruto - subtotalBruto).toFixed(2));
    const esCredito = this.tipoPagoOrigen() === 'credito';
    const promo = this.promocionAplicada();
    const serie = this.tipoComprobante() === 1 ? 'F001' : 'B001';
    const cotizId = this.cotizacionOrigen();
    const esEfectivo = this.metodoPagoSeleccionado() === this.idMetodoPagoEfectivo();
    const request: RegistroVentaAdminRequest = {
      customerId: this.clienteEncontrado()!.customerId,
      receiptTypeId: this.tipoComprobante(),
      saleTypeId: this.tipoVentaSeleccionado(),
      serie,
      subtotal: subtotalBruto,
      igv: igvBruto,
      isc: 0,
      total: totalBruto,
      descuento: this.descuentoPromocion(),
      responsibleId: this.idUsuarioActual(),
      branchId: this.sedeSeleccionada()!,
      warehouseId: this.almacenSeleccionado() ?? undefined,
      paymentMethodId: esCredito ? undefined : (this.metodoPagoSeleccionado() ?? undefined),
      operationNumber: esEfectivo ? null : this.numeroOperacion(),
      esCreditoPendiente: esCredito,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ...(promo && { promotionId: promo.idPromocion }),
      items: this.productosSeleccionados().map((i) => ({
        productId: String(i.productId),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        description: i.description,
        total: i.total,
        codigo: i.codigo,
        categoriaId: i.categoriaId,
      })),
    };
    this.ventasService.registrarVenta(request).subscribe({
      next: (response: RegistroVentaAdminResponse) => {
        this.loading.set(false);
        this.comprobanteGenerado.set(response);
        const numeroCompleto =
          response.numeroCompleto ??
          `${response.serie}-${String(response.numero).padStart(8, '0')}`;
        this.messageService.add({
          severity: 'success',
          summary: '¡Venta Exitosa!',
          detail: `Comprobante ${numeroCompleto} generado`,
          life: 5000,
        });
        const almacenDespacho = this.almacenSeleccionado() ?? request.warehouseId ?? 0;
        if (response.idComprobante > 0 && almacenDespacho) {
          const direccion =
            this.tipoEntrega() === 'delivery'
              ? this.direccionDelivery().trim()
              : this.clienteEncontrado()?.address?.trim() || 'Recojo en tienda';
          const dispatchPayload: CreateDispatchRequest = {
            id_venta_ref: response.idComprobante,
            id_usuario_ref: this.idUsuarioActual(),
            id_almacen_origen: Number(almacenDespacho),
            direccion_entrega: direccion,
            observacion: `Venta ${numeroCompleto}`,
            detalles: this.productosSeleccionados().map((item) => ({
              id_producto: Number(item.productId),
              cantidad_solicitada: item.quantity,
            })),
          };
          this.dispatchService
            .createDispatch(dispatchPayload)
            .subscribe({
              next: (d) =>
                this.messageService.add({
                  severity: 'info',
                  summary: 'Despacho Creado',
                  detail: `Despacho #${d.id_despacho} generado`,
                  life: 4000,
                }),
              error: () =>
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Venta registrada',
                  detail: 'No se pudo crear el despacho.',
                  life: 5000,
                }),
            });
        }
        if (cotizId)
          this.quoteService.updateQuoteStatus(cotizId, 'APROBADA').subscribe({ error: () => {} });
        if (esCredito) {
          const fechaVenc = new Date();
          fechaVenc.setDate(fechaVenc.getDate() + 30);
          this.arService
            .create({
              salesReceiptId: response.idComprobante,
              userRef: this.clienteEncontrado()!.name,
              totalAmount: totalBruto,
              dueDate: fechaVenc.toISOString().split('T')[0],
              paymentTypeId: this.metodoPagoSeleccionado()!,
              currencyCode: 'PEN',
              observation: cotizId ? `Crédito desde cotización #${cotizId}` : 'Venta a crédito',
            })
            .then((ar) => {
              if (ar)
                this.messageService.add({
                  severity: 'info',
                  summary: 'Cuenta por Cobrar Creada',
                  detail: `Saldo: S/. ${ar.pendingBalance?.toFixed(2) ?? totalBruto.toFixed(2)}`,
                  life: 5000,
                });
            });
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al registrar venta',
          detail: err?.error?.message ?? 'Error inesperado',
          life: 6000,
        });
      },
    });
  }

  nuevaVenta(): void {
    this.productosSeleccionados.set([]);
    this.productosPendientes.set([]);
    this.clienteEncontrado.set(null);
    this.clienteDocumento.set('');
    this.busquedaRealizada.set(false);
    this.promocionAplicada.set(null);
    this.codigoPromocionInput.set('');
    this.promocionesFiltradas.set([]);
    this.montoRecibido.set(0);
    this.numeroOperacion.set('');
    this.tipoEntrega.set('recojo');
    this.direccionDelivery.set('');
    this.costoDelivery.set(0);
    this.comprobanteGenerado.set(null);
    this.tipoPagoOrigen.set('contado');
    this.cotizacionOrigen.set(null);
    this.promoNoEncontrada.set(false);
    this.queryBusqueda.set('');
    this.panelVisible.set(false);
    this.productosSugeridos.set([]);
    this.sidebarClienteVisible = false;
  }

  verListado(): void {
    this.router.navigate(['/admin/historial-ventas-administracion']);
  }
  getLabelMetodoPago(id: number): string {
    return this.metodosPago().find((m) => m.id === id)?.descripcion ?? 'N/A';
  }
  obtenerSeveridadStock(stock: number): 'success' | 'warn' | 'danger' {
    if (stock > 10) return 'success';
    if (stock > 0) return 'warn';
    return 'danger';
  }
  esPorcentaje(tipo: string): boolean {
    return tipo?.toUpperCase().includes('PORCENTAJE') || tipo?.toUpperCase().includes('PERCENT');
  }
  normalizarActivo(activo: any): boolean {
    if (typeof activo === 'boolean') return activo;
    if (typeof activo === 'number') return activo === 1;
    if (activo && typeof activo === 'object' && 'data' in activo) return activo.data?.[0] === 1;
    return false;
  }
  itemCalificaPromocion(item: ItemVentaUIAdmin): boolean {
    const promo = this.promocionAplicada();
    if (!promo) return false;
    const regla = promo.reglas?.find((r) => r.tipoCondicion === 'PRODUCTO');
    if (!regla) return true;
    return (
      item.codigo === regla.valorCondicion || item.productId.toString() === regla.valorCondicion
    );
  }
  formatearDocumentoCompleto(): string {
    const c = this.clienteEncontrado();
    if (!c) return '';
    return c.documentTypeDescription
      ? `${c.documentTypeDescription}: ${c.documentValue}`
      : (c.documentValue ?? '');
  }
}
