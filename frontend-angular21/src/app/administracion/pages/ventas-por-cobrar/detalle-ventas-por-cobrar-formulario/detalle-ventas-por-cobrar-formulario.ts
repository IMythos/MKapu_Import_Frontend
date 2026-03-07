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
import { MessageService } from 'primeng/api';

// TODO: reemplazar con el servicio y las interfaces reales de cuentas por cobrar
// import { AccountReceivableService } from '../../services/account-receivable.service';

// ─── View Models ──────────────────────────────────────────────────────────────

interface DetalleProductoVM {
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  pre_uni:     number;
  igv:         number;
  total:       number;
}

interface ComprobanteOrigenVM {
  numero_completo: string;
  tipo_label:      string;
  fec_emision:     string;
  responsable:     string;
  sede_nombre:     string;
  total:           number;
  estado:          string;
  detalles:        DetalleProductoVM[];
}

interface PagoVM {
  id:          number;
  fec_pago:    string;
  metodo_pago: string;
  referencia:  string | null;
  monto:       number;
  estado:      string;
}

interface CuentaPorCobrarVM {
  id:              number;
  cliente_nombre:  string;
  cliente_doc:     string;
  cliente_email:   string;
  cliente_telefono:string;
  fec_creacion:    string;
  fec_vencimiento: string;
  tipo_pago:       string;
  moneda:          string;
  monto_total:     number;
  monto_pagado:    number;
  saldo:           number;
  estado:          string;
  observacion:     string | null;
  comprobante:     ComprobanteOrigenVM | null;
}

// ─── Mapas ────────────────────────────────────────────────────────────────────

const ICONO_PAGO: Record<string, string> = {
  EFECTIVO:     'pi pi-money-bill',
  TARJETA:      'pi pi-credit-card',
  YAPE:         'pi pi-mobile',
  PLIN:         'pi pi-mobile',
  TRANSFERENCIA:'pi pi-arrow-right-arrow-left',
};

@Component({
  selector: 'app-detalle-venta-por-cobrar',
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
  ],
  providers: [MessageService],
  templateUrl: './detalle-venta-por-cobrar.html',
  styleUrls: ['./detalle-venta-por-cobrar.css'],
})
export class DetalleVentaPorCobrar implements OnInit, OnDestroy {

  // ─── Servicios ────────────────────────────────────────────────────────────
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  private readonly location       = inject(Location);
  private readonly messageService = inject(MessageService);
  // private readonly arService   = inject(AccountReceivableService); // TODO: descomentar

  // ─── Cabecera ─────────────────────────────────────────────────────────────
  readonly tituloKicker    = 'ADMINISTRACIÓN · VENTAS POR COBRAR · DETALLE';
  readonly subtituloKicker = 'DETALLE DE VENTA POR COBRAR';
  readonly iconoCabecera   = 'pi pi-credit-card';

  // ─── Estado ───────────────────────────────────────────────────────────────
  cuenta  = signal<CuentaPorCobrarVM | null>(null);
  pagos   = signal<PagoVM[]>([]);
  loading = signal(true);

  // ─── Computeds ────────────────────────────────────────────────────────────
  totalPagado = computed(() =>
    this.pagos().reduce((sum, p) => sum + p.monto, 0)
  );

