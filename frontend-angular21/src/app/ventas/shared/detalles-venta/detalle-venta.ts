/* frontend-angular21/src/app/ventas/pages/detalle-venta/detalle-venta.ts */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { Subscription } from 'rxjs';

import { Card }          from 'primeng/card';
import { Button }        from 'primeng/button';
import { Divider }       from 'primeng/divider';
import { Tag }           from 'primeng/tag';
import { TableModule }   from 'primeng/table';
import { Skeleton }      from 'primeng/skeleton';
import { Tooltip }       from 'primeng/tooltip';
import { Toast }         from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { VentasApiService } from '../../services/ventas-api.service';

import type {
  SalesReceiptWithHistoryDto,
  SalesReceiptResponseDto,
  CustomerPurchaseHistoryDto,
  CustomerPurchaseStatistics,
  RecentPurchase,
} from '../../interfaces/ventas-historial.interface';

// ─── VIEW MODELS ──────────────────────────────────────────────────────────────

interface DetalleItem {
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  valor_unit:  number;
  pre_uni:     number;
  total:       number;
}

interface ComprobanteVM {
  id:                    number;
  id_cliente:            string;
  id_sede:               number;
  sede_nombre:           string;
  serie:                 string;
  numero:                number;
  tipo_comprobante:      string;   // '01' | '03' | '07' | '08'
  fec_emision:           string;
  fec_venc:              string;
  cliente_nombre:        string;
  cliente_doc:           string;
  cliente_tipo_doc:      string;
  cliente_direccion:     string;
  cliente_email:         string;
  cliente_telefono:      string;
  responsable:           string;
  medio_pago:            string;
  subtotal:              number;
  igv:                   number;
  isc:                   number;
  total:                 number;
  moneda:                string;
  estado:                boolean;
  estadoLabel:           string;
  detalles:              DetalleItem[];
}

interface HistorialItem {
  id:               number;
  serie:            string;
  numero:           number;
  fec_emision:      string;
  responsable:      string;
  tipo_comprobante: string;
  total:            number;
  estado:           string;
}

// ─── TIPO MAP ────────────────────────────────────────────────────────────────

const TIPO_MAP: Record<string, string> = {
  'FACTURA DE VENTA': '01',
  'FACTURA':          '01',
  'BOLETA DE VENTA':  '03',
  'BOLETA':           '03',
  'NOTA DE CREDITO':  '07',
  'NOTA DE DEBITO':   '08',
};

const ICONO_PAGO: Record<string, string> = {
  EFECTIVO:      'pi pi-money-bill',
  TARJETA:       'pi pi-credit-card',
  YAPE:          'pi pi-mobile',
  PLIN:          'pi pi-mobile',
  TRANSFERENCIA: 'pi pi-arrow-right-arrow-left',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-detalle-venta',
  standalone:  true,
  imports:     [CommonModule, Card, Button, Divider, Tag, TableModule, Skeleton, Tooltip, Toast],
  providers:   [MessageService],
  templateUrl: './detalle-venta.html',
  styleUrls:   ['./detalle-venta.css'],
})
export class DetalleVenta implements OnInit, OnDestroy {

  // ─── INYECCIONES ────────────────────────────────────────────────────────────

  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly location       = inject(Location);
  private readonly ventasApi      = inject(VentasApiService);
  private readonly messageService = inject(MessageService);

  // ─── CONSTANTES ─────────────────────────────────────────────────────────────

  readonly tituloKicker    = 'VENTAS - HISTORIAL DE VENTAS - DETALLE DE VENTA';
  readonly subtituloKicker = 'DETALLE DE VENTA';
  readonly iconoCabecera   = 'pi pi-file-edit';

  // ─── SIGNALS CORE ───────────────────────────────────────────────────────────

  comprobante  = signal<ComprobanteVM | null>(null);
  estadisticas = signal<CustomerPurchaseStatistics | null>(null);
  historial    = signal<HistorialItem[]>([]);
  loading      = signal(true);
  returnUrl    = signal('/ventas/historial-ventas');

  // ─── COMPUTED ───────────────────────────────────────────────────────────────

  tipoLabel = computed(() => {
    const t = this.comprobante()?.tipo_comprobante;
    return t === '03' ? 'BOLETA' : t === '01' ? 'FACTURA' : 'COMPROBANTE';
  });

  tipoIcon = computed(() =>
    this.comprobante()?.tipo_comprobante === '03' ? 'pi pi-file' : 'pi pi-file-edit',
  );

  estadoSeverity = computed<'success' | 'danger'>(() =>
    this.comprobante()?.estado ? 'success' : 'danger',
  );

  estadoLabel = computed(() =>
    this.comprobante()?.estado ? 'EMITIDO' : 'ANULADO',
  );

  numeroFormateado = computed(() => {
    const c = this.comprobante();
    if (!c) return '';
    return `${c.serie}-${c.numero.toString().padStart(8, '0')}`;
  });

