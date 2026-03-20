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
import { ProveedorService } from '../../../services/proveedor.service';
import { getDomingoSemanaActualPeru, getLunesSemanaActualPeru } from '../../../../shared/utils/date-peru.utils';
import { AccionesComprobanteDialogComponent, AccionesComprobanteConfig, AccionComprobante } from '../../../../shared/components/acciones-comprobante-dialog/acciones-comprobante';
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';

@Component({
  selector: 'app-gestion-compras',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TableModule, SelectModule, CardModule,
    ButtonModule, TagModule, ToastModule, ConfirmDialog, ConfirmDialogModule,
    RouterModule, AutoComplete, TooltipModule, DatePickerModule,
    DialogModule,
    AccionesComprobanteDialogComponent, SharedTableContainerComponent,
  ],
  templateUrl: './gestion-compras-listado.html',
  styleUrl: './gestion-compras-listado.css',
  providers: [MessageService, ConfirmationService]
})
export class GestionComprasComponent implements OnInit, OnDestroy {
  public iconoCabecera   = 'pi pi-truck';
  public tituloKicker    = 'ADMINISTRACIÓN';
  public subtituloKicker = 'GESTIÓN DE COTIZACIONES DE COMPRA';

  private readonly TIPO_FIJO: 'VENTA' | 'COMPRA' = 'COMPRA';

  private sedeService         = inject(SedeService);
  private quoteService        = inject(QuoteService);
  private proveedorService    = inject(ProveedorService);
  private confirmationService = inject(ConfirmationService);
  private messageService      = inject(MessageService);

  buscarValue           = signal<string>('');
  cotizacionSugerencias = signal<QuoteListItem[]>([]);
  estadoSeleccionado    = signal<string | null>('PENDIENTE');
  sedeSeleccionada      = signal<number | null>(null);
  currentPage           = signal<number>(1);
  rows                  = signal<number>(5);
  fechaFin              = signal<Date | null>(getDomingoSemanaActualPeru());
  fechaInicio           = signal<Date | null>(getLunesSemanaActualPeru());

  // Mapa id_proveedor → razon_social para resolución local
  proveedoresMap = signal<Map<number, string>>(new Map());

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

  // ── FIX error 2339: usa quotes() mientras el servicio nuevo no esté reemplazado ──
  // Una vez reemplaces quote.service.ts cambia a: this.quoteService.quotesCompra()
  cotizaciones = computed(() => this.quoteService.quotes());

