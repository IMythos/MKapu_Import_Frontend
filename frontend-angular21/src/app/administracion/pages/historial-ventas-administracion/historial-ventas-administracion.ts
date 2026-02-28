import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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
import { MessageService, ConfirmationService } from 'primeng/api';

import { VentasAdminService } from '../../services/ventas.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ExcelUtils } from '../../utils/excel.utils';

import {
  SalesReceiptSummaryAdmin,
  SalesReceiptsQueryAdmin,
  SedeAdmin,
  SalesReceiptKpiDto,
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

  tituloKicker = 'VENTAS - HISTORIAL DE VENTAS';
  subtituloKicker = 'CONSULTA Y GESTIÓN DE VENTAS';
  iconoCabecera = 'pi pi-list';

  private subscriptions = new Subscription();

  comprobantes: SalesReceiptSummaryAdmin[] = [];
  comprobantesFiltrados: SalesReceiptSummaryAdmin[] = [];

  sedes: SedeAdmin[] = [];
  sedesOptions: { label: string; value: number | string }[] = [];

  filtros: FiltroVentasAdmin = {
    sedeSeleccionada: null,
    tipoComprobante: null,
    estado: null,
    fechaInicio: null,
    fechaFin: null,
    busqueda: '',
    tipoPago: null,
  };

  tiposComprobante = [
    { label: 'Boleta', value: 2 },
    { label: 'Factura', value: 1 },
  ];

  estadosComprobante = [
    { label: 'Emitido', value: 'EMITIDO' },
    { label: 'Anulado', value: 'ANULADO' },
    { label: 'Rechazado', value: 'RECHAZADO' },
  ];

  tiposPago = [
    { label: 'Efectivo', value: 1 },
    { label: 'Yape / Plin', value: 2 },
    { label: 'Tarjeta', value: 3 },
  ];

  sugerenciasBusqueda: string[] = [];
  todasLasSugerencias: string[] = [];

  loading = false;

  // Paginación
  paginaActual = 1;
  limitePorPagina = 10;
  totalRegistros = 0;
  totalPaginas = 0;
  firstRow = 0;
  private primeraLlamadaLazy = true;

  // KPIs
  totalVentas = 0;
  numeroVentas = 0;
  totalBoletas = 0;
  totalFacturas = 0;

  inicioSemana: Date = new Date();
  finSemana: Date = new Date();

  ngOnInit(): void {
    this.calcularRangoSemana();
    this.cargarEmpleadoActual();
    this.cargarSedes();
    this.cargarComprobantes();
    this.cargarKpis();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private cargarEmpleadoActual(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticación',
        detail: 'No hay un usuario autenticado. Redirigiendo...',
        life: 3000,
      });
      setTimeout(() => this.router.navigate(['/login']), 1000);
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Modo Administración',
      detail: 'Visualizando ventas de todas las sedes',
      life: 3000,
    });
  }

  calcularRangoSemana(): void {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const diasDesdeInicio = diaSemana === 0 ? 6 : diaSemana - 1;

    this.inicioSemana = new Date(hoy);
    this.inicioSemana.setDate(hoy.getDate() - diasDesdeInicio);
    this.inicioSemana.setHours(0, 0, 0, 0);

    this.finSemana = new Date(this.inicioSemana);
    this.finSemana.setDate(this.inicioSemana.getDate() + 6);
    this.finSemana.setHours(23, 59, 59, 999);
  }

  cargarSedes(): void {
    const sub = this.ventasService.obtenerSedes().subscribe({
      next: (data) => {
        this.sedes = data.filter((s) => s.activo);

        setTimeout(() => {
          this.sedesOptions = [
            { label: 'Todas las sedes', value: '' },
            ...this.sedes.map((s) => ({
              label: s.nombre,
              value: s.id_sede,
            })),
          ];
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las sedes',
          life: 3000,
        });
      },
    });
    this.subscriptions.add(sub);
  }

  cargarKpis(): void {
    const sub = this.ventasService
      .obtenerKpiSemanal(this.filtros.sedeSeleccionada ?? undefined)
      .subscribe({
        next: (kpi: SalesReceiptKpiDto) => {
          this.totalVentas = kpi.total_ventas;
          this.numeroVentas = kpi.cantidad_ventas;
          this.totalBoletas = kpi.total_boletas;
          this.totalFacturas = kpi.total_facturas;
          this.cdr.markForCheck();
        },
        error: () => console.warn('No se pudieron cargar KPIs'),
      });
    this.subscriptions.add(sub);
  }

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
      dateTo: this.filtros.fechaFin
        ? this.filtros.fechaFin.toISOString().split('T')[0]
        : undefined,
      search: this.filtros.busqueda.trim() || undefined,
      _t: Date.now(),
    };

    const sub = this.ventasService.listarHistorialVentas(query).subscribe({
      next: (res: any) => {
        console.log('📦 Respuesta historial:', res);
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

        if (this.comprobantes.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'Sin registros',
            detail: 'No hay ventas con los filtros aplicados',
            life: 3000,
          });
        }
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

  cargarSugerenciasBusqueda(): void {
    const set = new Set<string>();
    this.comprobantes.forEach((c) => {
      set.add(this.getNumeroFormateado(c));
      if (c.clienteNombre?.trim()) set.add(c.clienteNombre.trim());
      if (c.clienteDocumento?.trim()) set.add(c.clienteDocumento.trim());
    });
    this.todasLasSugerencias = Array.from(set).sort();
  }

  buscarSugerencias(event: any): void {
    const query = event.query.toLowerCase().trim();
    this.sugerenciasBusqueda = query
      ? this.todasLasSugerencias
          .filter((i) => i.toLowerCase().includes(query))
          .slice(0, 15)
      : this.todasLasSugerencias.slice(0, 10);
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
    this.firstRow = 0;
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
      detail: 'Se restablecieron todos los filtros',
      life: 2000,
    });
  }

  onPageChange(event: any): void {
    if (this.primeraLlamadaLazy) {
      this.primeraLlamadaLazy = false;
      return;
    }
    this.firstRow = event.first ?? 0;
    this.paginaActual =
      Math.floor((event.first ?? 0) / (event.rows ?? this.limitePorPagina)) + 1;
    this.limitePorPagina = event.rows ?? this.limitePorPagina;
    this.cargarComprobantes();
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
      Estado: this.getEstadoComprobante(c),
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

  // Helpers

  getEstadoComprobante(comprobante: SalesReceiptSummaryAdmin): string {
    return comprobante.estado;
  }

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
    // Si tu backend ya trae numeroCompleto, puedes usarlo directo:
    // return c.numeroCompleto;
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

  // Navegación

  nuevaVenta(): void {
    this.router.navigate(['/admin/generar-ventas-administracion']);
  }

  verDetalleVenta(comprobante: SalesReceiptSummaryAdmin): void {
    this.router.navigate(
      ['/admin/detalles-ventas-administracion', comprobante.idComprobante],
      {
        state: { rutaRetorno: '/admin/historial-ventas-administracion' },
      }
    );
  }

  imprimirComprobante(comprobante: SalesReceiptSummaryAdmin): void {
    this.router.navigate(['/admin/imprimir-comprobante-administracion'], {
      state: {
        comprobante,
        rutaRetorno: '/admin/historial-ventas-administracion',
      },
    });
  }

  anularComprobante(comprobante: SalesReceiptSummaryAdmin): void {
    if (comprobante.estado !== 'EMITIDO') return;

    this.confirmationService.confirm({
      message: `¿Está seguro de anular el comprobante ${this.getNumeroFormateado(
        comprobante
      )}?`,
      header: 'Confirmar Anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        // Cuando tengas endpoint real, reemplaza por llamada HTTP
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
}
