import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { QuoteService } from '../../../services/quote.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { Quote, QuoteCliente, QuoteSede } from '../../../interfaces/quote.interface';

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, CardModule, TagModule, ToastModule,
    ConfirmDialogModule, DividerModule, TooltipModule, TableModule,
    LoadingOverlayComponent,
  ],
  templateUrl: './detalle-cotizacion.component.html',
  styleUrl: './detalle-cotizacion.component.css',
  providers: [MessageService, ConfirmationService],
})
export class DetalleCotizacionComponent implements OnInit {
  private route               = inject(ActivatedRoute);
  private router              = inject(Router);
  private quoteService        = inject(QuoteService);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // ── Signals ───────────────────────────────────────────────────────────────
  loading    = signal(true);
  cotizacion = signal<Quote | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  detalles = computed(() => this.cotizacion()?.detalles ?? []);
  cliente  = computed<QuoteCliente | null>(() => this.cotizacion()?.cliente ?? null);
  sede     = computed<QuoteSede | null>(() => this.cotizacion()?.sede ?? null);

  subtotal = computed(() => this.cotizacion()?.subtotal ?? 0);
  igv      = computed(() => this.cotizacion()?.igv      ?? 0);
  total    = computed(() => this.cotizacion()?.total    ?? 0);

  getCodigo = computed(() => {
    const c = this.cotizacion();
    if (!c) return '—';
    return (c as any).codigo ?? `COT-${c.id_cotizacion ?? ''}`;
  });

  getSedeNombre = computed(() => {
    const c = this.cotizacion();
    if (!c) return '—';
    return c.sede?.nombre_sede ?? (c as any).sede_nombre ?? '—';
  });

  clienteNombre = computed(() => {
    const cl = this.cliente();
    if (!cl) return '—';
    if (cl.razon_social) return cl.razon_social;
    const nombre    = cl.nombre_cliente    ?? '';
    const apellidos = cl.apellidos_cliente ?? '';
    return `${nombre} ${apellidos}`.trim() || '—';
  });

  almacenNombre = computed(() => {
    const c = this.cotizacion() as any;
    if (!c) return '—';
    return c.almacen?.nombre ?? c.almacen_nombre ?? '—';
  });

  // Computed para el tipo — evita castear (c as any) en cada lugar
  tipoCotizacion = computed<'VENTA' | 'COMPRA'>(() => {
    return (this.cotizacion() as any)?.tipo ?? 'VENTA';
  });

  esCompra = computed(() => this.tipoCotizacion() === 'COMPRA');

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/admin/cotizaciones-venta']); return; }

