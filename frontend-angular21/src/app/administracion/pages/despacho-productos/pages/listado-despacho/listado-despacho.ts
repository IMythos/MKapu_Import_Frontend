import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DispatchService } from '../../../../services/dispatch.service';
import { Dispatch, DispatchStatus } from '../../../../interfaces/dispatch.interfaces';
import { EmpleadosService, Empleado } from '../../../../../core/services/empleados.service';
import { ProductoService } from '../../../../services/producto.service';
import { AuthService } from '../../../../../auth/services/auth.service';
import { environment } from '../../../../../../enviroments/enviroment';
import { ConfirmacionDespachoStateService } from '../../../../services/confirmacion-despacho.state.service';

// ── Interfaces locales ──────────────────────────────────────────
interface ProductoMapItem { nombre: string; codigo: string; }

interface VentaCacheItem {
  numeroCompleto: string;
  clienteNombre: string;
  clienteDoc: string;
  sedeNombre: string;
}

interface ReceiptDetalle {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  subtotal: number;
  igv: number;
  total: number;
  descuento?: number;
  metodo_pago: string;
  cliente: { nombre: string; documento: string; tipo_documento?: string; telefono: string; direccion: string; };
  responsable: { nombre: string; sede: number; nombreSede: string; };
  productos: any[];
  promocion?: any;
}

@Component({
  selector: 'app-listado-despacho',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, TableModule, ButtonModule, InputTextModule,
    TagModule, SelectModule, ToastModule, ConfirmDialog,
    TooltipModule, DialogModule, DatePickerModule,
  ],
  templateUrl: './listado-despacho.html',
  styleUrl: './listado-despacho.css',
  providers: [ConfirmationService, MessageService],
})
export class ListadoDespacho {

  readonly dispatchService         = inject(DispatchService);
  private readonly empleadosService    = inject(EmpleadosService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly productoService     = inject(ProductoService);
  private readonly authService         = inject(AuthService);
  private readonly http                = inject(HttpClient);
  private readonly router              = inject(Router);
  private readonly confirmacionState   = inject(ConfirmacionDespachoStateService);
  private readonly sanitizer           = inject(DomSanitizer);

  getMapEmbedUrl(direccion: string): SafeResourceUrl {
    const q = encodeURIComponent((direccion ?? '') + ', Lima, Perú');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://maps.google.com/maps?q=${q}&output=embed&hl=es&z=16`
    );
  }

  encodeAddress(direccion: string): string {
    return encodeURIComponent((direccion ?? '') + ', Lima, Perú');
  }

  tituloKicker    = 'ADMINISTRADOR - DESPACHO - PRODUCTOS';
  subtituloKicker = 'LISTADO DE DESPACHO';
  iconoCabecera   = 'pi pi-truck';

  // ── Filtros ────────────────────────────────────────────────────
  searchTerm    = signal<string | null>(null);
  estadoFiltro  = signal<string>('TODOS');
  fechaDesde    = signal<Date | null>((() => { const d = new Date(); d.setHours(0,0,0,0); return d; })());
  fechaHasta    = signal<Date | null>((() => { const d = new Date(); d.setHours(23,59,59,999); return d; })());
  empleados     = signal<Empleado[]>([]);

  ventaCache = signal<Record<number, VentaCacheItem>>({});
  loadingCache = signal(false);

  modalVisible         = signal(false);
  despachoSeleccionado = signal<Dispatch | null>(null);
  loadingDetalle       = signal(false);

  cambioEstadoVisible = signal(false);
  despachoParaCambio  = signal<Dispatch | null>(null);

 
  productosMap         = signal<Record<string, ProductoMapItem>>({});
  productosCodigoMap   = signal<Record<number, string>>({});
  clienteInfo          = signal<{ nombre: string; documento: string; tipo_documento?: string; telefono: string; direccion?: string; } | null>(null);
  sedeNombreModal      = signal<string>('—');
  loadingVenta         = signal(false);
  receiptDetalleActual = signal<ReceiptDetalle | null>(null);

  estadoOptions = [
    { label: 'Todos',          value: 'TODOS'         },
    { label: 'Generado',       value: 'GENERADO'      },
    { label: 'En preparación', value: 'EN_PREPARACION'},
    { label: 'En tránsito',    value: 'EN_TRANSITO'   },
    { label: 'Entregado',      value: 'ENTREGADO'     },
    { label: 'Cancelado',      value: 'CANCELADO'     },
  ];

  dispatches = this.dispatchService.dispatches;
  loading    = this.dispatchService.loading;
  error      = this.dispatchService.error;