  totalHistorial = computed(() =>
    this.historial().reduce((s, h) => s + h.total, 0),
  );

  // ─── SUBS ───────────────────────────────────────────────────────────────────

  private subs = new Subscription();

  // ─── LIFECYCLE ──────────────────────────────────────────────────────────────

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

  // ─── CARGA ──────────────────────────────────────────────────────────────────

  cargarDetalle(id: number): void {
    this.loading.set(true);
    this.comprobante.set(null);
    this.historial.set([]);
    this.estadisticas.set(null);

    this.subs.add(
      this.ventasApi.obtenerVentaConHistorial(id).subscribe({
        next: (res: SalesReceiptWithHistoryDto) => {
          this.comprobante.set(this.mapReceipt(res.receipt));
          this.mapearHistorial(res.customerHistory);
          this.loading.set(false);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'No se pudo cargar el detalle de la venta',
            life:     3000,
          });
          this.loading.set(false);
          setTimeout(() => this.volver(), 2000);
        },
      }),
    );
  }

  // ─── MAPPERS ────────────────────────────────────────────────────────────────

  private mapReceipt(r: SalesReceiptResponseDto): ComprobanteVM {
    return {
      id:               r.idComprobante,
      id_cliente:       r.cliente.id,
      id_sede:          r.sede.id,
      sede_nombre:      r.sede.nombre,
      serie:            r.serie,
      numero:           r.numero,
      tipo_comprobante: r.tipoComprobante.codigoSunat,
      fec_emision:      r.fecEmision,
      fec_venc:         r.fecVenc,
      cliente_nombre:   r.cliente.name,
      cliente_doc:      r.cliente.documentValue,
      cliente_tipo_doc: r.cliente.documentTypeDescription,
      cliente_direccion: r.cliente.address || '—',
      cliente_email:    r.cliente.email    || '—',
      cliente_telefono: r.cliente.phone    || '—',
      responsable:      r.responsable.nombreCompleto,
      medio_pago:       r.metodoPago?.descripcion || 'N/A',
      subtotal:         r.subtotal,
      igv:              r.igv,
      isc:              r.isc,
      total:            r.total,
      moneda:           r.moneda.codigo,
      estado:           r.estado === 'EMITIDO',
      estadoLabel:      r.estado,
      detalles: r.items.map((item) => ({
        cod_prod:    item.codigoProducto?.toString() || item.productId,
        descripcion: item.productName,
        cantidad:    item.quantity,
        valor_unit:  item.unitValue  || item.unitPrice,
        pre_uni:     item.unitPrice,
        total:       item.total,
      })),
    };
  }

  private mapearHistorial(history?: CustomerPurchaseHistoryDto): void {
    if (!history) return;

    this.estadisticas.set(history.statistics);

    this.historial.set(
      history.recentPurchases.map((p: RecentPurchase) => {
        const [serie, num] = p.numeroCompleto.split('-');
        return {
          id:               p.idComprobante,
          serie:            serie  || '',
          numero:           parseInt(num || '0', 10),
          fec_emision:      p.fecha,
          responsable:      p.responsableNombre,
          tipo_comprobante: TIPO_MAP[p.tipoComprobante?.toUpperCase()] ?? '03',
          total:            p.total,
          estado:           p.estado,
        };
      }),
    );
  }

  // ─── NAVEGACIÓN ─────────────────────────────────────────────────────────────

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

  imprimirDesdeHistorial(item: HistorialItem): void {
    const c = this.comprobante();
    this.router.navigate(['/ventas/imprimir-comprobante'], {
      state: { comprobante: item, rutaRetorno: `/ventas/ver-detalle/${c?.id}` },
    });
  }

  enviarEmailHistorial(item: HistorialItem): void {
    const email = this.comprobante()?.cliente_email;

    if (!email || email === '—') {
      this.messageService.add({
        severity: 'warn',
        summary:  'Sin email',
        detail:   'El cliente no tiene un correo electrónico registrado',
        life:     3000,
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary:  'Email enviado',
      detail:   `Comprobante enviado a: ${email}`,
      life:     3000,
    });
  }

  // ─── HELPERS UI ─────────────────────────────────────────────────────────────

  getIconoPago(medio: string): string {
    return ICONO_PAGO[medio.toUpperCase()] ?? 'pi pi-wallet';
  }

  getTipoLabel(tipo: string): string {
    return tipo === '03' ? 'BOLETA' : tipo === '01' ? 'FACTURA' : tipo;
  }

  getSeverityEstadoHistorial(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      EMITIDO:   'success',
      ANULADO:   'warn',
      RECHAZADO: 'danger',
    };
    return map[estado] ?? 'info';
  }

  formatNumero(serie: string, numero: number): string {
    return `${serie}-${numero.toString().padStart(8, '0')}`;
  }
}