import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { DatePickerModule } from 'primeng/datepicker';
import { VentasAdminService } from '../../../services/ventas.service';
import { TooltipModule } from 'primeng/tooltip';
import { SedeService } from '../../../services/sede.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../shared/components/paginador/Paginador.component';
import { ExcelUtils } from '../../../utils/excel.utils';
import {
  AccountReceivableService,
  AccountReceivableResponse,
  AccountReceivableStatus,
} from '../../../services/account-receivable.service';
import {
  getLunesSemanaActualPeru,
  getDomingoSemanaActualPeru,
  getHoyPeru,
} from '../../../../shared/utils/date-peru.utils';
import {
  AccionesComprobanteDialogComponent,
  AccionesComprobanteConfig,
  AccionComprobante,
} from '../../../../shared/components/acciones-comprobante-dialog/acciones-comprobante';
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';

@Component({
  selector: 'app-ventas-por-cobrar-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    SelectModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialog,
    ConfirmDialogModule,
    RouterModule,
    AutoComplete,
    TooltipModule,
    DatePickerModule,
    DialogModule,
    AccionesComprobanteDialogComponent,
    PaginadorComponent,
    LoadingOverlayComponent
  ],
  templateUrl: './ventas-por-cobrar-listado.html',
  styleUrl: './ventas-por-cobrar-listado.css',
  providers: [MessageService, ConfirmationService],
})
export class VentasPorCobrarListadoComponent implements OnInit, OnDestroy {
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router              = inject(Router);
  private sedeService         = inject(SedeService);
  readonly arService          = inject(AccountReceivableService);
  private ventasService       = inject(VentasAdminService);

  public tituloKicker    = 'ADMINISTRACIÓN';
  public subtituloKicker = 'VENTAS POR COBRAR';

  buscarValue        = signal<string>('');
  sugerencias        = signal<AccountReceivableResponse[]>([]);
  estadoSeleccionado = signal<AccountReceivableStatus | null>('PENDIENTE');
  sedeSeleccionada   = signal<number | null>(null);
  rows               = signal<number>(5);
  fechaInicio        = signal<Date | null>(getLunesSemanaActualPeru());
  fechaFin           = signal<Date | null>(getDomingoSemanaActualPeru());
  paginaActual       = signal<number>(1);

  totalPaginas = computed(() => {
    const total = this.arService.totalRecords();
    const limit = this.rows();
    return limit > 0 ? Math.ceil(total / limit) : 1;
  });

  sedesOptions = computed(() =>
    this.sedeService.sedes().map((s) => ({ label: s.nombre, value: s.id_sede })),
  );

  ventasFiltradas = computed(() => {
    const q      = this.buscarValue().toLowerCase();
    const inicio = this.fechaInicio();
    const fin    = this.fechaFin();
    return this.arService.accounts().filter((a) => {
      if (q && !a.userRef.toLowerCase().includes(q) && !String(a.salesReceiptId).includes(q))
        return false;
      const fec = new Date(a.issueDate);
      if (inicio) { const d = new Date(inicio); d.setHours(0,0,0,0); if (fec < d) return false; }
      if (fin)    { const d = new Date(fin);    d.setHours(23,59,59,999); if (fec > d) return false; }
      return true;
    });
  });

  totalPorCobrar     = computed(() => this.arService.kpiTotal());
  totalPendientes    = computed(() => this.arService.kpiPendientes());
  totalVencidos      = computed(() => this.arService.kpiVencidos());
  totalCancelados    = computed(() => this.arService.kpiCancelados());

