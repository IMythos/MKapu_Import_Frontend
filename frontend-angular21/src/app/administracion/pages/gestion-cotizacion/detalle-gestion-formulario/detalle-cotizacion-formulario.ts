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

@Component({
  selector: 'app-detalle-cotizacion',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    TooltipModule,
    TableModule,
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
  loading     = signal(true);
  cotizacion  = signal<any | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  detalles   = computed(() => this.cotizacion()?.detalles   ?? []);
  cliente    = computed(() => this.cotizacion()?.cliente    ?? null);
  sede       = computed(() => this.cotizacion()?.sede       ?? null);

  subtotal   = computed(() =>
    +this.detalles().reduce((acc: number, d: any) => acc + d.cantidad * d.precio, 0).toFixed(2)
  );
  igv        = computed(() => +(this.subtotal() * 0.18).toFixed(2));
  total      = computed(() => +(this.subtotal() + this.igv()).toFixed(2));

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/admin/cotizaciones']); return; }

    this.quoteService.getQuoteById(Number(id)).subscribe({
      next: (data) => {
        this.cotizacion.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la cotización.',
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
  getDiasRestantes(fecVenc: string | Date | null): number {
    if (!fecVenc) return 0;
    const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fecVenc); venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDiasLabel(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return `Venció hace ${Math.abs(dias)} día(s)`;
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
  }

  getDiasBadgeClass(fecVenc: string | Date | null): string {
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
      header: 'Confirmar rechazo',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'RECHAZADA').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Rechazada', detail: 'Cotización rechazada.' });
            this.cotizacion.update(c => ({ ...c, estado: 'RECHAZADA' }));
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar.' }),
        });
      },
    });
  }

  reactivar() {
    const id = this.cotizacion()?.id_cotizacion;
    if (!id) return;
    this.confirmationService.confirm({
      message: '¿Deseas reactivar esta cotización a PENDIENTE?',
      header: 'Confirmar reactivación',
      icon: 'pi pi-refresh',
      acceptLabel: 'Sí, reactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'PENDIENTE').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Reactivada', detail: 'Cotización reactivada.' });
            this.cotizacion.update(c => ({ ...c, estado: 'PENDIENTE' }));
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar.' }),
        });
      },
    });
  }

  irAgregarVenta() {
    const id = this.cotizacion()?.id_cotizacion;
    this.router.navigate(['/admin/generar-ventas-administracion'], {
      queryParams: { cotizacion: id, tipo: 'contado' },
    });
  }

  irAgregarVentaPorCobrar() {
    const id = this.cotizacion()?.id_cotizacion;
    this.router.navigate(['/admin/generar-ventas-administracion'], {
      queryParams: { cotizacion: id, tipo: 'credito' },
    });
  }

  imprimir() {
    this.messageService.add({ severity: 'info', summary: 'Imprimir', detail: `Cotización ${this.cotizacion()?.codigo}` });
  }

  volver() {
    this.router.navigate(['/admin/cotizaciones']);
  }

  irEditar() {
    const id = this.cotizacion()?.id_cotizacion;
    this.router.navigate(['/admin/editar-cotizacion', id]);
  }
}