  private subs = new Subscription();

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.subs.add(
      this.route.paramMap.subscribe((params) => {
        const id = params.get('id');
        id ? this.cargarDetalle(+id) : this.volver();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ─── Carga principal ──────────────────────────────────────────────────────
  cargarDetalle(id: number): void {
    this.loading.set(true);
    this.cuenta.set(null);
    this.pagos.set([]);

    // TODO: reemplazar con llamada real al servicio
    // this.subs.add(
    //   this.arService.getById(id).subscribe({
    //     next: (res) => {
    //       this.cuenta.set(this.mapCuenta(res));
    //       this.pagos.set(this.mapPagos(res.pagos ?? []));
    //       this.loading.set(false);
    //     },
    //     error: () => {
    //       this.loading.set(false);
    //       this.messageService.add({
    //         severity: 'error',
    //         summary: 'Error',
    //         detail: 'No se pudo cargar el detalle.',
    //         life: 3000,
    //       });
    //       setTimeout(() => this.volver(), 2000);
    //     },
    //   }),
    // );

    // ── MOCK temporal para desarrollo ──────────────────────────────────────
    setTimeout(() => {
      this.cuenta.set({
        id:               id,
        cliente_nombre:   'Juan Pérez García',
        cliente_doc:      '12345678',
        cliente_email:    'juan.perez@email.com',
        cliente_telefono: '987654321',
        fec_creacion:     new Date().toISOString(),
        fec_vencimiento:  new Date(Date.now() + 15 * 86400000).toISOString(),
        tipo_pago:        'CRÉDITO 30 DÍAS',
        moneda:           'PEN',
        monto_total:      1500.00,
        monto_pagado:     500.00,
        saldo:            1000.00,
        estado:           'PARCIAL',
        observacion:      'Venta a crédito según acuerdo comercial.',
        comprobante: {
          numero_completo: 'B001-00000042',
          tipo_label:      'BOLETA',
          fec_emision:     new Date().toISOString(),
          responsable:     'María López',
          sede_nombre:     'Sede Central Lima',
          total:           1500.00,
          estado:          'EMITIDO',
          detalles: [
            { cod_prod: 'PROD-001', descripcion: 'Producto A', cantidad: 2, pre_uni: 423.73, igv: 76.27, total: 1000.00 },
            { cod_prod: 'PROD-002', descripcion: 'Producto B', cantidad: 1, pre_uni: 423.73, igv: 76.27, total: 500.00 },
          ],
        },
      });
      this.pagos.set([
        { id: 1, fec_pago: new Date(Date.now() - 5 * 86400000).toISOString(), metodo_pago: 'EFECTIVO', referencia: null, monto: 500.00, estado: 'CONFIRMADO' },
      ]);
      this.loading.set(false);
    }, 600);
  }

  // ─── Navegación ───────────────────────────────────────────────────────────
  volver():    void { this.location.back(); }
  irListado(): void { this.router.navigate(['/admin/ventas-por-cobrar']); }

  registrarPago(id: number): void {
    this.router.navigate(['/admin/ventas-por-cobrar/registrar-pago', id]);
  }

  imprimirDetalle(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimir',
      detail: 'Función de impresión en desarrollo.',
      life: 3000,
    });
  }

  imprimirPago(pago: PagoVM): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Recibo',
      detail: `Imprimiendo recibo de pago #${pago.id}`,
      life: 3000,
    });
  }

  // ─── Helpers UI ───────────────────────────────────────────────────────────
  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info' | 'secondary'> = {
      PAGADO:   'success',
      PARCIAL:  'warn',
      PENDIENTE:'info',
      VENCIDO:  'danger',
      ANULADO:  'secondary',
    };
    return map[estado] ?? 'secondary';
  }

  getEstadoComprobanteTag(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      EMITIDO:  'success',
      ANULADO:  'warn',
      RECHAZADO:'danger',
    };
    return map[estado] ?? 'secondary';
  }

  getPagoEstadoTag(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'info'> = {
      CONFIRMADO: 'success',
      PENDIENTE:  'warn',
      RECHAZADO:  'danger',
    };
    return map[estado] ?? 'info';
  }

  getIconoPago(medio: string): string {
    return ICONO_PAGO[medio?.toUpperCase()] ?? 'pi pi-wallet';
  }

  getPorcentajePago(c: CuentaPorCobrarVM): number {
    if (!c.monto_total || c.monto_total === 0) return 0;
    return Math.min((c.monto_pagado / c.monto_total) * 100, 100);
  }

  // ─── Helpers fechas ───────────────────────────────────────────────────────
  getDiasRestantes(fecVenc: string | Date | null): number {
    if (!fecVenc) return 0;
    const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fecVenc); venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDiasLabel(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return 'Vencido';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return '1 día';
    return `${dias} días`;
  }

  getDiasBadgeClass(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return 'dias-badge dias-badge--vencido';
    if (dias === 0) return 'dias-badge dias-badge--hoy';
    if (dias <= 3)  return 'dias-badge dias-badge--urgente';
    if (dias <= 7)  return 'dias-badge dias-badge--proximo';
    return 'dias-badge dias-badge--ok';
  }

  getDiasColor(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)  return '#f87171';
    if (dias <= 3) return '#fb923c';
    if (dias <= 7) return '#facc15';
    return 'var(--text-color)';
  }
}