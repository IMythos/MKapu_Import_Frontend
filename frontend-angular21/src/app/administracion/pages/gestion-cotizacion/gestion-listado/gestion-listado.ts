import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AutoComplete } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SedeService } from '../../../services/sede.service';
import { QuoteListItem } from '../../../interfaces/quote.interface';
import { QuoteService } from '../../../services/quote.service';
import { SedeAlmacenService } from '../../../services/sede-almacen.service';

import { PaginadorComponent } from '../../../../shared/components/paginador/Paginador.component';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { getHoyPeru } from '../../../../shared/utils/date-peru.utils';
import { AccionesComprobanteDialogComponent, AccionesComprobanteConfig, AccionComprobante } from '../../../../shared/components/acciones-comprobante-dialog/acciones-comprobante';

@Component({
  selector: 'app-gestion-cotizaciones',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, SelectModule, CardModule,
    ButtonModule, TagModule, ToastModule, ConfirmDialog, ConfirmDialogModule,
    RouterModule, AutoComplete, TooltipModule, DatePickerModule,
    LoadingOverlayComponent, PaginadorComponent,
    DialogModule,
    AccionesComprobanteDialogComponent,
  ],
  templateUrl: './gestion-listado.html',
  styleUrl: './gestion-listado.css',
  providers: [MessageService, ConfirmationService]
})
export class GestionCotizacionesComponent implements OnInit, OnDestroy {
  public iconoCabecera   = 'pi pi-wallet';
  public tituloKicker    = 'ADMINISTRACIÓN';
  public subtituloKicker = 'GESTIÓN DE COTIZACIONES';

  private sedeService               = inject(SedeService);
  private quoteService              = inject(QuoteService);
  private readonly sedeAlmacenService = inject(SedeAlmacenService);
  private confirmationService       = inject(ConfirmationService);
  private messageService            = inject(MessageService);

  buscarValue           = signal<string>('');
  cotizacionSugerencias = signal<QuoteListItem[]>([]);
  estadoSeleccionado    = signal<string | null>('PENDIENTE');
  sedeSeleccionada      = signal<number | null>(null);
  currentPage           = signal<number>(1);
  rows                  = signal<number>(5);
  fechaFin              = signal<Date | null>(null);
  fechaInicio           = signal<Date | null>(getHoyPeru());

  estadosOptions = [
    { label: 'Todos',     value: null        },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Aprobada',  value: 'APROBADA'  },
    { label: 'Rechazada', value: 'RECHAZADA' },
    { label: 'Vencida',   value: 'VENCIDA'   },
  ];

  sedesOptions = computed(() => this.sedeService.sedes().map(sede => ({
    label: sede.nombre,
    value: sede.id_sede,
  })));

  private getHoyPeru(): Date {
    const ahora       = new Date();
    const offsetPeru  = -5 * 60;
    const offsetLocal = ahora.getTimezoneOffset();
    const diferencia  = (offsetLocal - offsetPeru) * 60 * 1000;
    const horaPeruana = new Date(ahora.getTime() + diferencia);
    horaPeruana.setHours(0, 0, 0, 0);
    return horaPeruana;
  }

  cotizaciones = computed(() => this.quoteService.quotes());

  cotizacionesFiltradas = computed(() => {
    const inicio = this.fechaInicio();
    const fin    = this.fechaFin();
    if (!inicio && !fin) return this.cotizaciones();
    return this.cotizaciones().filter(c => {
      const fec = new Date(c.fec_emision);
      if (inicio && fec < inicio) return false;
      if (fin) {
        const finDia = new Date(fin); finDia.setHours(23, 59, 59, 999);
        if (fec > finDia) return false;
      }
      return true;
    });
  });

  totalPages      = computed(() => this.quoteService.totalPages());
  loading         = computed(() => this.quoteService.loading());
  totalAprobadas  = computed(() => this.quoteService.kpiAprobadas());
  totalPendientes = computed(() => this.quoteService.kpiPendientes());
  totalRecords = computed(() => this.quoteService.kpiTotal());
  // ── Dialog de acciones (shared) ──────────────────────────────────
  accionesVisible  = false;
  accionCargando: string | null = null;
  accionesConfig: AccionesComprobanteConfig | null = null;
  private cotizacionAcciones: QuoteListItem | null = null;

  // ── Dialog WhatsApp ───────────────────────────────────────────────
  mostrarDialogWsp                   = false;
  enviandoWsp                        = false;
  wspReady                           = false;
  wspQr: string | null               = null;
  cotizacionWsp: QuoteListItem | null = null;
  private pollingInterval: any       = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const sedeDefaultId = this.getSedeUsuarioActual();
    if (sedeDefaultId) this.sedeSeleccionada.set(sedeDefaultId);
    this.cargarCotizacion();
    this.sedeService.loadSedes().subscribe({
      error: (err) => console.error('Error cargando sedes', err),
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  private getSedeUsuarioActual(): number | null {
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        return user.idSede ?? null;
      }
    } catch (e) { console.error('Error parseando usuario', e); }
    return null;
  }

