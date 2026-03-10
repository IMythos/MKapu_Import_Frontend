import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Toast } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DatePicker } from 'primeng/datepicker';
import { Tooltip } from 'primeng/tooltip';
import { AutoComplete } from 'primeng/autocomplete';
import { Dialog } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../shared/components/paginador/Paginador.component';
import { VentasAdminService } from '../../services/ventas.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ExcelUtils } from '../../utils/excel.utils';
import {
  getLunesSemanaActualPeru,
  getDomingoSemanaActualPeru,
} from '../../../shared/utils/date-peru.utils';

import {
  SalesReceiptSummaryAdmin,
  SalesReceiptsQueryAdmin,
  SedeAdmin,
  SalesReceiptKpiDto,
  MetodoPagoAdmin,
  TipoComprobanteAdmin,
} from '../../interfaces/ventas.interface';

interface FiltroVentasAdmin {
  sedeSeleccionada: number | null;
  tipoComprobante: number | null;
  estado: string | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  busqueda: string;
  tipoPago: number | null;
}

@Component({
  selector: 'app-historial-ventas-administracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    Select,
    TableModule,
    Tag,
    Toast,
    ConfirmDialog,
    DatePicker,
    Tooltip,
    AutoComplete,
    Dialog,
    LoadingOverlayComponent,
    PaginadorComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './historial-ventas-administracion.html',
  styleUrl: './historial-ventas-administracion.css',
})
export class HistorialVentasAdministracion implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly ventasService = inject(VentasAdminService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly tituloKicker = 'VENTAS - HISTORIAL DE VENTAS';
  readonly subtituloKicker = 'CONSULTA Y GESTIÓN DE VENTAS';
  readonly iconoCabecera = 'pi pi-list';

  private subscriptions = new Subscription();
  private busquedaSubject = new Subject<string>();

  comprobantes: SalesReceiptSummaryAdmin[] = [];
  comprobantesFiltrados: SalesReceiptSummaryAdmin[] = [];

  sedes: SedeAdmin[] = [];
  sedesOptions: { label: string; value: number | null }[] = [];
  tiposComprobante: { label: string; value: number | null }[] = [{ label: 'Todos', value: null }];
  metodosPago: { label: string; value: number | null }[] = [{ label: 'Todos', value: null }];

  wspConsultando = false;
  accionesDialogVisible = false;
  accionesComprobante: SalesReceiptSummaryAdmin | null = null;
  verPdfCargando = false;

  pdfCargando = signal<number | null>(null);
  emailCargando = signal<number | null>(null);
  wspCargando = signal<number | null>(null);
  accionesCargando = signal<number | null>(null);

  // ── Dialog WhatsApp ───────────────────────────────────────────────
  wspDialogVisible = false;
  wspReady = false;
  wspQr: string | null = null;
  wspPollingInterval: any = null;
  wspComprobanteActual: SalesReceiptSummaryAdmin | null = null;

  readonly estadosComprobante = [
    { label: 'Todos', value: null },
    { label: 'Emitido', value: 'EMITIDO' },
    { label: 'Anulado', value: 'ANULADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
  ];

  filtros: FiltroVentasAdmin = {
    sedeSeleccionada: null,
    tipoComprobante: null,
    estado: 'EMITIDO',
    fechaInicio: getLunesSemanaActualPeru(),
    fechaFin: getDomingoSemanaActualPeru(),
    busqueda: '',
    tipoPago: null,
  };

  sugerenciasBusqueda: string[] = [];
  todasLasSugerencias: string[] = [];

  loading = false;
  paginaActual = 1;
  limitePorPagina = 5;
  totalRegistros = 0;
  totalPaginas = 0;
  totalVentas = 0;
  numeroVentas = 0;
  totalBoletas = 0;
  totalFacturas = 0;

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user?.idSede) this.filtros.sedeSeleccionada = user.idSede;

    this.cargarSedes();
    this.cargarTiposComprobante();
    this.cargarMetodosPago();
    this.cargarComprobantes();
    this.cargarKpis();

    const subBusqueda = this.busquedaSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < 3) return [];
          return this.ventasService.listarHistorialVentas({
            page: 1,
            limit: 10,
            search: query,
            sedeId: this.filtros.sedeSeleccionada ?? undefined,
          });
        }),
      )
      .subscribe({
        next: (res: any) => {
          const data: SalesReceiptSummaryAdmin[] = res?.receipts ?? res?.data ?? res?.items ?? [];
          const set = new Set<string>();
          data.forEach((c) => {
            const nombre = c.clienteNombre?.trim();
            const doc = c.clienteDocumento?.trim();
            if (nombre && doc) set.add(`${nombre} - ${doc}`);
            else if (nombre) set.add(nombre);
            else if (doc) set.add(doc);
          });
          this.sugerenciasBusqueda = Array.from(set).slice(0, 15);
          this.cdr.markForCheck();
        },
        error: () => (this.sugerenciasBusqueda = []),
      });
    this.subscriptions.add(subBusqueda);

    this.messageService.add({
      severity: 'success',
      summary: 'Modo Administración',
      detail: 'Visualizando ventas de todas las sedes',
      life: 3000,
    });
  }

  ngOnDestroy(): void {
    this.busquedaSubject.complete();
    this.subscriptions.unsubscribe();
    this.detenerPollingWsp();
  }

  // ── Paginador ─────────────────────────────────────────────────────
  onPageChange(page: number): void {
    this.paginaActual = page;
    this.cargarComprobantes();
  }

  onLimitChange(nuevoLimite: number): void {
    this.limitePorPagina = nuevoLimite;
    this.paginaActual = 1;
    this.cargarComprobantes();
  }

  // ── Filtros ───────────────────────────────────────────────────────
  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.cargarComprobantes();
    this.cargarKpis();
  }

  limpiarFiltros(): void {
    this.filtros = {
      sedeSeleccionada: null,
      tipoComprobante: null,
      estado: null,
      fechaInicio: null,
      fechaFin: null,
      busqueda: '',
      tipoPago: null,
    };
    this.aplicarFiltros();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se restablecieron los filtros al rango semanal actual',
      life: 2000,
    });
  }

  onSeleccionarSugerencia(event: any): void {
    const valor: string = event.value ?? '';
    const partes = valor.split(' - ');
    this.filtros.busqueda = partes[0].trim();
    this.aplicarFiltros();
  }

  onBusquedaKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.aplicarFiltros();
  }

  buscarSugerencias(event: any): void {
    const query = (event.query ?? '').trim();
    if (query.length < 3) {
      this.sugerenciasBusqueda = this.todasLasSugerencias.slice(0, 10);
      return;
    }
    this.busquedaSubject.next(query);
  }

  // ── Carga de datos ────────────────────────────────────────────────
  cargarComprobantes(): void {
    this.loading = true;

    const query: SalesReceiptsQueryAdmin = {
      page: this.paginaActual,
      limit: this.limitePorPagina,
      sedeId: this.filtros.sedeSeleccionada ?? undefined,
      receiptTypeId: this.filtros.tipoComprobante ?? undefined,
      status: (this.filtros.estado as any) ?? undefined,
      paymentMethodId: this.filtros.tipoPago ?? undefined,
      dateFrom: this.filtros.fechaInicio
        ? this.filtros.fechaInicio.toISOString().split('T')[0]
        : undefined,
      dateTo: this.filtros.fechaFin ? this.filtros.fechaFin.toISOString().split('T')[0] : undefined,
      search: this.filtros.busqueda.trim() || undefined,
      _t: Date.now(),
    };

    const sub = this.ventasService.listarHistorialVentas(query).subscribe({
      next: (res: any) => {
        const data = res?.receipts ?? res?.data ?? res?.items ?? [];
        this.comprobantes = Array.isArray(data) ? data : [];
        this.comprobantesFiltrados = [...this.comprobantes];
        this.cargarSugerenciasBusqueda();
        this.loading = false;
        setTimeout(() => {
          this.totalRegistros = res?.total ?? this.comprobantes.length;
          this.totalPaginas = res?.total_pages ?? 1;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.loading = false;
        this.comprobantes = [];
        this.comprobantesFiltrados = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial de ventas',
          life: 3000,
        });
      },
    });
    this.subscriptions.add(sub);
  }

  cargarKpis(): void {
    const sub = this.ventasService
      .getKpiSemanal(this.filtros.sedeSeleccionada ?? undefined)
      .subscribe({
        next: (kpi: SalesReceiptKpiDto) => {
          this.totalVentas = kpi.total_ventas ?? 0;
          this.numeroVentas = kpi.cantidad_ventas ?? 0;
          this.totalBoletas = kpi.cantidad_boletas ?? 0;
          this.totalFacturas = kpi.cantidad_facturas ?? 0;
          this.cdr.markForCheck();
        },
        error: () => console.warn('No se pudieron cargar KPIs'),
      });
    this.subscriptions.add(sub);
  }

  private cargarSedes(): void {
    const sub = this.ventasService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes = data.filter((s) => s.activo);
        this.sedesOptions = [
          { label: 'Todas las sedes', value: null },
          ...this.sedes.map((s) => ({ label: s.nombre, value: s.id_sede })),
        ];
        this.cdr.markForCheck();
      },
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sedes',
          life: 3000,
        }),
    });
    this.subscriptions.add(sub);
  }

  private cargarTiposComprobante(): void {
    const sub = this.ventasService.obtenerTiposComprobante().subscribe({
      next: (tipos: TipoComprobanteAdmin[]) => {
        this.tiposComprobante = [
          { label: 'Todos', value: null },
          ...tipos.map((t) => ({ label: t.descripcion, value: t.id })),
        ];
        this.cdr.markForCheck();
      },
      error: () => console.warn('No se pudieron cargar los tipos de comprobante'),
    });
    this.subscriptions.add(sub);
  }

  private cargarMetodosPago(): void {
    const sub = this.ventasService.obtenerMetodosPago().subscribe({
      next: (metodos: MetodoPagoAdmin[]) => {
        this.metodosPago = [
          { label: 'Todos', value: null },
          ...metodos.map((m) => ({ label: m.descripcion, value: m.id })),
        ];
        this.cdr.markForCheck();
      },
      error: () => console.warn('No se pudieron cargar los métodos de pago'),
    });
    this.subscriptions.add(sub);
  }

  private cargarSugerenciasBusqueda(): void {
    const set = new Set<string>();
    this.comprobantes.forEach((c) => {
      const nombre = c.clienteNombre?.trim();
      const doc = c.clienteDocumento?.trim();
      if (nombre && doc) set.add(`${nombre} - ${doc}`);
      else if (nombre) set.add(nombre);
      else if (doc) set.add(doc);
    });
    this.todasLasSugerencias = Array.from(set).sort();
  }

  // ── Dialog acciones ───────────────────────────────────────────────
  abrirDialogAcciones(comprobante: SalesReceiptSummaryAdmin): void {
    this.accionesComprobante = comprobante;
    this.accionesDialogVisible = true;
  }

  cerrarDialogAcciones(): void {
    this.accionesDialogVisible = false;
    this.accionesComprobante = null;
  }

  verPdfEnPestana(comprobante: SalesReceiptSummaryAdmin): void {
    this.verPdfCargando = true;
    this.ventasService.verComprobantePdfEnPestana(comprobante.idComprobante).subscribe({
      next: () => {
        this.verPdfCargando = false;
      },
      error: () => {
        this.verPdfCargando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo abrir el PDF',
          life: 3000,
        });
      },
    });
  }

  enviarCotizacionDesdeDialog(comprobante: SalesReceiptSummaryAdmin): void {
    this.emailCargando.set(comprobante.idComprobante);

    this.ventasService.enviarComprobantePorEmail(comprobante.idComprobante).subscribe({
      next: (res) => {
        this.emailCargando.set(null);
        this.cerrarDialogAcciones();
        this.messageService.add({
          severity: 'success',
          summary: 'Email enviado',
          detail: res.message ?? `Comprobante enviado a ${res.sentTo}`,
          life: 4000,
        });
      },
      error: () => {
        this.emailCargando.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar el comprobante por email',
          life: 3000,
        });
      },
    });
  }

  abrirDialogWspDesdeAcciones(comprobante: SalesReceiptSummaryAdmin): void {
    this.abrirDialogWsp(comprobante);
  }

  // ── Acciones ──────────────────────────────────────────────────────
  nuevaVenta(): void {
    this.router.navigate(['/admin/generar-ventas-administracion']);
  }

  GenerarVenta(): void {
    this.router.navigate(['./admin/generar-ventas-administracion']);
  }

  verDetalleVenta(comprobante: SalesReceiptSummaryAdmin): void {
    this.router.navigate(['/admin/detalles-ventas-administracion', comprobante.idComprobante], {
      state: { rutaRetorno: '/admin/historial-ventas-administracion' },
    });
  }

  imprimirComprobante(comprobante: SalesReceiptSummaryAdmin): void {
    this.pdfCargando.set(comprobante.idComprobante);

    const nombre = `comprobante-${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}.pdf`;

    this.ventasService.descargarComprobantePdf(comprobante.idComprobante, nombre).subscribe({
      next: () => {
        this.pdfCargando.set(null);
        this.cerrarDialogAcciones();
      },
      error: () => {
        this.pdfCargando.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el PDF del comprobante',
        });
      },
    });
  }

  enviarCotizacion(comprobante: SalesReceiptSummaryAdmin): void {
    this.emailCargando.set(comprobante.idComprobante);

    this.ventasService.enviarComprobantePorEmail(comprobante.idComprobante).subscribe({
      next: (res) => {
        this.emailCargando.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Email enviado',
          detail: res.message ?? `Comprobante enviado a ${res.sentTo}`,
          life: 4000,
        });
      },
      error: () => {
        this.emailCargando.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar el comprobante por email',
          life: 3000,
        });
      },
    });
  }

  confirmarEnvioWsp(): void {
    if (!this.wspComprobanteActual) return;

    const comprobante = this.wspComprobanteActual;
    this.wspCargando.set(comprobante.idComprobante);
    this.wspDialogVisible = false;
    this.accionesDialogVisible = false;
    this.detenerPollingWsp();

    this.ventasService.enviarComprobantePorWhatsApp(comprobante.idComprobante).subscribe({
      next: (res) => {
        this.wspCargando.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'WhatsApp enviado',
          detail: res.message ?? `Comprobante enviado a ${res.sentTo}`,
          life: 4000,
        });
      },
      error: () => {
        this.wspCargando.set(null);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar el comprobante por WhatsApp',
          life: 3000,
        });
      },
    });
  }

  private iniciarPollingWsp(): void {
    this.detenerPollingWsp();
    this.wspPollingInterval = setInterval(() => {
      this.ventasService.obtenerEstadoWhatsApp().subscribe({
        next: ({ ready, qr }) => {
          this.wspReady = ready;
          this.wspQr = qr;
          this.cdr.markForCheck();
          if (ready) this.detenerPollingWsp();
        },
      });
    }, 2000);
  }

  private detenerPollingWsp(): void {
    if (this.wspPollingInterval) {
      clearInterval(this.wspPollingInterval);
      this.wspPollingInterval = null;
    }
  }

  abrirDialogWsp(comprobante: SalesReceiptSummaryAdmin): void {
    this.wspComprobanteActual = comprobante;
    this.wspDialogVisible = true;
    this.wspReady = false;
    this.wspQr = null;
    this.wspConsultando = true; // ← nuevo flag

    this.ventasService.obtenerEstadoWhatsApp().subscribe({
      next: ({ ready, qr }) => {
        this.wspConsultando = false;
        this.wspReady = ready;
        this.wspQr = qr;
        this.cdr.markForCheck();
        if (!ready) this.iniciarPollingWsp();
      },
      error: () => {
        this.wspConsultando = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo consultar el estado de WhatsApp',
          life: 3000,
        });
      },
    });
  }

  cerrarDialogWsp(): void {
    this.wspDialogVisible = false;
    this.wspComprobanteActual = null;
    this.detenerPollingWsp();
  }

  // ── Otras acciones ────────────────────────────────────────────────
  crearGuiaRemision(comprobante: any): void {
    this.router.navigate(['/logistica/remision/nueva'], {
      queryParams: {
        ventaId: comprobante.id,
        comprobanteRef: this.getNumeroFormateado(comprobante),
      },
    });
  }

  anularComprobante(comprobante: SalesReceiptSummaryAdmin): void {
    if (comprobante.estado !== 'EMITIDO') return;
    this.confirmationService.confirm({
      message: `¿Está seguro de anular el comprobante ${this.getNumeroFormateado(comprobante)}?`,
      header: 'Confirmar Anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        comprobante.estado = 'ANULADO';
        this.messageService.add({
          severity: 'success',
          summary: 'Comprobante anulado',
          detail: `${this.getNumeroFormateado(comprobante)} fue anulado`,
          life: 3000,
        });
        this.aplicarFiltros();
      },
    });
  }

  exportarExcel(): void {
    if (this.comprobantesFiltrados.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay registros para exportar',
        life: 3000,
      });
      return;
    }

    const datosExcel = this.comprobantesFiltrados.map((c) => ({
      'N° Comprobante': this.getNumeroFormateado(c),
      Tipo: this.getTipoComprobanteLabel(c.tipoComprobante),
      'Fecha Emisión': new Date(c.fecEmision).toLocaleString('es-PE'),
      Cliente: c.clienteNombre,
      Documento: c.clienteDocumento,
      'Tipo Pago': this.getTipoPagoLabel(c.metodoPago),
      Sede: c.sedeNombre,
      Total: c.total,
      Estado: c.estado,
    }));

    const nombreArchivo = ExcelUtils.generarNombreConFecha('ventas');
    ExcelUtils.exportarAExcel(datosExcel, nombreArchivo, 'Comprobantes');
    this.messageService.add({
      severity: 'success',
      summary: 'Exportación exitosa',
      detail: `Archivo ${nombreArchivo}.xlsx descargado`,
      life: 3000,
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getSeverityEstado(estado: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (estado) {
      case 'EMITIDO':
        return 'success';
      case 'ANULADO':
        return 'danger';
      case 'RECHAZADO':
        return 'warn';
      default:
        return 'info';
    }
  }

  getTipoComprobanteLabel(tipo: string): string {
    if (!tipo) return 'N/A';
    const t = tipo.toUpperCase();
    if (t.includes('BOLETA') || tipo === '03') return 'Boleta';
    if (t.includes('FACTURA') || tipo === '01') return 'Factura';
    return tipo;
  }

  getNumeroFormateado(c: SalesReceiptSummaryAdmin): string {
    return `${c.serie}-${String(c.numero).padStart(8, '0')}`;
  }

  getTipoPagoLabel(metodo: string): string {
    return metodo ?? 'N/A';
  }

  getSeverityTipoPago(metodo: string): 'success' | 'info' | 'warn' | 'secondary' {
    if (!metodo) return 'secondary';
    const m = metodo.toLowerCase();
    if (m.includes('efectivo')) return 'success';
    if (m.includes('yape') || m.includes('plin')) return 'info';
    if (m.includes('tarjeta')) return 'warn';
    return 'secondary';
  }
}
