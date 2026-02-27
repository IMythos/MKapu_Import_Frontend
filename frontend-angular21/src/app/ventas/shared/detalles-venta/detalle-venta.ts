import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { Paginator } from 'primeng/paginator'; // ← AÑADIDO
import { MessageService } from 'primeng/api';

import { VentasApiService } from '../../services/ventas-api.service';

import type {
  SalesReceiptWithHistoryDto,
  SalesReceiptProductoDto,
  RecentPurchase,
  ReceiptStatus,
} from '../../interfaces';

// ─── View Models ─────────────────────────────────────────────────
interface DetalleItem {
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  pre_uni: number;
  igv: number;
  total: number;
}

interface ComprobanteVM {
  id: number;
  id_cliente: string;
  id_sede: number;
  sede_nombre: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  cliente_nombre: string;
  cliente_doc: string;
  cliente_tipo_doc: string;
  cliente_direccion: string;
  cliente_email: string;
  cliente_telefono: string;
  responsable: string;
  medio_pago: string;
  subtotal: number;
  igv: number;
  total: number;
  moneda: string;
  estado: boolean;
  estadoLabel: ReceiptStatus;
  detalles: DetalleItem[];
}

interface HistorialItemVM {
  id: number;
  serie: string;
  numero: number;
  numero_completo: string;
  fec_emision: string;
  responsable: string;
  tipo_comprobante: string;
  total: number;
  estado: ReceiptStatus;
  metodo_pago: string;
}

interface EstadisticasClienteVM {
  totalCompras: number;
  montoTotal: number;
  promedioCompra: number;
}

interface HistorialPaginacionVM {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── Respuesta paginada del historial ────────────────────────────
interface HistorialPaginadoResponse {
  data: RecentPurchase[];
  pagination: HistorialPaginacionVM;
}

// ─── Mapas ───────────────────────────────────────────────────────
const TIPO_MAP: Record<string, string> = {
  'FACTURA DE VENTA': '01',
  FACTURA: '01',
  'BOLETA DE VENTA': '03',
  BOLETA: '03',
  'NOTA DE CREDITO': '07',
  'NOTA DE DEBITO': '08',
};

const ICONO_PAGO: Record<string, string> = {
  EFECTIVO: 'pi pi-money-bill',
  TARJETA: 'pi pi-credit-card',
  YAPE: 'pi pi-mobile',
  PLIN: 'pi pi-mobile',
  TRANSFERENCIA: 'pi pi-arrow-right-arrow-left',
};

@Component({
  selector: 'app-detalle-venta',
  standalone: true,
  imports: [
    CommonModule,
    Card,
    Button,
    Divider,
    Tag,
    TableModule,
    Skeleton,
    Tooltip,
    Toast,
    Paginator, // ← AÑADIDO
  ],
  providers: [MessageService],
  templateUrl: './detalle-venta.html',
  styleUrls: ['./detalle-venta.css'],
})
export class DetalleVenta implements OnInit, OnDestroy {
  // ─── Servicios ────────────────────────────────────────────────────
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly ventasApi = inject(VentasApiService); // nombre correcto
  private readonly messageService = inject(MessageService);

  // ─── Cabecera ─────────────────────────────────────────────────────
  readonly tituloKicker = 'VENTAS - HISTORIAL DE VENTAS - DETALLE DE VENTA';
  readonly subtituloKicker = 'DETALLE DE VENTA';
  readonly iconoCabecera = 'pi pi-file-edit';

  // ─── Estado principal ─────────────────────────────────────────────
  comprobante = signal<ComprobanteVM | null>(null);
  estadisticas = signal<EstadisticasClienteVM | null>(null);
  historial = signal<HistorialItemVM[]>([]);
  loading = signal(true);
  returnUrl = signal('/ventas/historial-ventas');

  // ─── Paginación historial del cliente ─────────────────────────────
  historialPage = signal(1);
  historialPaginacion = signal<HistorialPaginacionVM | null>(null);
  loadingHistorial = signal(false);
  private ventaId = signal<number | null>(null);