  cargarCotizacion() {
    this.quoteService.loadQuotes({
      estado:  this.estadoSeleccionado(),
      id_sede: this.sedeSeleccionada(),
      search:  this.buscarValue() || undefined,
      page:    this.currentPage(),
      limit:   this.rows(),
    }).subscribe();
  }

  onSedeChange(nuevaSedeId: number | null) {
    this.sedeSeleccionada.set(nuevaSedeId);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  onEstadoChange(estado: string | null) {
    this.estadoSeleccionado.set(estado);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  onFechaChange() { /* filtro local */ }

  limpiarFiltros() {
    this.buscarValue.set('');
    this.cotizacionSugerencias.set([]);
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.sedeSeleccionada.set(null);
    this.estadoSeleccionado.set(null);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.cargarCotizacion();
  }

  onLimitChange(limit: number) {
    this.rows.set(limit);
    this.currentPage.set(1);
    this.cargarCotizacion();
  }

  searchCotizacion(event: any) {
    const query = event.query?.toLowerCase() ?? '';
    if (!query || query.length < 2) { this.cotizacionSugerencias.set([]); return; }
    this.quoteService.loadQuotes({ search: query, limit: 6 }).subscribe({
      next: () => this.cotizacionSugerencias.set(this.quoteService.quotes()),
    });
  }

  seleccionarCotizacionBusqueda(event: any) {
    const c = event.value as QuoteListItem;
    this.buscarValue.set(c.codigo);
    this.irDetalle(c.id_cotizacion);
  }

  limpiarBusquedaCotizacion() {
    this.buscarValue.set('');
    this.cotizacionSugerencias.set([]);
    this.cargarCotizacion();
  }

  mapEstadoTag(estado: string | null | undefined): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | null | undefined {
    switch (estado) {
      case 'APROBADA':  return 'success';
      case 'PENDIENTE': return 'warn';
      case 'RECHAZADA': return 'danger';
      case 'VENCIDA':   return 'secondary';
      default:          return 'secondary';
    }
  }

  rechazarCotizacion(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de rechazar esta cotización? El estado cambiará a <strong>RECHAZADA</strong>.',
      header: 'Confirmar rechazo', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'RECHAZADA').subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Cotización rechazada', detail: 'El estado fue actualizado a RECHAZADA.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado.' }); },
        });
      },
    });
  }

  reactivarCotizacion(id: number) {
    this.confirmationService.confirm({
      message: '¿Deseas reactivar esta cotización? El estado volverá a <strong>PENDIENTE</strong>.',
      header: 'Confirmar reactivación', icon: 'pi pi-refresh',
      acceptLabel: 'Sí, reactivar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'PENDIENTE').subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Cotización reactivada', detail: 'El estado volvió a PENDIENTE.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar la cotización.' }); },
        });
      },
    });
  }

  eliminarCotizacion(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de <strong>eliminar permanentemente</strong> esta cotización? Esta acción no se puede deshacer.',
      header: 'Eliminar cotización', icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.deleteQuote(id).subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'La cotización fue eliminada permanentemente.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la cotización.' }); },
        });
      },
    });
  }

  // ── Acciones dialog ───────────────────────────────────────────────
  abrirAcciones(c: QuoteListItem): void {
    this.cotizacionAcciones = c;
    this.accionesConfig = {
      titulo:    c.codigo,
      subtitulo: c.cliente_nombre,
      labelPdf:     'PDF Cotización',
      labelVoucher: 'Voucher',
    };
    this.accionCargando  = null;
    this.accionesVisible = true;
  }

  onAccion(accion: AccionComprobante): void {
    const c = this.cotizacionAcciones!;

    switch (accion) {

      case 'wsp':
        this.accionesVisible = false;
        this.abrirDialogWsp(c);
        break;

      case 'email':
        this.accionCargando = 'email';
        this.quoteService.sendByEmail(c.id_cotizacion).subscribe({
          next: (res) => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'success', summary: 'Email enviado',
              detail: `Cotización ${c.codigo} enviada a ${res.sentTo}`, life: 4000,
            });
          },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'No se pudo enviar. Verifique que el cliente tenga email registrado.', life: 3000,
            });
          },
        });
        break;

      case 'pdf-imprimir':
        this.accionCargando = 'pdf-imprimir';
        this.quoteService.printPdf(c.id_cotizacion).subscribe({
          next: () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => { this.accionCargando = null; this.accionesVisible = false; },
        });
        break;

      case 'pdf-descargar':
        this.accionCargando = 'pdf-descargar';
        this.quoteService.downloadPdf(c.id_cotizacion).subscribe({
          next: () => { this.accionCargando = null; this.accionesVisible = false; },
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

      case 'voucher-imprimir':
        this.accionCargando = 'voucher-imprimir';
        this.quoteService.printThermalVoucher(c.id_cotizacion).subscribe({
          next: () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'No se pudo imprimir el voucher térmico.', life: 3000,
            });
          },
        });
        break;

      case 'voucher-descargar':
        this.accionCargando = 'voucher-descargar';
        this.quoteService.downloadThermalVoucher(c.id_cotizacion).subscribe({
          next: () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => {
            this.accionCargando  = null;
            this.accionesVisible = false;
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: 'No se pudo descargar el voucher térmico.', life: 3000,
            });
          },
        });
        break;
    }
  }

  imprimirCotizacion(c: QuoteListItem) {
    this.quoteService.exportPdf(c.id_cotizacion);
  }

  enviarCotizacion(c: QuoteListItem) {
    this.messageService.add({ severity: 'info', summary: 'Enviando...', detail: `Enviando cotización ${c.codigo} por email.` });
    this.quoteService.sendByEmail(c.id_cotizacion).subscribe({
      next:  (res) => this.messageService.add({ severity: 'success', summary: 'Email enviado', detail: `Cotización ${c.codigo} enviada a ${res.sentTo}` }),
      error: ()    => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar. Verifique que el cliente tenga email registrado.' }),
    });
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  abrirDialogWsp(c: QuoteListItem): void {
    this.cotizacionWsp    = c;
    this.mostrarDialogWsp = true;
    this.wspReady         = false;
    this.wspQr            = null;
    this.verificarEstadoWsp();
  }

  cerrarDialogWsp(): void {
    this.mostrarDialogWsp = false;
    this.cotizacionWsp    = null;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private verificarEstadoWsp(): void {
    this.quoteService.getWhatsAppStatus().subscribe({
      next: (res) => {
        this.wspReady = res.ready;
        this.wspQr    = res.qr ?? null;

        if (!res.ready) {
          // Polling cada 3s hasta que escaneen el QR
          this.pollingInterval = setInterval(() => {
            this.quoteService.getWhatsAppStatus().subscribe({
              next: (r) => {
                this.wspReady = r.ready;
                this.wspQr    = r.qr ?? null;
                if (r.ready) {
                  clearInterval(this.pollingInterval);
                  this.pollingInterval = null;
                }
              },
            });
          }, 3000);
        }
      },
      error: () => this.messageService.add({
        severity: 'error', summary: 'Error',
        detail: 'No se pudo conectar con el servicio de WhatsApp.', life: 4000,
      }),
    });
  }

  enviarPorWsp(): void {
    if (!this.cotizacionWsp) return;

    this.enviandoWsp = true;
    this.quoteService.sendByWhatsApp(this.cotizacionWsp.id_cotizacion).subscribe({
      next: (res) => {
        this.enviandoWsp = false;
        this.cerrarDialogWsp();
        this.messageService.add({
          severity: 'success', summary: '¡Enviado!',
          detail: `Cotización ${this.cotizacionWsp?.codigo} enviada a ${res.sentTo}`,
          life: 5000,
        });
      },
      error: (err) => {
        this.enviandoWsp = false;
        const detalle = err?.error?.message ?? 'No se pudo enviar por WhatsApp.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: detalle, life: 5000 });
      },
    });
  }

  // ── Helpers fechas ────────────────────────────────────────────────────────

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
    if (dias === 1) return '1d';
    return `${dias}d`;
  }

  getDiasBadgeClass(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)   return 'dias-badge--vencido';
    if (dias === 0) return 'dias-badge--hoy';
    if (dias <= 3)  return 'dias-badge--urgente';
    if (dias <= 7)  return 'dias-badge--proximo';
    return 'dias-badge--ok';
  }

  getDiasColor(fecVenc: string | Date | null): string {
    const dias = this.getDiasRestantes(fecVenc);
    if (dias < 0)  return '#f87171';
    if (dias <= 3) return '#fb923c';
    if (dias <= 7) return '#facc15';
    return 'var(--text-muted)';
  }

  irCrear()             { this.router.navigate(['/admin/agregar-cotizaciones']); }
  irEditar(id: number)  { this.router.navigate(['/admin/editar-cotizacion', id]); }
  irDetalle(id: number) { this.router.navigate(['/admin/ver-detalle-cotizacion', id]); }

  irAgregarVenta(id: number) {
    this.router.navigate(['/admin/generar-ventas-administracion'], { queryParams: { cotizacion: id, tipo: 'contado' } });
  }

  irAgregarVentaPorCobrar(id: number) {
    this.router.navigate(['/admin/generar-ventas-administracion'], { queryParams: { cotizacion: id, tipo: 'credito' } });
  }
}