  estadosOptions = [
    { label: 'Todos',     value: null },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Parcial',   value: 'PARCIAL' },
    { label: 'Pagado',    value: 'PAGADO' },
    { label: 'Vencido',   value: 'VENCIDO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ];

  // ── Dialog de acciones (shared) ───────────────────────────────────
  accionesVisible = false;
  accionCargando: string | null = null;
  accionesConfig: AccionesComprobanteConfig | null = null;
  private cuentaAcciones: AccountReceivableResponse | null = null;

  // ── Dialog WhatsApp ───────────────────────────────────────────────
  mostrarDialogWsp  = false;
  enviandoWsp       = false;
  wspReady          = false;
  wspQr: string | null = null;
  cuentaWsp: AccountReceivableResponse | null = null;
  private pollingInterval: any = null;

  // ── Lifecycle ─────────────────────────────────────────────────────
  async ngOnInit() {
    this.sedeService.loadSedes().subscribe();
    const sedeDefault = this.getSedeUsuarioActual();
    if (sedeDefault) this.sedeSeleccionada.set(sedeDefault);
    await this.arService.getAll(1, this.rows(), sedeDefault ?? undefined, 'PENDIENTE');
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  private getSedeUsuarioActual(): number | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      return user.idSede ?? null;
    } catch { return null; }
  }

  // ── Abrir dialog de acciones ──────────────────────────────────────
  abrirAcciones(a: AccountReceivableResponse): void {
    this.cuentaAcciones = a;
    this.accionesConfig = {
      titulo:    `#${a.salesReceiptId}`,
      subtitulo: a.userRef,
    };
    this.accionCargando  = null;
    this.accionesVisible = true;
  }

  // ── Dispatch de acciones ──────────────────────────────────────────
  onAccion(accion: AccionComprobante): void {
    const a = this.cuentaAcciones!;

    switch (accion) {

      // ── WhatsApp — abre el dialog propio de WSP ─────────────────
      case 'wsp':
        this.accionesVisible = false;
        this.abrirDialogWsp(a);
        break;

      // ── Email ────────────────────────────────────────────────────
      case 'email':
        this.accionCargando = 'email';
        this.arService.sendByEmail(a.id).subscribe({
          next: (res) => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Email enviado',
              detail: `Cuenta enviada a ${res.sentTo}`,
              life: 4000,
            });
          },
          error: () => {
            this.accionCargando = null;
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo enviar. Verifique que el cliente tenga email registrado.',
              life: 3000,
            });
          },
        });
        break;

      // ── PDF imprimir — abre blob y dispara print automático ──────
      case 'pdf-imprimir':
        this.accionCargando = 'pdf-imprimir';
        this.arService.printPdf(a.id).subscribe({
          next: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
          },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'No se pudo abrir el PDF para imprimir', life: 3000,
            });
          },
        });
        break;

      // ── PDF descargar ─────────────────────────────────────────────
      case 'pdf-descargar':
        this.accionCargando = 'pdf-descargar';
        this.arService.downloadPdf(a.id).subscribe({
          next: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
          },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'No se pudo descargar el PDF', life: 3000,
            });
          },
        });
        break;

      // ── Voucher imprimir ─────────────────────────────────────────
      case 'voucher-imprimir':
        this.accionCargando = 'voucher-imprimir';
        this.arService.printVoucher(a.id).subscribe({
          next: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
          },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'info', summary: 'Próximamente',
              detail: 'El endpoint de voucher térmico está en desarrollo', life: 3000,
            });
          },
        });
        break;

      // ── Voucher descargar ────────────────────────────────────────
      case 'voucher-descargar':
        this.accionCargando = 'voucher-descargar';
        this.arService.downloadVoucher(a.id).subscribe({
          next: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
          },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'info', summary: 'Próximamente',
              detail: 'El endpoint de voucher térmico está en desarrollo', life: 3000,
            });
          },
        });
        break;
    }
  }

  // ── WhatsApp dialog ───────────────────────────────────────────────
  abrirDialogWsp(a: AccountReceivableResponse): void {
    this.cuentaWsp        = a;
    this.mostrarDialogWsp = true;
    this.wspReady         = false;
    this.wspQr            = null;
    this.verificarEstadoWsp();
  }

  cerrarDialogWsp(): void {
    this.mostrarDialogWsp = false;
    this.cuentaWsp        = null;
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  private verificarEstadoWsp(): void {
    this.arService.getWhatsAppStatus().subscribe({
      next: (res) => {
        this.wspReady = res.ready;
        this.wspQr    = res.qr ?? null;
        if (!res.ready) {
          this.pollingInterval = setInterval(() => {
            this.arService.getWhatsAppStatus().subscribe({
              next: (r) => {
                this.wspReady = r.ready;
                this.wspQr    = r.qr ?? null;
                if (r.ready) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
              },
            });
          }, 3000);
        }
      },
      error: () =>
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo conectar con el servicio de WhatsApp.', life: 4000,
        }),
    });
  }

  enviarPorWsp(): void {
    if (!this.cuentaWsp) return;
    this.enviandoWsp = true;
    this.arService.sendByWhatsApp(this.cuentaWsp.id).subscribe({
      next: (res) => {
        this.enviandoWsp = false;
        this.cerrarDialogWsp();
        this.messageService.add({
          severity: 'success', summary: '¡Enviado!',
          detail: `Cuenta #${this.cuentaWsp?.salesReceiptId} enviada a ${res.sentTo}`, life: 5000,
        });
      },
      error: (err) => {
        this.enviandoWsp = false;
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo enviar por WhatsApp.', life: 5000,
        });
      },
    });
  }

  // ── Filtros y paginación ──────────────────────────────────────────
  async onEstadoChange(v: AccountReceivableStatus | null) {
    this.estadoSeleccionado.set(v); this.paginaActual.set(1);
    await this.arService.getAll(1, this.rows(), this.sedeSeleccionada() ?? undefined, v);
  }

  async onSedeChange(sedeId: number | null) {
    this.sedeSeleccionada.set(sedeId); this.paginaActual.set(1);
    await this.arService.getAll(1, this.rows(), sedeId ?? undefined, this.estadoSeleccionado());
  }

  async onPageChange(page: number) {
    this.paginaActual.set(page);
    await this.arService.getAll(page, this.rows(), this.sedeSeleccionada() ?? undefined, this.estadoSeleccionado());
  }

  async onLimitChange(limit: number) {
    this.rows.set(limit); this.paginaActual.set(1);
    await this.arService.getAll(1, limit, this.sedeSeleccionada() ?? undefined, this.estadoSeleccionado());
  }

  limpiarFiltros() {
    this.buscarValue.set(''); this.sugerencias.set([]);
    this.fechaInicio.set(null); this.fechaFin.set(null);
    this.sedeSeleccionada.set(null); this.estadoSeleccionado.set(null);
    this.paginaActual.set(1);
    this.arService.getAll(1, this.rows(), undefined, null);
  }

  searchCuenta(event: any) {
    const q = event.query?.toLowerCase() ?? '';
    if (!q || q.length < 2) { this.sugerencias.set([]); return; }
    this.sugerencias.set(
      this.arService.accounts().filter(
        (a) => a.userRef.toLowerCase().includes(q) || String(a.salesReceiptId).includes(q)
      ),
    );
  }

  seleccionarSugerencia(event: any) {
    const a = event.value as AccountReceivableResponse;
    if (a) this.buscarValue.set(a.userRef);
  }

  onFechaChange() { /* filtro local */ }
  limpiarBusqueda() { this.buscarValue.set(''); this.sugerencias.set([]); }

  exportarExcel(): void {
    const datos = this.ventasFiltradas();
    if (datos.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros para exportar', life: 3000 });
      return;
    }
    const datosExcel = datos.map((a) => ({
      'N° Comprobante': `#${a.salesReceiptId}`, Cliente: a.userRef,
      Observación: a.observation ?? '', 'Fecha Emisión': this.formatDate(a.issueDate),
      'Fecha Vencim.': this.formatDate(a.dueDate), Días: this.getDiasBadgeLabel(a.dueDate),
      Moneda: a.currencyCode, 'Monto Total': a.totalAmount, 'Saldo Pendiente': a.pendingBalance, Estado: a.status,
    }));
    const nombreArchivo = ExcelUtils.generarNombreConFecha('ventas-por-cobrar');
    ExcelUtils.exportarAExcel(datosExcel, nombreArchivo, 'Cuentas por Cobrar');
    this.messageService.add({ severity: 'success', summary: 'Exportación exitosa', detail: `Archivo ${nombreArchivo}.xlsx descargado`, life: 3000 });
  }

  // ── Helpers visuales ──────────────────────────────────────────────
  getTagClass(status: AccountReceivableStatus): string {
    const map: Record<string, string> = {
      PENDIENTE: 'cotizaciones-tag-amarillo', PARCIAL: 'cotizaciones-tag-parcial',
      PAGADO: 'cotizaciones-tag-aprobada',    VENCIDO: 'cotizaciones-tag-vencido',
      CANCELADO: 'cotizaciones-tag-rechazada',
    };
    return map[status] ?? 'cotizaciones-tag-amarillo';
  }

  getDiasBadgeClass(dueDate: string): string {
    const d = this.calcDias(dueDate);
    if (d < 0)   return 'dias-badge dias-badge--vencido';
    if (d === 0) return 'dias-badge dias-badge--hoy';
    if (d <= 3)  return 'dias-badge dias-badge--urgente';
    if (d <= 7)  return 'dias-badge dias-badge--proximo';
    return 'dias-badge dias-badge--ok';
  }

  getDiasBadgeLabel(dueDate: string): string {
    const d = this.calcDias(dueDate);
    if (d < 0)   return `Vencido ${Math.abs(d)}d`;
    if (d === 0) return 'Hoy';
    return `${d}d`;
  }

  private calcDias(dueDate: string): number {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const v   = new Date(dueDate); v.setHours(0,0,0,0);
    return Math.round((v.getTime() - hoy.getTime()) / 86_400_000);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE');
  }

  irAgregarVentaPorCobrar(id: number) { this.router.navigate(['/admin/ventas-por-cobrar/pagar-ventas-por-cobrar', id]); }
  verDetalle(id: number)               { this.router.navigate(['/admin/ventas-por-cobrar/detalles-ventas-por-cobrar', id]); }

  rechazarCotizacion(id: number) {
    const cuenta = this.arService.accounts().find((a) => a.id === id);
    this.confirmationService.confirm({
      message: `¿Cancelar esta venta por cobrar? <br><small class="text-400">También se anulará el comprobante de venta #${cuenta?.salesReceiptId ?? ''}.</small>`,
      header: 'Confirmar Cancelación', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar todo', rejectLabel: 'No',
      accept: async () => {
        const res = await this.arService.cancel({ accountReceivableId: id, reason: 'Cancelado desde listado' });
        if (!res) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: this.arService.error() ?? 'No se pudo cancelar la cuenta.' });
          return;
        }
        if (cuenta?.salesReceiptId) {
          try {
            await firstValueFrom(this.ventasService.anularVenta(cuenta.salesReceiptId, 'Cancelado desde ventas por cobrar'));
          } catch {
            this.messageService.add({ severity: 'warn', summary: 'Cuenta cancelada', detail: `La cuenta fue cancelada pero no se pudo anular el comprobante #${cuenta.salesReceiptId}.` });
            return;
          }
        }
        this.messageService.add({ severity: 'info', summary: 'Cancelada', detail: `Cuenta cancelada y comprobante #${cuenta?.salesReceiptId ?? ''} marcado como ANULADO.` });
      },
    });
  }
}