  cotizacionesFiltradas = computed(() => {
    const inicio = this.fechaInicio();
    const fin    = this.fechaFin();
    const lista  = this.cotizaciones();

    if (!inicio && !fin) return lista;

    return lista.filter((c: QuoteListItem) => {
      const fechaStr  = c.fec_emision.substring(0, 10);
      const [y, m, d] = fechaStr.split('-').map(Number);
      const fecSolo   = new Date(y, m - 1, d);

      if (inicio) {
        const iniSolo = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
        if (fecSolo < iniSolo) return false;
      }
      if (fin) {
        const finSolo = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate());
        if (fecSolo > finSolo) return false;
      }
      return true;
    });
  });

  totalPages      = computed(() => this.quoteService.totalPages());
  loading         = computed(() => this.quoteService.loading());
  // ── FIX KPIs: usa los compatibles con el servicio actual ──
  // Una vez reemplaces quote.service.ts cambia a: kpiTotalCompra(), kpiAprobadasCompra(), kpiPendientesCompra()
  totalRecords    = computed(() => this.quoteService.kpiTotal());
  totalAprobadas  = computed(() => this.quoteService.kpiAprobadas());
  totalPendientes = computed(() => this.quoteService.kpiPendientes());

  // ── FIX error 2339: getNombreProveedor definido en el componente ──
  getNombreProveedor(c: QuoteListItem): string {
    // 1. El backend ya envía proveedor_nombre
    if (c.proveedor_nombre) return c.proveedor_nombre;
    // 2. Mapa local
    if (c.id_proveedor) {
      const nombre = this.proveedoresMap().get(c.id_proveedor);
      if (nombre) return nombre;
      return `Proveedor #${c.id_proveedor}`;
    }
    // 3. Fallback
    return c.cliente_nombre || '—';
  }

  // ── FIX error 7006 línea 113-114: tipo explícito en proveedoresUnicos ──
  proveedoresUnicos = computed(() => {
    const nombres = new Set(
      this.cotizacionesFiltradas()
        .map((c: QuoteListItem) => this.getNombreProveedor(c))
        .filter((n: string) => n !== '—')
    );
    return nombres.size;
  });

  accionesVisible  = false;
  accionCargando: string | null = null;
  accionesConfig: AccionesComprobanteConfig | null = null;
  private cotizacionAcciones: QuoteListItem | null = null;

  mostrarDialogWsp                    = false;
  enviandoWsp                         = false;
  wspReady                            = false;
  wspQr: string | null                = null;
  cotizacionWsp: QuoteListItem | null = null;
  private pollingInterval: any        = null;

  constructor(private router: Router) {}

  ngOnInit() {
    const sedeDefaultId = this.getSedeUsuarioActual();
    if (sedeDefaultId) this.sedeSeleccionada.set(sedeDefaultId);
    this.cargarCotizacion();
    this.sedeService.loadSedes().subscribe({
      error: (err) => console.error('Error cargando sedes', err),
    });

    // Carga el mapa de proveedores para resolución local de nombres
    this.proveedorService.listSuppliers().subscribe({
      next: (resp) => {
        const map = new Map<number, string>();
        resp.suppliers.forEach(p => map.set(p.id_proveedor, p.razon_social));
        this.proveedoresMap.set(map);
      },
      error: () => {}, // silencioso — es solo un fallback
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
      tipo:    this.TIPO_FIJO,
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

  onPageChange(page: number)   { this.currentPage.set(page); this.cargarCotizacion(); }
  onLimitChange(limit: number) { this.rows.set(limit); this.currentPage.set(1); this.cargarCotizacion(); }

  searchCotizacion(event: { query: string }) {
    const query = event.query?.toLowerCase() ?? '';
    if (!query || query.length < 2) { this.cotizacionSugerencias.set([]); return; }
    this.quoteService.loadQuotes({ search: query, tipo: this.TIPO_FIJO, limit: 6 }).subscribe({
      next: () => this.cotizacionSugerencias.set(this.quoteService.quotes()),
    });
  }

  seleccionarCotizacionBusqueda(event: { value: QuoteListItem }) {
    const c = event.value;
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
      message: '¿Estás seguro de rechazar esta cotización de compra?',
      header: 'Confirmar rechazo', icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'RECHAZADA').subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Rechazada', detail: 'Cotización rechazada.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado.' }); },
        });
      },
    });
  }

  reactivarCotizacion(id: number) {
    this.confirmationService.confirm({
      message: '¿Deseas reactivar esta cotización de compra a PENDIENTE?',
      header: 'Confirmar reactivación', icon: 'pi pi-refresh',
      acceptLabel: 'Sí, reactivar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.updateQuoteStatus(id, 'PENDIENTE').subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Reactivada', detail: 'El estado volvió a PENDIENTE.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo reactivar.' }); },
        });
      },
    });
  }

  eliminarCotizacion(id: number) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de <strong>eliminar permanentemente</strong> esta cotización?',
      header: 'Eliminar cotización', icon: 'pi pi-trash',
      acceptLabel: 'Sí, eliminar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.quoteService.deleteQuote(id).subscribe({
          next:  () => { this.messageService.add({ severity: 'success', summary: 'Eliminada', detail: 'La cotización fue eliminada.' }); this.cargarCotizacion(); },
          error: () => { this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar.' }); },
        });
      },
    });
  }

  aprobarCompra(id: number) {
    const impacto = '<br><br><span style="color:#4ade80">↑ Sumará stock a los productos</span>';
    this.confirmationService.confirm({
      message:  `¿Confirmas registrar esta compra como recibida?${impacto}`,
      header:   'Registrar Compra', icon: 'pi pi-truck',
      acceptLabel: 'Sí, registrar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.router.navigate(
          ['/admin/generar-ventas-administracion'],
          { queryParams: { cotizacion: id, tipo: 'contado', tipoCot: 'COMPRA' } }
        );
      },
    });
  }

  aprobarCompraCredito(id: number) {
    const impacto = '<br><br><span style="color:#4ade80">↑ Sumará stock a los productos</span>';
    this.confirmationService.confirm({
      message:  `¿Confirmas registrar esta compra a <strong>crédito</strong>?${impacto}`,
      header:   'Registrar Compra (Crédito)', icon: 'pi pi-truck',
      acceptLabel: 'Sí, registrar', rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
      accept: () => {
        this.router.navigate(
          ['/admin/generar-ventas-administracion'],
          { queryParams: { cotizacion: id, tipo: 'credito', tipoCot: 'COMPRA' } }
        );
      },
    });
  }

  abrirAcciones(c: QuoteListItem): void {
    this.cotizacionAcciones = c;
    this.accionesConfig = {
      titulo:       c.codigo,
      subtitulo:    this.getNombreProveedor(c),
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
          next:  (res) => { this.accionCargando = null; this.accionesVisible = false; this.messageService.add({ severity: 'success', summary: 'Email enviado', detail: `Enviado a ${res.sentTo}`, life: 4000 }); },
          error: ()    => { this.accionCargando = null; this.accionesVisible = false; this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar.', life: 3000 }); },
        });
        break;
      case 'pdf-imprimir':
        this.accionCargando = 'pdf-imprimir';
        this.quoteService.printPdf(c.id_cotizacion).subscribe({
          next:  () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => { this.accionCargando = null; this.accionesVisible = false; },
        });
        break;
      case 'pdf-descargar':
        this.accionCargando = 'pdf-descargar';
        this.quoteService.downloadPdf(c.id_cotizacion).subscribe({
          next:  () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => { this.accionCargando = null; this.accionesVisible = false; },
        });
        break;
      case 'voucher-imprimir':
        this.accionCargando = 'voucher-imprimir';
        this.quoteService.printThermalVoucher(c.id_cotizacion).subscribe({
          next:  () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => { this.accionCargando = null; this.accionesVisible = false; },
        });
        break;
      case 'voucher-descargar':
        this.accionCargando = 'voucher-descargar';
        this.quoteService.downloadThermalVoucher(c.id_cotizacion).subscribe({
          next:  () => { this.accionCargando = null; this.accionesVisible = false; },
          error: () => { this.accionCargando = null; this.accionesVisible = false; },
        });
        break;
    }
  }

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
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  private verificarEstadoWsp(): void {
    this.quoteService.getWhatsAppStatus().subscribe({
      next: (res) => {
        this.wspReady = res.ready;
        this.wspQr    = res.qr ?? null;
        if (!res.ready) {
          this.pollingInterval = setInterval(() => {
            this.quoteService.getWhatsAppStatus().subscribe({
              next: (r) => {
                this.wspReady = r.ready;
                this.wspQr    = r.qr ?? null;
                if (r.ready) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
              },
            });
          }, 3000);
        }
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo conectar con WhatsApp.', life: 4000 }),
    });
  }

  enviarPorWsp(): void {
    if (!this.cotizacionWsp) return;
    this.enviandoWsp = true;
    this.quoteService.sendByWhatsApp(this.cotizacionWsp.id_cotizacion).subscribe({
      next: (res) => {
        this.enviandoWsp = false;
        this.cerrarDialogWsp();
        this.messageService.add({ severity: 'success', summary: '¡Enviado!', detail: `Enviado a ${res.sentTo}`, life: 5000 });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enviandoWsp = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo enviar.', life: 5000 });
      },
    });
  }

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

  irCrear() {
    this.router.navigate(
      ['/admin/cotizaciones-compra/agregar-cotizaciones'],
      { queryParams: { tipo: 'COMPRA' } }
    );
  }

  irEditar(id: number)  { this.router.navigate(['/admin/cotizaciones-compra/editar-cotizacion', id]); }
  irDetalle(id: number) { this.router.navigate(['/admin/cotizaciones-compra/ver-detalle-cotizacion', id]); }
}