  hayMasPaginasHistorial = computed(() => {
    const p = this.historialPaginacion();
    return p ? p.page < p.total_pages : false;
  });

  // ─── Computeds de presentación ────────────────────────────────────
  tipoLabel = computed(() => {
    const t = this.comprobante()?.tipo_comprobante;
    return t === '03' ? 'BOLETA' : t === '01' ? 'FACTURA' : 'COMPROBANTE';
  });

  tipoIcon = computed(() =>
    this.comprobante()?.tipo_comprobante === '03' ? 'pi pi-file' : 'pi pi-file-edit',
  );

  estadoSeverity = computed<'success' | 'danger' | 'warn'>(() => {
    const e = this.comprobante()?.estadoLabel;
    if (e === 'EMITIDO') return 'success';
    if (e === 'ANULADO') return 'warn';
    return 'danger';
  });

  numeroFormateado = computed(() => {
    const c = this.comprobante();
    return c ? `${c.serie}-${c.numero.toString().padStart(8, '0')}` : '';
  });

  totalHistorial = computed(() => this.historial().reduce((s, h) => s + h.total, 0));

  private subs = new Subscription();

  // ─── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        id ? this.cargarDetalle(+id) : this.volver();
      }),
    );

    this.subs.add(
      this.route.queryParams.subscribe((params) => {
        if (params['returnUrl']) this.returnUrl.set(params['returnUrl']);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ─── Carga principal ──────────────────────────────────────────────
  cargarDetalle(id: number): void {
    this.ventaId.set(id);
    this.historialPage.set(1);
    this.loading.set(true);
    this.comprobante.set(null);
    this.historial.set([]);
    this.estadisticas.set(null);

    this.subs.add(
      this.ventasApi.obtenerVentaConHistorial(id, 1).subscribe({
        next: (res: SalesReceiptWithHistoryDto) => {
          this.comprobante.set(this.mapReceipt(res));
          this.mapearEstadisticas(res);
          this.mapearHistorial(res.historial_cliente);
          this.historialPaginacion.set(res.historial_pagination ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el detalle de la venta.',
            life: 3000,
          });
          setTimeout(() => this.volver(), 2000);
        },
      }),
    );
  }

  // ─── Paginación historial ─────────────────────────────────────────
  private cargarHistorialCliente(pagina = 1): void {
    const cliente = this.comprobante();
    if (!cliente?.cliente_doc) return;

    this.loadingHistorial.set(true);

    this.ventasApi // ← corregido
      .obtenerHistorialCliente(cliente.cliente_doc, pagina, 5)
      .subscribe({
        next: (response: HistorialPaginadoResponse) => {
          // ← tipado explícito
          this.historial.set(this.mapearHistorialItems(response.data));
          this.historialPaginacion.set(response.pagination);
          this.loadingHistorial.set(false);
        },
        error: () => this.loadingHistorial.set(false),
      });
  }

  onHistorialPageChange(event: { first?: number; rows?: number }): void {
    const nuevaPagina = Math.floor((event.first ?? 0) / 5) + 1;
    this.cargarHistorialCliente(nuevaPagina);
  }

  // ─── Mappers ──────────────────────────────────────────────────────
  private mapReceipt(r: SalesReceiptWithHistoryDto): ComprobanteVM {
    return {
      id: Number(r.id_comprobante),
      id_cliente: String(r.cliente.id_cliente),
      id_sede: r.responsable.sede,
      sede_nombre: r.responsable.nombreSede || '—',
      serie: r.serie,
      numero: r.numero,
      tipo_comprobante: TIPO_MAP[r.tipo_comprobante?.toUpperCase()] ?? '03',
      fec_emision: r.fec_emision,
      cliente_nombre: r.cliente.nombre || '—',
      cliente_doc: r.cliente.documento || '—',
      cliente_tipo_doc: r.cliente.tipo_documento || '—',
      cliente_direccion: r.cliente.direccion || '—',
      cliente_email: r.cliente.email || '—',
      cliente_telefono: r.cliente.telefono || '—',
      responsable: r.responsable.nombre || '—',
      medio_pago: r.metodo_pago || 'N/A',
      subtotal: Number(r.subtotal),
      igv: Number(r.igv),
      total: Number(r.total),
      moneda: 'PEN',
      estado: r.estado === 'EMITIDO',
      estadoLabel: r.estado,
      detalles: r.productos.map((p) => this.mapDetalle(p)),
    };
  }

  private mapDetalle(p: SalesReceiptProductoDto): DetalleItem {
    return {
      cod_prod: p.cod_prod,
      descripcion: p.descripcion,
      cantidad: Number(p.cantidad),
      pre_uni: Number(p.precio_unit),
      igv: Number(p.igv),
      total: Number(p.total),
    };
  }

  private mapearEstadisticas(r: SalesReceiptWithHistoryDto): void {
    const cantidad = r.cliente.cantidad_compras ?? 0;
    const monto = r.cliente.total_gastado_cliente ?? 0;
    this.estadisticas.set({
      totalCompras: cantidad,
      montoTotal: monto,
      promedioCompra: cantidad > 0 ? monto / cantidad : 0,
    });
  }

  private mapearHistorial(items: RecentPurchase[]): void {
    this.historial.set(this.mapearHistorialItems(items));
  }

  private mapearHistorialItems(items: RecentPurchase[]): HistorialItemVM[] {
    return (items ?? []).map((p) => ({
      id: Number(p.id_comprobante),
      serie: p.numero_completo.split('-')[0] ?? '',
      numero: Number(p.numero_completo.split('-')[1] ?? 0),
      numero_completo: p.numero_completo,
      fec_emision: p.fec_emision,
      responsable: p.responsable || '—',
      tipo_comprobante:
        TIPO_MAP[p.numero_completo.charAt(0) === 'F' ? 'FACTURA' : 'BOLETA'] ?? '03',
      total: Number(p.total),
      estado: p.estado,
      metodo_pago: p.metodo_pago || 'N/A',
    }));
  }

  // ─── Navegación ───────────────────────────────────────────────────
  volver(): void {
    this.location.back();
  }

  irHistorialVentas(): void {
    this.router.navigate(['/ventas/historial-ventas']);
  }

  verDetalleHistorial(id: number): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.router.navigate(['/ventas/ver-detalle', id]);
  }

  imprimirComprobante(): void {
    const c = this.comprobante();
    if (!c) return;
    this.router.navigate(['/ventas/imprimir-comprobante'], {
      state: { comprobante: c, rutaRetorno: `/ventas/ver-detalle/${c.id}` },
    });
  }

  imprimirDesdeHistorial(item: HistorialItemVM): void {
    const c = this.comprobante();
    this.router.navigate(['/ventas/imprimir-comprobante'], {
      state: { comprobante: item, rutaRetorno: `/ventas/ver-detalle/${c?.id}` },
    });
  }

  enviarEmailHistorial(_item: HistorialItemVM): void {
    const email = this.comprobante()?.cliente_email;
    if (!email || email === '—') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin email',
        detail: 'El cliente no tiene correo registrado.',
        life: 3000,
      });
      return;
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Email enviado',
      detail: `Comprobante enviado a: ${email}`,
      life: 3000,
    });
  }

  // ─── Helpers UI ───────────────────────────────────────────────────
  getIconoPago(medio: string): string {
    return ICONO_PAGO[medio?.toUpperCase()] ?? 'pi pi-wallet';
  }

  getTipoLabel(tipo: string): string {
    return tipo === '03' ? 'BOLETA' : tipo === '01' ? 'FACTURA' : tipo;
  }

  getSeverityEstadoHistorial(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      EMITIDO: 'success',
      ANULADO: 'warn',
      RECHAZADO: 'danger',
    };
    return map[estado] ?? 'info';
  }

  formatNumero(serie: string, numero: number): string {
    return `${serie}-${numero.toString().padStart(8, '0')}`;
  }
}