  constructor() {
    this.dispatchService.loadDispatches().subscribe({
      next: () => requestAnimationFrame(() => this.enriquecerTabla()),
      error: () => this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No se pudieron cargar los despachos.', life: 4000
      })
    });

    this.empleadosService.getEmpleados().subscribe({
      next: (lista) => this.empleados.set(lista),
      error: () => {}
    });
  }

  private enriquecerTabla(): void {
    const lista = this.dispatches();
    if (!lista.length) return;

    const idsUnicos = [...new Set(
      [...lista].sort((a, b) => b.id_despacho - a.id_despacho).map(d => d.id_venta_ref)
    )].filter(id => !this.ventaCache()[id]);

    if (!idsUnicos.length) return;

    idsUnicos.forEach(id => {
      this.http.get<ReceiptDetalle>(
        `${environment.apiUrl}/sales/receipts/${id}/detalle`
      ).toPromise()
        .then(res => {
          if (!res) return;
          this.ventaCache.update(c => ({
            ...c,
            [id]: {
              numeroCompleto: res.numero_completo ?? '—',
              clienteNombre:  res.cliente?.nombre   ?? '—',
              clienteDoc:     res.cliente?.documento ?? '—',
              sedeNombre:     res.responsable?.nombreSede ?? '—',
            }
          }));
        }).catch(() => {});
    });
  }

  // ── Helpers para la tabla ─────────────────────────────────────
  getNumeroComprobante(id_venta_ref: number): string {
    return this.ventaCache()[id_venta_ref]?.numeroCompleto ?? `Venta #${id_venta_ref}`;
  }

  getClienteNombre(id_venta_ref: number): string {
    return this.ventaCache()[id_venta_ref]?.clienteNombre ?? '—';
  }

  getClienteDoc(id_venta_ref: number): string {
    return this.ventaCache()[id_venta_ref]?.clienteDoc ?? '';
  }

  getSede(id_venta_ref: number): string {
    return this.ventaCache()[id_venta_ref]?.sedeNombre ?? '—';
  }

  // ── Computeds de totales ──────────────────────────────────────
  readonly totalProductosModal = computed(() =>
    this.despachoSeleccionado()?.detalles?.reduce((acc, d) => acc + d.cantidad_solicitada, 0) ?? 0
  );
  readonly numeroVentaModal = computed(() => {
    const d = this.despachoSeleccionado();
    if (!d) return '—';
    return this.ventaCache()[d.id_venta_ref]?.numeroCompleto ?? `#${d.id_venta_ref}`;
  });

  despachador = computed(() => this.obtenerNombreEmpleado('ALMACENERO'));
  asesor      = computed(() => this.obtenerNombreEmpleado('VENTAS'));

  totalGenerados     = computed(() => this.dispatches().filter(d => d.estado === 'GENERADO').length);
  totalEnPreparacion = computed(() => this.dispatches().filter(d => d.estado === 'EN_PREPARACION').length);
  totalEnTransito    = computed(() => this.dispatches().filter(d => d.estado === 'EN_TRANSITO').length);
  totalEntregados    = computed(() => this.dispatches().filter(d => d.estado === 'ENTREGADO').length);
  totalPendientes    = computed(() => this.totalGenerados() + this.totalEnPreparacion());
  totalEnviados      = computed(() => this.totalEnTransito());

  filasFiltradas = computed(() => {
    let data = this.dispatches();

    // Filtro estado
    if (this.estadoFiltro() !== 'TODOS')
      data = data.filter(d => d.estado === this.estadoFiltro());

    // Filtro fecha desde
    const desde = this.fechaDesde();
    if (desde) {
      const inicio = new Date(desde); inicio.setHours(0, 0, 0, 0);
      data = data.filter(d => new Date(d.fecha_creacion) >= inicio);
    }

    // Filtro fecha hasta
    const hasta = this.fechaHasta();
    if (hasta) {
      const fin = new Date(hasta); fin.setHours(23, 59, 59, 999);
      data = data.filter(d => new Date(d.fecha_creacion) <= fin);
    }

    const term = this.searchTerm()?.trim().toLowerCase();
    if (term) {
      data = data.filter(d =>
        d.id_despacho?.toString().includes(term) ||
        d.id_venta_ref?.toString().includes(term) ||
        d.direccion_entrega?.toLowerCase().includes(term) ||
        this.getClienteNombre(d.id_venta_ref).toLowerCase().includes(term) ||
        this.getClienteDoc(d.id_venta_ref).includes(term) ||
        this.getNumeroComprobante(d.id_venta_ref).toLowerCase().includes(term)
      );
    }
    return data.sort((a, b) => b.id_despacho - a.id_despacho);
  });

  // ── Filtro rápido: Hoy ────────────────────────────────────────
  filtrarHoy(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.fechaDesde.set(new Date(hoy));
    this.fechaHasta.set(new Date());
  }

  // ── Helpers modal: nombre y código del producto ───────────────
  getProductoNombre(id_producto: number): string {
    return this.productosMap()[String(id_producto)]?.nombre ?? `Producto #${id_producto}`;
  }

  getProductoCodigo(id_producto: number): string {
    return this.productosCodigoMap()[id_producto]
      ?? this.productosMap()[String(id_producto)]?.codigo
      ?? '—';
  }

  // ── Abrir modal ───────────────────────────────────────────────
  verDetalle(despacho: Dispatch): void {
    this.loadingDetalle.set(true);
    this.despachoSeleccionado.set(despacho);
    this.productosMap.set({});
    this.clienteInfo.set(null);
    this.sedeNombreModal.set('—');
    this.receiptDetalleActual.set(null);
    this.modalVisible.set(true);

    // Carga SKUs la primera vez que se abre el modal (lazy)
    if (!Object.keys(this.productosCodigoMap()).length) {
      this.productoService.getProductos(1, 500).subscribe({
        next: (res) => {
          const map: Record<number, string> = {};
          res.products.forEach(p => { map[p.id_producto] = p.codigo; });
          this.productosCodigoMap.set(map);
        },
        error: () => {}
      });
    }

    // 1. Detalles frescos del despacho
    this.dispatchService.getDispatchById(despacho.id_despacho).subscribe({
      next: (d) => {
        this.despachoSeleccionado.set(d);
        this.loadingDetalle.set(false);
      },
      error: () => { this.loadingDetalle.set(false); },
    });

    // 2. Datos de la venta (cliente + sede + productos)
    this.loadingVenta.set(true);
    this.http.get<ReceiptDetalle>(`${environment.apiUrl}/sales/receipts/${despacho.id_venta_ref}/detalle`)
      .subscribe({
        next: (detalle) => {
          this.receiptDetalleActual.set(detalle);
          this.clienteInfo.set(detalle.cliente ?? null);
          this.sedeNombreModal.set(detalle.responsable?.nombreSede ?? '—');
          const map: Record<string, ProductoMapItem> = {};
          (detalle.productos ?? []).forEach((p: any) => {
            const id = String(p.id_prod_ref ?? p.productId ?? '');
            if (id) map[id] = {
              nombre: p.descripcion ?? p.productName ?? `Producto #${id}`,
              codigo: p.cod_prod ?? p.codigoProducto ?? '—'
            };
          });
          this.productosMap.set(map);
          this.loadingVenta.set(false);
        },
        error: () => { this.loadingVenta.set(false); }
      });
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    this.despachoSeleccionado.set(null);
    this.clienteInfo.set(null);
    this.productosMap.set({});
  }

  iniciarPreparacion(): void {
    const d = this.despachoSeleccionado();
    if (!d) return;
    this.dispatchService.iniciarPreparacion(d.id_despacho).subscribe({
      next: (u) => {
        this.despachoSeleccionado.set(u);
        this.messageService.add({ severity: 'success', summary: 'Preparación iniciada', detail: `Despacho #${d.id_despacho} en preparación`, life: 3000 });
        this.dispatchService.loadDispatches().subscribe({ next: () => this.enriquecerTabla() });
        this.navegarAConfirmacion(u, 'EN_PREPARACION');
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo iniciar la preparación', life: 3000 }),
    });
  }

  confirmarSalida(): void {
    const d = this.despachoSeleccionado();
    if (!d) return;

    const guardarYNavegar = (despacho: Dispatch) => {
      this.navegarAConfirmacion(despacho, 'EN_TRANSITO');
    };

    const iniciarTransito = (despacho: Dispatch) => {
      this.dispatchService.iniciarTransito(despacho.id_despacho, { fecha_salida: new Date() })
        .subscribe({ next: (u) => guardarYNavegar(u), error: () => guardarYNavegar(despacho) });
    };

    const marcarYTransitar = (despacho: Dispatch) => {
      const pendientes = (despacho.detalles ?? []).filter(det => det.estado === 'PENDIENTE');
      if (!pendientes.length) { iniciarTransito(despacho); return; }

      let ok = 0;
      pendientes.forEach(det => {
        this.dispatchService.marcarDetallePreparado(
          det.id_detalle_despacho!,
          { cantidad_despachada: det.cantidad_solicitada }
        ).subscribe({
          next: () => { ok++; if (ok === pendientes.length) iniciarTransito(despacho); },
          error: () => iniciarTransito(despacho) // intenta transito igual si falla marcado
        });
      });
    };

    if (d.estado === 'GENERADO') {
      this.dispatchService.iniciarPreparacion(d.id_despacho).subscribe({
        next: (u) => marcarYTransitar(u),
        error: () => marcarYTransitar(d),
      });
    } else if (d.estado === 'EN_PREPARACION') {
      marcarYTransitar(d);
    } else {
      guardarYNavegar(d);
    }
  }

  confirmarEntrega(): void {
    const d = this.despachoSeleccionado();
    if (!d) return;
    this.dispatchService.confirmarEntrega(d.id_despacho, { fecha_entrega: new Date() }).subscribe({
      next: (u) => {
        this.despachoSeleccionado.set(u);
        this.messageService.add({ severity: 'success', summary: '¡Entregado!', detail: `Despacho #${d.id_despacho} entregado`, life: 3000 });
        this.dispatchService.loadDispatches().subscribe({ next: () => this.enriquecerTabla() });
        this.navegarAConfirmacion(u, 'ENTREGADO');
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la entrega', life: 3000 }),
    });
  }

  private navegarAConfirmacion(despacho: Dispatch, estadoForzado: string, esCopia = false): void {
    const cliente       = this.clienteInfo();
    const sedeNombre    = this.sedeNombreModal();
    const cache         = this.ventaCache()[despacho.id_venta_ref];
    const prodMap       = { ...this.productosMap() };
    const prodCodigoMap = { ...this.productosCodigoMap() };
    const receipt       = this.receiptDetalleActual();

    const dirLower = (despacho.direccion_entrega ?? '').toLowerCase();
    const tipoEntrega: 'tienda' | 'delivery' =
      dirLower.includes('tienda') || dirLower.includes('recojo') ? 'tienda' : 'delivery';

    const numComp = cache?.numeroCompleto ?? '';
    let tipoComprobante = 'Comprobante';
    if (numComp.startsWith('F')) tipoComprobante = 'Factura Electrónica';
    else if (numComp.startsWith('B')) tipoComprobante = 'Boleta Electrónica';
    else if (numComp.startsWith('N')) tipoComprobante = 'Nota de Venta';

    const data = {
      id_despacho:        despacho.id_despacho,
      numeroComprobante:  numComp || `#${despacho.id_venta_ref}`,
      tipoComprobante,
      fechaEmision:       receipt?.fec_emision ?? String(despacho.fecha_creacion),
      clienteNombre:      cliente?.nombre         ?? cache?.clienteNombre ?? '—',
      clienteDoc:         cliente?.documento       ?? cache?.clienteDoc    ?? '—',
      clienteTipoDoc:     cliente?.tipo_documento  ?? '—',
      clienteTelefono:    cliente?.telefono        ?? '—',
      clienteDireccion:   cliente?.direccion       ?? '—',
      sedeNombre:         sedeNombre               ?? cache?.sedeNombre    ?? '—',
      responsableNombre:  receipt?.responsable?.nombre ?? '—',
      direccionEntrega:   despacho.direccion_entrega,
      tipoEntrega,
      observacion:        despacho.observacion ?? null,
      estado:             estadoForzado,
      subtotal:           Number(receipt?.subtotal  ?? 0),
      igv:                Number(receipt?.igv       ?? 0),
      descuento:          Number(receipt?.descuento ?? 0),
      total:              Number(receipt?.total     ?? 0),
      metodoPago:         receipt?.metodo_pago ?? '—',
      esCopia,
      productos: (despacho.detalles ?? []).map(det => {
        const prodRec = (receipt?.productos ?? []).find(
          (p: any) => String(p.id_prod_ref ?? p.productId) === String(det.id_producto)
        );
        return {
          id_producto:         det.id_producto,
          nombre:              prodMap[String(det.id_producto)]?.nombre ?? prodRec?.descripcion ?? `Producto #${det.id_producto}`,
          codigo:              prodCodigoMap[det.id_producto] ?? prodMap[String(det.id_producto)]?.codigo ?? prodRec?.cod_prod ?? '—',
          cantidad_solicitada: det.cantidad_solicitada,
          cantidad_despachada: det.cantidad_despachada,
          precio_unit:         Number(prodRec?.pre_uni ?? prodRec?.precio_unit ?? 0),
          total_item:          Number(prodRec?.total ?? 0),
          estado:              det.estado,
        };
      }),
    };

    sessionStorage.setItem('confirmar_despacho_data', JSON.stringify(data));
    this.router.navigateByUrl('/admin/despacho-productos/confirmar-despacho').then(() => {
      this.modalVisible.set(false);
      this.dispatchService.loadDispatches().subscribe({ next: () => this.enriquecerTabla() });
    });
  }

  abrirCambioEstado(despacho: Dispatch): void {
    const estadosNoEditables: string[] = ['GENERADO', 'ENTREGADO', 'CANCELADO'];
    if (estadosNoEditables.includes(despacho.estado)) {
      const msgs: Record<string, string> = {
        GENERADO:  'Debes confirmar la salida primero desde el modal de detalle.',
        ENTREGADO: `El despacho #${despacho.id_despacho} ya fue entregado y no puede modificarse.`,
        CANCELADO: `El despacho #${despacho.id_despacho} está cancelado y no puede modificarse.`,
      };
      this.messageService.add({
        severity: 'info',
        summary: 'No permitido',
        detail: msgs[despacho.estado],
        life: 3500
      });
      return;
    }
    this.despachoParaCambio.set(despacho);
    this.cambioEstadoVisible.set(true);
  }

  aplicarCambioEstado(nuevoEstado: 'ENTREGADO' | 'CANCELADO'): void {
    const d = this.despachoParaCambio();
    if (!d) return;

    const onSuccess = () => {
      this.cambioEstadoVisible.set(false);
      this.despachoParaCambio.set(null);
      this.messageService.add({
        severity: 'success',
        summary: nuevoEstado === 'ENTREGADO' ? '¡Entregado!' : 'Cancelado',
        detail: `Despacho #${d.id_despacho} marcado como ${nuevoEstado === 'ENTREGADO' ? 'entregado' : 'cancelado'}.`,
        life: 3000
      });
      this.dispatchService.loadDispatches().subscribe({
        next: () => requestAnimationFrame(() => this.enriquecerTabla())
      });
    };

    const onError = () => this.messageService.add({
      severity: 'error', summary: 'Error',
      detail: 'No se pudo cambiar el estado.', life: 3000
    });

    if (nuevoEstado === 'CANCELADO') {
      // Cancelar se puede desde cualquier estado
      this.dispatchService.cancelarDespacho(d.id_despacho).subscribe({
        next: onSuccess, error: onError
      });
      return;
    }

    const hacerEntrega = (despacho: Dispatch) => {
      this.dispatchService.confirmarEntrega(despacho.id_despacho, { fecha_entrega: new Date() })
        .subscribe({ next: onSuccess, error: onError });
    };

    const marcarDetallesYTransitar = (despacho: Dispatch) => {
      const detallesPendientes = (despacho.detalles ?? []).filter(
        det => det.estado === 'PENDIENTE'
      );

      if (!detallesPendientes.length) {
        this.dispatchService.iniciarTransito(despacho.id_despacho, { fecha_salida: new Date() })
          .subscribe({ next: (u) => hacerEntrega(u), error: onError });
        return;
      }

      let completados = 0;
      detallesPendientes.forEach(det => {
        this.dispatchService.marcarDetallePreparado(
          det.id_detalle_despacho!,
          { cantidad_despachada: det.cantidad_solicitada }
        ).subscribe({
          next: () => {
            completados++;
            if (completados === detallesPendientes.length) {
              this.dispatchService.iniciarTransito(despacho.id_despacho, { fecha_salida: new Date() })
                .subscribe({ next: (u) => hacerEntrega(u), error: onError });
            }
          },
          error: onError
        });
      });
    };

    const hacerTransito = (despacho: Dispatch) => {
      marcarDetallesYTransitar(despacho);
    };

    const hacerPreparacion = (despacho: Dispatch) => {
      this.dispatchService.iniciarPreparacion(despacho.id_despacho)
        .subscribe({ next: (u) => hacerTransito(u), error: onError });
    };

    switch (d.estado) {
      case 'GENERADO':
        hacerPreparacion(d);
        break;
      case 'EN_PREPARACION':
        hacerTransito(d);
        break;
      case 'EN_TRANSITO':
        hacerEntrega(d);
        break;
      default:
        this.cambioEstadoVisible.set(false);
        this.messageService.add({
          severity: 'info', summary: 'Sin cambios',
          detail: `El despacho ya está en estado ${d.estado}.`, life: 3000
        });
    }
  }

  esCopiaDespacho(_id: number): boolean { return true; }

  imprimirCopia(): void {
    const d = this.despachoSeleccionado();
    if (!d) return;

    const cliente       = this.clienteInfo();
    const sedeNombre    = this.sedeNombreModal();
    const cache         = this.ventaCache()[d.id_venta_ref];
    const prodMap       = { ...this.productosMap() };
    const prodCodigoMap = { ...this.productosCodigoMap() };
    const receipt       = this.receiptDetalleActual();

    const dirLower = (d.direccion_entrega ?? '').toLowerCase();
    const tipoEntrega: 'tienda' | 'delivery' =
      dirLower.includes('tienda') || dirLower.includes('recojo') ? 'tienda' : 'delivery';

    const numComp = cache?.numeroCompleto ?? '';
    let tipoComprobante = 'Comprobante';
    if      (numComp.startsWith('F')) tipoComprobante = 'Factura Electrónica';
    else if (numComp.startsWith('B')) tipoComprobante = 'Boleta Electrónica';
    else if (numComp.startsWith('N')) tipoComprobante = 'Nota de Venta';

    const esCopia = this.esCopiaDespacho(d.id_despacho);

    const data = {
      id_despacho:        d.id_despacho,
      numeroComprobante:  numComp || `#${d.id_venta_ref}`,
      tipoComprobante,
      fechaEmision:       receipt?.fec_emision ?? String(d.fecha_creacion),
      clienteNombre:      cliente?.nombre        ?? cache?.clienteNombre ?? '—',
      clienteDoc:         cliente?.documento      ?? cache?.clienteDoc    ?? '—',
      clienteTipoDoc:     cliente?.tipo_documento ?? '—',
      clienteTelefono:    cliente?.telefono       ?? '—',
      clienteDireccion:   cliente?.direccion      ?? '—',
      sedeNombre:         sedeNombre              ?? cache?.sedeNombre    ?? '—',
      responsableNombre:  receipt?.responsable?.nombre ?? '—',
      direccionEntrega:   d.direccion_entrega,
      tipoEntrega,
      observacion:        d.observacion ?? null,
      estado:             d.estado,
      subtotal:           Number(receipt?.subtotal  ?? 0),
      igv:                Number(receipt?.igv       ?? 0),
      descuento:          Number(receipt?.descuento ?? 0),
      total:              Number(receipt?.total     ?? 0),
      metodoPago:         receipt?.metodo_pago ?? '—',
      esCopia,
      productos: (d.detalles ?? []).map(det => {
        const pr = (receipt?.productos ?? []).find(
          (p: any) => String(p.id_prod_ref ?? p.productId) === String(det.id_producto)
        );
        return {
          id_producto:         det.id_producto,
          nombre:              prodMap[String(det.id_producto)]?.nombre ?? pr?.descripcion ?? `Producto #${det.id_producto}`,
          codigo:              prodCodigoMap[det.id_producto] ?? prodMap[String(det.id_producto)]?.codigo ?? pr?.cod_prod ?? '—',
          cantidad_solicitada: det.cantidad_solicitada,
          cantidad_despachada: det.cantidad_despachada,
          precio_unit:         Number(pr?.pre_uni ?? pr?.precio_unit ?? 0),
          total_item:          Number(pr?.total ?? 0),
          estado:              det.estado,
        };
      }),
    } as any;

    localStorage.setItem(`guia_impresa_${d.id_despacho}`, '1');
    this.generarTicketDirecto(data);
  }

  generarTicketDirecto(s: any): void {
    const fecha = s.fechaEmision
      ? new Date(s.fechaEmision).toLocaleString('es-PE', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : new Date().toLocaleString('es-PE');

    const tipoEntregaLabel = s.tipoEntrega === 'delivery' ? 'DELIVERY' : 'TIENDA';
    const totalStr = Number(s.total ?? 0).toFixed(2);
    const descStr  = Number(s.descuento ?? 0).toFixed(2);

    const filasProd = (s.productos ?? []).map((p: any) => {
      const pu  = Number(p.precio_unit ?? 0) > 0 ? 'S/ ' + Number(p.precio_unit).toFixed(2) : '';
      const tot = Number(p.total_item  ?? 0) > 0 ? 'S/ ' + Number(p.total_item).toFixed(2)  : '';
      return '<tr>'
        + '<td class="td-desc">' + p.nombre + '<span class="sku">' + p.codigo + '</span></td>'
        + '<td class="td-cant">' + p.cantidad_solicitada + '</td>'
        + '<td class="td-pu">'  + pu  + '</td>'
        + '<td class="td-und">NIU</td>'
        + '<td class="td-tot">' + tot + '</td>'
        + '</tr>';
    }).join('');

    const entregaDirBlock = (s.tipoEntrega === 'delivery' && s.direccionEntrega)
      ? '<p class="c" style="font-size:10px">' + s.direccionEntrega + '</p>' : '';

    const telBlock = (s.clienteTelefono && s.clienteTelefono !== '—')
      ? '<p class="c">Tel: ' + s.clienteTelefono + '</p>' : '';

    const responsableBlock = (s.responsableNombre && s.responsableNombre !== '—')
      ? '<p class="c" style="font-size:10.5px">Atendido por:</p>'
        + '<p class="c bold">' + String(s.responsableNombre).toUpperCase() + '</p>'
        + '<hr class="dash">'
      : '';

    const metodoPago = (s.metodoPago && s.metodoPago !== '—' ? s.metodoPago : 'CONTADO').toUpperCase();

    const css = [
      '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
      "body{font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.6;color:#000;background:#fff;width:72mm;margin:0 auto;padding:4mm 3mm 8mm}",
      '.c{text-align:center}.r{text-align:right}.bold{font-weight:700}',
      'hr.dash{border:none;border-top:1px dashed #000;margin:4px 0}',
      '.copia-mark{text-align:center;font-size:11px;font-weight:900;letter-spacing:3px;border:1.5px solid #000;padding:3px 4px;margin:4px 0}',
      'table.prods{width:100%;border-collapse:collapse;font-size:10px;margin:2px 0}',
      'table.prods thead th{border-top:2px solid #000;border-bottom:2px solid #000;padding:2px 1px;font-size:9.5px;font-weight:700}',
      'table.prods tbody td{padding:2.5px 1px;vertical-align:top}',
      'table.prods tbody tr:last-child td{border-bottom:2px solid #000}',
      '.td-desc{width:38%}.td-cant{width:8%;text-align:center}',
      '.td-pu{width:20%;text-align:right}.td-und{width:10%;text-align:center;font-size:9px;color:#444}',
      '.td-tot{width:24%;text-align:right;font-weight:700}',
      '.sku{display:block;font-size:8.5px;color:#555;font-style:italic}',
      'table.tots{width:100%;border-collapse:collapse;font-size:10.5px}',
      'table.tots td{padding:1px 2px;white-space:nowrap}',
      '.tlbl{text-align:left;width:55%}.tval{text-align:right;font-weight:700;width:35%}',
      '.tr-total td{font-size:13px;font-weight:900;padding:3px 2px}',
      '.metodo{text-align:right;font-size:11px;font-weight:900;text-transform:uppercase;margin:2px 0}',
      '.footer{text-align:center;font-size:9.5px;line-height:1.55;margin-top:6px}',
      '@media print{html,body{width:72mm}@page{size:80mm auto;margin:0}}',
    ].join('');

    const totalesHTML = '<tr><td class="tlbl">Descuento Gral.</td><td></td><td class="tval">S/ ' + descStr + '</td></tr>'
      + '<tr><td colspan="3"><hr class="dash" style="margin:3px 0"></td></tr>'
      + '<tr class="tr-total"><td class="tlbl bold">Total</td><td></td><td class="tval">S/ ' + totalStr + '</td></tr>'
      + '<tr><td class="tlbl">Pago</td><td></td><td class="tval">S/ ' + totalStr + '</td></tr>'
      + '<tr><td class="tlbl">Vuelto</td><td></td><td class="tval">S/ 0.00</td></tr>';

    const copiaBlock = '<p class="copia-mark">*** COPIA ***</p>'
      + '<p class="copia-mark" style="font-size:9.5px;letter-spacing:1px;border-top:none;padding-top:0">'
      + 'COPIA DE ' + (s.tipoComprobante ?? 'COMPROBANTE').toUpperCase() + '</p>';

    const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">'
      + '<title>COPIA ' + s.numeroComprobante + '</title>'
      + '<style>' + css + '</style></head><body>'
      + '<p class="c bold" style="font-size:26px;letter-spacing:-1px;line-height:1">mkapu</p>'
      + '<p class="c" style="font-size:9px;letter-spacing:5px;text-transform:uppercase">import</p>'
      + '<hr class="dash">'
      + copiaBlock
      + '<p class="c bold" style="font-size:12px">' + (s.tipoComprobante ?? 'Comprobante') + '</p>'
      + '<hr class="dash">'
      + '<p class="c bold">MKAPU IMPORT S.A.C.</p><p class="c">MKAPU</p>'
      + '<hr class="dash">'
      + '<p class="c" style="font-size:10px">MKAPU IMPORT SAC</p>'
      + '<p class="c" style="font-size:9.5px">AV LAS FLORES DE LA PRIMAVERA 1838</p>'
      + '<p class="c" style="font-size:9.5px">15 DE LAS FLORES - SAN JUAN DE LURIGANCHO</p>'
      + '<p class="c" style="font-size:9.5px">LIMA - LIMA &nbsp; celular: 903019610</p>'
      + '<hr class="dash">'
      + '<p class="c" style="font-size:10.5px">' + fecha + '</p>'
      + '<p class="c bold" style="font-size:12px">' + s.numeroComprobante + '</p>'
      + '<hr class="dash">'
      + '<p class="c bold">' + s.clienteNombre + '</p>'
      + '<p class="c">' + s.clienteDoc + '</p>'
      + telBlock
      + '<hr class="dash">'
      + '<p class="c bold">' + tipoEntregaLabel + '</p>'
      + entregaDirBlock
      + '<hr class="dash">'
      + '<table class="prods"><thead><tr>'
      + '<th class="td-desc">Descripcion</th>'
      + '<th class="td-cant">Cant</th>'
      + '<th class="td-pu">P.Und</th>'
      + '<th class="td-und">Und</th>'
      + '<th class="td-tot">P.Total</th>'
      + '</tr></thead><tbody>' + filasProd + '</tbody></table>'
      + '<table class="tots"><tbody>' + totalesHTML + '</tbody></table>'
      + '<hr class="dash">'
      + '<p class="metodo">' + metodoPago + '</p>'
      + '<hr class="dash">'
      + responsableBlock
      + '<div class="footer">'
      + '<p class="bold" style="font-size:11px">**GRACIAS POR SU COMPRA**</p>'
      + '<p>Todo falla de f&aacute;brica tiene garant&iacute;a hasta</p>'
      + '<p>2 meses despu&eacute;s de su compra (solo venta</p>'
      + '<p>por unidad). Debe acercarse a nuestro</p>'
      + '<p>establecimiento para presentar su</p>'
      + '<p>solicitud de garant&iacute;a.</p>'
      + '</div>'
      + '<script>window.onload=function(){setTimeout(function(){window.print();},300);}</script>'
      + '</body></html>';

    const win = window.open('', '_blank', 'width=430,height=800');
    if (!win) {
      this.messageService.add({ severity: 'warn', summary: 'Aviso', detail: 'Activa las ventanas emergentes para imprimir.' });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

    cancelar(despacho: Dispatch): void {
    this.confirmationService.confirm({
      header: 'Confirmar cancelación',
      message: `¿Cancelar el despacho <strong>#${despacho.id_despacho}</strong>?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar', rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dispatchService.cancelarDespacho(despacho.id_despacho).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Cancelado', detail: `Despacho #${despacho.id_despacho} cancelado.`, life: 3000 }),
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar el despacho.', life: 4000 }),
        });
      }
    });
  }

  encodeURIComponent = encodeURIComponent;

  limpiarFiltros(): void {
    this.searchTerm.set(null);
    this.estadoFiltro.set('TODOS');
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
  }

  getEstadoSeverity(estado: DispatchStatus): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    switch (estado) {
      case 'GENERADO':       return 'secondary';
      case 'EN_PREPARACION': return 'info';
      case 'EN_TRANSITO':    return 'warn';
      case 'ENTREGADO':      return 'success';
      case 'CANCELADO':      return 'danger';
      default:               return 'secondary';
    }
  }

  getEstadoLabel(estado: DispatchStatus): string {
    const labels: Record<DispatchStatus, string> = {
      GENERADO:       'Generado',
      EN_PREPARACION: 'En preparación',
      EN_TRANSITO:    'En tránsito',
      ENTREGADO:      'Entregado',
      CANCELADO:      'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  getDetalleEstadoClass(estado: string): string {
    switch (estado) {
      case 'PREPARADO': return 'dm-det-preparado'; case 'DESPACHADO': return 'dm-det-despachado';
      case 'FALTANTE': return 'dm-det-faltante'; default: return 'dm-det-pendiente';
    }
  }

  private obtenerNombreEmpleado(cargo: Empleado['cargo']): string {
    const emp = this.empleados().find(e => e.cargo === cargo && e.estado);
    return emp ? `${emp.nombres} ${emp.apellidos}` : 'Sin asignar';
  }
}