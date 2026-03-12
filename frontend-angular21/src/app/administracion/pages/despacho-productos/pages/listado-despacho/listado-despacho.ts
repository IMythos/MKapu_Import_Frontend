import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  cliente: { nombre: string; documento: string; telefono: string; direccion: string; };
  responsable: { nombre: string; sede: number; nombreSede: string; };
  productos: any[];
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

  tituloKicker    = 'ADMINISTRADOR - DESPACHO - PRODUCTOS';
  subtituloKicker = 'LISTADO DE DESPACHO';
  iconoCabecera   = 'pi pi-truck';

  // ── Filtros ────────────────────────────────────────────────────
  searchTerm    = signal<string | null>(null);
  estadoFiltro  = signal<string>('TODOS');
  fechaDesde    = signal<Date | null>(null);
  fechaHasta    = signal<Date | null>(null);
  empleados     = signal<Empleado[]>([]);

  // ── Cache enriquecida de ventas (para tabla) ───────────────────
  // ventaId → { numeroCompleto, clienteNombre, clienteDoc, sedeNombre }
  ventaCache = signal<Record<number, VentaCacheItem>>({});
  loadingCache = signal(false);

  // ── Modal ──────────────────────────────────────────────────────
  modalVisible         = signal(false);
  despachoSeleccionado = signal<Dispatch | null>(null);
  loadingDetalle       = signal(false);
  productosMap         = signal<Record<string, ProductoMapItem>>({});
  productosCodigoMap   = signal<Record<number, string>>({});
  clienteInfo          = signal<{ nombre: string; documento: string; telefono: string; } | null>(null);
  sedeNombreModal      = signal<string>('—');
  loadingVenta         = signal(false);

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
      next: () => this.enriquecerTabla(),
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los despachos.', life: 4000 })
    });

    this.empleadosService.getEmpleados().subscribe({
      next: (lista) => this.empleados.set(lista),
      error: () => {}
    });

    // Códigos SKU reales de productos
    this.productoService.getProductos(1, 500).subscribe({
      next: (res) => {
        const map: Record<number, string> = {};
        res.products.forEach(p => { map[p.id_producto] = p.codigo; });
        this.productosCodigoMap.set(map);
      },
      error: () => {}
    });
  }

  // ── Enriquece la tabla cargando datos de cada venta ───────────
  private enriquecerTabla(): void {
    const lista = this.dispatches();
    if (!lista.length) return;

    const cacheActual = this.ventaCache();

    // Solo fetchar IDs que NO están en caché todavía
    const idsFaltantes = [...new Set(lista.map(d => d.id_venta_ref))]
      .filter(id => !cacheActual[id])
      .slice(0, 50);

    if (!idsFaltantes.length) return; // Todo ya está en caché

    this.loadingCache.set(true);

    const requests = idsFaltantes.map(id =>
      this.http.get<ReceiptDetalle>(`${environment.apiUrl}/sales/receipts/${id}/detalle`)
        .pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe({
      next: (resultados) => {
        const cache: Record<number, VentaCacheItem> = { ...this.ventaCache() };
        resultados.forEach((res, i) => {
          if (!res) {
            // Fallback: guarda el id_venta_ref como clave con datos mínimos
            cache[idsFaltantes[i]] = {
              numeroCompleto: `Venta #${idsFaltantes[i]}`,
              clienteNombre: '—', clienteDoc: '—', sedeNombre: '—',
            };
            return;
          }
          // El detalle devuelve id_comprobante — que ES el id_venta_ref
          cache[res.id_comprobante] = {
            numeroCompleto: res.numero_completo ?? '—',
            clienteNombre:  res.cliente?.nombre   ?? '—',
            clienteDoc:     res.cliente?.documento ?? '—',
            sedeNombre:     res.responsable?.nombreSede ?? '—',
          };
        });
        this.ventaCache.set(cache);
        this.loadingCache.set(false);
      },
      error: () => this.loadingCache.set(false),
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

    // Filtro búsqueda texto
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
    this.modalVisible.set(true);

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

  // ── Acciones de estado ────────────────────────────────────────
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

    // Snapshot de datos ANTES de cualquier async
    const cliente       = this.clienteInfo();
    const sedeNombre    = this.sedeNombreModal();
    const cache         = this.ventaCache()[d.id_venta_ref];
    const prodMap       = { ...this.productosMap() };
    const prodCodigoMap = { ...this.productosCodigoMap() };

    const guardarYNavegar = (despacho: Dispatch) => {
      sessionStorage.setItem('confirmar_despacho_data', JSON.stringify({
        id_despacho:       despacho.id_despacho,
        numeroComprobante: cache?.numeroCompleto   ?? `#${despacho.id_venta_ref}`,
        fechaEmision:      String(despacho.fecha_creacion),
        clienteNombre:     cliente?.nombre    ?? cache?.clienteNombre ?? '—',
        clienteDoc:        cliente?.documento ?? cache?.clienteDoc    ?? '—',
        clienteTelefono:   cliente?.telefono  ?? '—',
        sedeNombre:        sedeNombre         ?? cache?.sedeNombre    ?? '—',
        direccionEntrega:  despacho.direccion_entrega,
        observacion:       despacho.observacion ?? null,
        estado:            'EN_TRANSITO',
        productos: (despacho.detalles ?? []).map(det => ({
          id_producto:         det.id_producto,
          nombre:              prodMap[String(det.id_producto)]?.nombre ?? `Producto #${det.id_producto}`,
          codigo:              prodCodigoMap[det.id_producto] ?? prodMap[String(det.id_producto)]?.codigo ?? '—',
          cantidad_solicitada: det.cantidad_solicitada,
          cantidad_despachada: det.cantidad_despachada,
          estado:              det.estado,
        })),
      }));
      // 1. Navegar primero
      this.router.navigateByUrl('/admin/despacho-productos/confirmar-despacho').then(() => {
        // 2. Cerrar modal y recargar lista DESPUÉS de navegar
        this.modalVisible.set(false);
        this.dispatchService.loadDispatches().subscribe({ next: () => this.enriquecerTabla() });
      });
    };

    const hacerTransito = (despacho: Dispatch) => {
      this.dispatchService.iniciarTransito(despacho.id_despacho, { fecha_salida: new Date() }).subscribe({
        next: (u) => guardarYNavegar(u),
        error: () => {
          // Si transito falla pero preparacion ok, navegar igual con lo que tenemos
          guardarYNavegar(despacho);
        },
      });
    };

    if (d.estado === 'GENERADO') {
      this.dispatchService.iniciarPreparacion(d.id_despacho).subscribe({
        next: (u) => hacerTransito(u),
        error: () => hacerTransito(d),
      });
    } else if (d.estado === 'EN_PREPARACION') {
      hacerTransito(d);
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

  private navegarAConfirmacion(despacho: Dispatch, estadoForzado: string): void {
    const cliente       = this.clienteInfo();
    const sedeNombre    = this.sedeNombreModal();
    const cache         = this.ventaCache()[despacho.id_venta_ref];
    const prodMap       = { ...this.productosMap() };
    const prodCodigoMap = { ...this.productosCodigoMap() };

    const data = {
      id_despacho:        despacho.id_despacho,
      numeroComprobante:  cache?.numeroCompleto   ?? `#${despacho.id_venta_ref}`,
      fechaEmision:       String(despacho.fecha_creacion),
      clienteNombre:      cliente?.nombre    ?? cache?.clienteNombre ?? '—',
      clienteDoc:         cliente?.documento ?? cache?.clienteDoc    ?? '—',
      clienteTelefono:    cliente?.telefono  ?? '—',
      sedeNombre:         sedeNombre         ?? cache?.sedeNombre    ?? '—',
      direccionEntrega:   despacho.direccion_entrega,
      observacion:        despacho.observacion ?? null,
      estado:             estadoForzado,
      productos: (despacho.detalles ?? []).map(det => ({
        id_producto:         det.id_producto,
        nombre:              prodMap[String(det.id_producto)]?.nombre ?? `Producto #${det.id_producto}`,
        codigo:              prodCodigoMap[det.id_producto] ?? prodMap[String(det.id_producto)]?.codigo ?? '—',
        cantidad_solicitada: det.cantidad_solicitada,
        cantidad_despachada: det.cantidad_despachada,
        estado:              det.estado,
      })),
    };

    sessionStorage.setItem('confirmar_despacho_data', JSON.stringify(data));
    this.router.navigateByUrl('/admin/despacho-productos/confirmar-despacho').then(() => {
      this.modalVisible.set(false);
      this.dispatchService.loadDispatches().subscribe({ next: () => this.enriquecerTabla() });
    });
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