    this.quoteService.getQuoteById(Number(id)).subscribe({
      next: (data: Quote) => {
        this.cotizacion.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   'No se pudo cargar la cotización.',
        });
      },
    });
  }

  // ── Estado tag ────────────────────────────────────────────────────────────
  mapEstadoTag(estado: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'APROBADA':  return 'success';
      case 'PENDIENTE': return 'warn';
      case 'RECHAZADA': return 'danger';
      default:          return 'secondary';
    }
  }

  // ── Helpers de fechas ─────────────────────────────────────────────────────
  getDiasRestantes(fecVenc: string | null): number {
    if (!fecVenc) return 0;
    const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fecVenc); venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDiasLabel(fecVenc: string | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return `Venció hace ${Math.abs(dias)} día(s)`;
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
  }

  getDiasBadgeClass(fecVenc: string | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return 'dias-badge--vencido';
    if (dias === 0) return 'dias-badge--hoy';
    if (dias <= 3)  return 'dias-badge--urgente';
    if (dias <= 7)  return 'dias-badge--proximo';
    return 'dias-badge--ok';
  }

  // ── Acciones ──────────────────────────────────────────────────────────────
  rechazar() {
    const id = this.cotizacion()?.id_cotizacion;
    if (!id) return;
    this.confirmationService.confirm({
      message: '¿Estás seguro de rechazar esta cotización?',
      header:  'Confirmar rechazo',
      icon:    'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'RECHAZADA').subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary:  'Rechazada',
              detail:   'Cotización rechazada.',
            });
            this.cotizacion.update(c => c ? { ...c, estado: 'RECHAZADA' } : c);
          },
          error: () => this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'No se pudo actualizar.',
          }),
        });
      },
    });
  }

  reactivar() {
    const id = this.cotizacion()?.id_cotizacion;
    if (!id) return;
    this.confirmationService.confirm({
      message: '¿Deseas reactivar esta cotización a PENDIENTE?',
      header:  'Confirmar reactivación',
      icon:    'pi pi-refresh',
      acceptLabel: 'Sí, reactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'PENDIENTE').subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary:  'Reactivada',
              detail:   'Cotización reactivada.',
            });
            this.cotizacion.update(c => c ? { ...c, estado: 'PENDIENTE' } : c);
          },
          error: () => this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   'No se pudo reactivar.',
          }),
        });
      },
    });
  }

  irAgregarVenta() {
    const id      = this.cotizacion()?.id_cotizacion;
    const esComp  = this.esCompra();
    if (!id) return;

    const impacto = esComp
      ? '<br><br><span style="color:#4ade80">↑ Sumará stock a los productos</span>'
      : '<br><br><span style="color:#f87171">↓ Restará stock a los productos</span>';

    this.confirmationService.confirm({
      message:  `¿Confirmas generar una <strong>${esComp ? 'compra' : 'venta'} al contado</strong> a partir de esta cotización?${impacto}`,
      header:   esComp ? 'Registrar Compra (Contado)' : 'Generar Venta (Contado)',
      icon:     esComp ? 'pi pi-truck' : 'pi pi-shopping-cart',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.router.navigate(
          ['/admin/generar-ventas-administracion'],
          { queryParams: { cotizacion: id, tipo: 'contado' } }
        );
      },
    });
  }

  irAgregarVentaPorCobrar() {
    const id      = this.cotizacion()?.id_cotizacion;
    const esComp  = this.esCompra();
    if (!id) return;

    const impacto = esComp
      ? '<br><br><span style="color:#4ade80">↑ Sumará stock a los productos</span>'
      : '<br><br><span style="color:#f87171">↓ Restará stock a los productos</span>';

    this.confirmationService.confirm({
      message:  `¿Confirmas generar una <strong>${esComp ? 'compra' : 'venta'} a crédito</strong> a partir de esta cotización?${impacto}`,
      header:   esComp ? 'Registrar Compra (Crédito)' : 'Generar Venta (Crédito)',
      icon:     esComp ? 'pi pi-truck' : 'pi pi-credit-card',
      acceptLabel: 'Sí, continuar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.router.navigate(
          ['/admin/generar-ventas-administracion'],
          { queryParams: { cotizacion: id, tipo: 'credito' } }
        );
      },
    });
  }

  imprimir() {
    const id = this.cotizacion()?.id_cotizacion;
    if (!id) return;
    this.quoteService.exportPdf(id);
  }

  enviar() {
    const id = this.cotizacion()?.id_cotizacion;
    if (!id) return;

    this.messageService.add({
      severity: 'info',
      summary:  'Enviando...',
      detail:   'Generando y enviando cotización por email.',
    });

    this.quoteService.sendByEmail(id).subscribe({
      next:  (res) => this.messageService.add({
        severity: 'success',
        summary:  'Email enviado',
        detail:   `Cotización enviada a ${res.sentTo}`,
      }),
      error: () => this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'No se pudo enviar. Verifique que el cliente tenga email registrado.',
      }),
    });
  }

  volver() { this.router.navigate(['/admin/cotizaciones-venta']); }

  irEditar() {
    const id = this.cotizacion()?.id_cotizacion;
    this.router.navigate(['/admin/editar-cotizacion', id]);
  }
}