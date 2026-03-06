import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { SedeService } from '../../../services/sede.service';
import {
  AccountReceivableService,
  AccountReceivableResponse,
  AccountReceivableStatus,
} from '../../../services/account-receivable.service';

@Component({
  selector: 'app-ventas-por-cobrar-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, SelectModule, CardModule,
    ButtonModule, TagModule, ToastModule, ConfirmDialog, ConfirmDialogModule,
    RouterModule, AutoComplete, TooltipModule,
  ],
  templateUrl: './ventas-por-cobrar-listado.html',
  styleUrl: './ventas-por-cobrar-listado.css',
  providers: [MessageService, ConfirmationService],
})
export class VentasPorCobrarListadoComponent implements OnInit {

  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router              = inject(Router);
  private sedeService         = inject(SedeService);
  readonly arService          = inject(AccountReceivableService);

  public tituloKicker    = 'ADMINISTRACIÓN';
  public subtituloKicker = 'VENTAS POR COBRAR';

  // ── Signals ──────────────────────────────────────────────────────
  buscarValue        = signal<string>('');
  sugerencias        = signal<AccountReceivableResponse[]>([]);
  estadoSeleccionado = signal<AccountReceivableStatus | null>(null);
  sedeSeleccionada   = signal<number | null>(null);
  rows               = signal<number>(10);

  // ── Computed: sedes ───────────────────────────────────────────────
  sedesOptions = computed(() =>
    this.sedeService.sedes().map(s => ({ label: s.nombre, value: s.id_sede }))
  );

  // ── Computed: lista filtrada (frontend: búsqueda y estado) ────────
  ventasFiltradas = computed(() => {
    const q   = this.buscarValue().toLowerCase();
    const est = this.estadoSeleccionado();

    return this.arService.accounts().filter(a => {
      const matchQ   = !q   || a.userRef.toLowerCase().includes(q) ||
                               String(a.salesReceiptId).includes(q);
      const matchEst = !est || a.status === est;
      return matchQ && matchEst;
    });
  });

  // ── Computed: contadores ──────────────────────────────────────────
  totalPorCobrar     = computed(() => this.arService.totalRecords());
  totalPendientes    = computed(() => this.arService.pendientes().length);
  totalVencidos      = computed(() => this.arService.vencidos().length);
  totalProcesadasHoy = computed(() => {
    const hoy = new Date().toDateString();
    return this.arService.accounts().filter(a =>
      new Date(a.issueDate).toDateString() === hoy
    ).length;
  });

  // ── Opciones ──────────────────────────────────────────────────────
  estadosOptions = [
    { label: 'Todos',     value: null        },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Parcial',   value: 'PARCIAL'   },
    { label: 'Pagado',    value: 'PAGADO'    },
    { label: 'Vencido',   value: 'VENCIDO'   },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  // ── Init ──────────────────────────────────────────────────────────
  async ngOnInit() {
    this.sedeService.loadSedes().subscribe();

    const sedeDefault = this.getSedeUsuarioActual();
    if (sedeDefault) this.sedeSeleccionada.set(sedeDefault);

    await this.arService.getAll(1, this.rows(), sedeDefault ?? undefined);
  }

  private getSedeUsuarioActual(): number | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      return user.idSede ?? null;
    } catch { return null; }
  }

  // ── Handlers filtros ──────────────────────────────────────────────
  onEstadoChange(v: AccountReceivableStatus | null) {
    this.estadoSeleccionado.set(v);
  }

  async onSedeChange(sedeId: number | null) {
    this.sedeSeleccionada.set(sedeId);
    await this.arService.getAll(1, this.rows(), sedeId ?? undefined);
  }

  onPageChange(e: any) {
    this.rows.set(e.rows);
    this.arService.goToPage(e.page + 1);
  }

  // ── Autocomplete ──────────────────────────────────────────────────
  searchCuenta(event: any) {
    const q = event.query?.toLowerCase() ?? '';
    if (!q || q.length < 2) { this.sugerencias.set([]); return; }
    this.sugerencias.set(
      this.arService.accounts().filter(a =>
        a.userRef.toLowerCase().includes(q) ||
        String(a.salesReceiptId).includes(q)
      )
    );
  }

  seleccionarSugerencia(event: any) {
    const a = event.value as AccountReceivableResponse;
    if (a) this.buscarValue.set(a.userRef);
  }

  limpiarBusqueda() {
    this.buscarValue.set('');
    this.sugerencias.set([]);
  }

  // ── Helpers visuales ──────────────────────────────────────────────
  getTagClass(status: AccountReceivableStatus): string {
    switch (status) {
      case 'PENDIENTE': return 'cotizaciones-tag-amarillo';
      case 'PARCIAL':   return 'cotizaciones-tag-parcial';
      case 'PAGADO':    return 'cotizaciones-tag-aprobada';
      case 'VENCIDO':   return 'cotizaciones-tag-vencido';
      case 'CANCELADO': return 'cotizaciones-tag-rechazada';
      default:          return 'cotizaciones-tag-amarillo';
    }
  }

  getDiasBadgeClass(dueDate: string): string {
    const dias = this.calcDias(dueDate);
    if (dias < 0)   return 'dias-badge dias-badge--vencido';
    if (dias === 0) return 'dias-badge dias-badge--hoy';
    if (dias <= 3)  return 'dias-badge dias-badge--urgente';
    if (dias <= 7)  return 'dias-badge dias-badge--proximo';
    return 'dias-badge dias-badge--ok';
  }

  getDiasBadgeLabel(dueDate: string): string {
    const dias = this.calcDias(dueDate);
    if (dias < 0)   return `Vencido ${Math.abs(dias)}d`;
    if (dias === 0) return 'Hoy';
    return `${dias}d`;
  }

  private calcDias(dueDate: string): number {
    const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(dueDate); venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / 86_400_000);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE');
  }

  // ── Acciones ──────────────────────────────────────────────────────
  irAgregarVentaPorCobrar(id: number) {
    this.router.navigate(['/admin/pagar-ventas-por-cobrar', id]);
  }

  verDetalle(id: number) {
    this.router.navigate(['/admin/editar-ventas-por-cobrar', id]);
  }

  rechazarCotizacion(id: number) {
    const cuenta = this.arService.accounts().find(a => a.id === id);

    this.confirmationService.confirm({
      message: `¿Cancelar esta venta por cobrar? <br>
                <small class="text-400">
                  También se anulará el comprobante de venta #${cuenta?.salesReceiptId ?? ''}.
                </small>`,
      header:      'Confirmar Cancelación',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar todo',
      rejectLabel: 'No',
      accept: async () => {
        const res = await this.arService.cancel({
          accountReceivableId: id,
          reason: 'Cancelado desde listado',
        });

        if (!res) {
          this.messageService.add({
            severity: 'error',
            summary:  'Error',
            detail:   this.arService.error() ?? 'No se pudo cancelar.',
          });
          return;
        }

        this.messageService.add({
          severity: 'info',
          summary:  'Cancelada',
          detail:   `Cuenta cancelada. Comprobante #${cuenta?.salesReceiptId ?? ''} marcado como ANULADO.`,
        });
      },
    });
  }
}