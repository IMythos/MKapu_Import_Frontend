import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
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

import { VentaService } from '../../services/venta.service';
import { AuthService } from '../../../auth/services/auth.service';
import { SedeService, Sede } from '../../../core/services/sede.service';
import { ComprobantesService } from '../../../core/services/comprobantes.service';
import { PosService } from '../../../core/services/pos.service';

import type { User } from '../../../core/interfaces/user.interface';
import type {
  SalesReceiptSummaryListResponse,
  SalesReceiptSummaryDto,
  SalesReceiptsQuery,
  SalesReceiptKpiDto,
  ReceiptStatus,
} from '../../interfaces';

interface ComprobanteVentaVM {
  id: number;
  id_sede: number;
  serie: string;
  numero: number;
  fec_emision: string;
  tipo_comprobante: string;
  tipo_pago: string;
  idCliente: string;
  idResponsableRef: number;
  cliente_nombre: string;
  cliente_doc: string;
  responsable: string;
  sede_nombre: string;
  total: number;
  estadoSunat: ReceiptStatus;
  estado: boolean;
}

interface FiltroVentas {
  tipoComprobante: string | null;
  estado: ReceiptStatus | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  busqueda: string;
  tipoPago: number | null;
}

const TIPO_MAP: Record<string, string> = {
  'FACTURA DE VENTA': '01',
  FACTURA: '01',
  'BOLETA DE VENTA': '03',
  BOLETA: '03',
  'NOTA DE CREDITO': '07',
  'NOTA DE DEBITO': '08',
};

const RECEIPT_TYPE_ID_MAP: Record<string, number> = {
  '01': 1,
  '03': 2,
  '07': 3,
  '08': 4,
};

@Component({
  selector: 'app-historial-ventas',
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
  templateUrl: './historial-ventas.html',
  styleUrls: ['./historial-ventas.css'],
})
export class HistorialVentas implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly ventaService = inject(VentaService);
  private readonly authService = inject(AuthService);
  private readonly sedeService = inject(SedeService);
  private readonly comprobantesService = inject(ComprobantesService);
  private readonly posService = inject(PosService);
  private readonly messageService = inject(MessageService);

  readonly tituloKicker = 'VENTAS - HISTORIAL DE VENTAS';
  readonly subtituloKicker = 'CONSULTA Y GESTIÓN DE VENTAS';
  readonly iconoCabecera = 'pi pi-list';

  comprobantes = signal<ComprobanteVentaVM[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  firstRow = signal(0);
  currentLimit = signal<10 | 20 | 50 | 100>(10);
  currentPage = computed(() => Math.floor(this.firstRow() / this.currentLimit()) + 1);
  // Opciones para el selector de filas por página
  rowsPerPageOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ];

  sedes = signal<Sede[]>([]);
  tiposComprobante = signal<any[]>([]);
  estadosComprobante = signal<any[]>([]);
  tiposPago = signal<any[]>([]);

  sugerenciasBusqueda = signal<string[]>([]);

  private sugerenciasPool = computed<string[]>(() => {
    const set = new Set<string>();
    for (const c of this.comprobantes()) {
      set.add(this.getNumeroFormateado(c));
      if (c.cliente_nombre?.trim()) set.add(c.cliente_nombre.trim());
      if (c.cliente_doc?.trim()) set.add(c.cliente_doc.trim());
    }
    return [...set].sort();
  });

  private currentUser = signal<User | null>(null);
  private sedeRefEmpleado = signal<number | null>(null);

  kpiSede = signal<SalesReceiptKpiDto | null>(null);
  kpiTotalVentas = computed(() => this.kpiSede()?.total_ventas ?? 0);
  kpiNumeroVentas = computed(() => this.kpiSede()?.cantidad_ventas ?? 0);
  kpiTotalBoletas = computed(() => this.kpiSede()?.total_boletas ?? 0);
  kpiTotalFacturas = computed(() => this.kpiSede()?.total_facturas ?? 0);
  kpiSemanaDesde = computed(() => this.kpiSede()?.semana_desde ?? '');
  kpiSemanaHasta = computed(() => this.kpiSede()?.semana_hasta ?? '');

  filtros = signal<FiltroVentas>({
    tipoComprobante: null,
    estado: null,
    fechaInicio: null,
    fechaFin: null,
    busqueda: '',
    tipoPago: null,
  });

  hayFiltrosActivos = computed(() => {
    const f = this.filtros();
    return !!(
      f.tipoComprobante ||
      f.estado ||
      f.fechaInicio ||
      f.fechaFin ||
      f.busqueda?.trim() ||
      f.tipoPago
    );
  });

  private subs = new Subscription();

  ngOnInit(): void {
    this.cargarOpcionesFiltros();
    this.cargarUsuarioYSede();
    this.cargarSedes();
    this.cargarKpiSede();
    setTimeout(() => this.cargarHistorial(), 0);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ========== MÉTODOS PARA EL PAGINADOR PERSONALIZADO ==========

  getFirstRecord(): number {
    return this.totalRecords() === 0 ? 0 : this.firstRow() + 1;
  }

  getLastRecord(): number {
    const last = this.firstRow() + this.currentLimit();
    return last > this.totalRecords() ? this.totalRecords() : last;
  }

  isFirstPage(): boolean {
    return this.currentPage() === 1;
  }

  isLastPage(): boolean {
    return this.currentPage() >= this.getTotalPages();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalRecords() / this.currentLimit());
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1);
    }
    if (current + delta < totalPages - 1) {
      range.push(-1);
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range.filter((v, i, a) => a.indexOf(v) === i && v !== -1);
  }
  irCrearRemision(correlativo: string) {
    if(!correlativo) return;
    this.router.navigate(['/logistica/remision/nueva'], {
      queryParams: { correlativo } 
    });
  }
  goToFirstPage(): void {
    if (!this.isFirstPage()) {
      this.firstRow.set(0);
      this.cargarHistorial();
    }
  }

  goToPrevPage(): void {
    if (!this.isFirstPage()) {
      this.firstRow.update((f) => f - this.currentLimit());
      this.cargarHistorial();
    }
  }

  goToNextPage(): void {
    if (!this.isLastPage()) {
      this.firstRow.update((f) => f + this.currentLimit());
      this.cargarHistorial();
    }
  }

  goToLastPage(): void {
    if (!this.isLastPage()) {
      const lastPageFirst = (this.getTotalPages() - 1) * this.currentLimit();
      this.firstRow.set(lastPageFirst);
      this.cargarHistorial();
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage() && page > 0 && page <= this.getTotalPages()) {
      const newFirst = (page - 1) * this.currentLimit();
      this.firstRow.set(newFirst);
      this.cargarHistorial();
    }
  }

  onRowsPerPageChange(newLimit: number): void {
    this.currentLimit.set(newLimit as 10 | 20 | 50 | 100);
    this.firstRow.set(0);
    this.cargarHistorial();
  }

  // ========== FIN MÉTODOS PAGINADOR ==========

  private cargarUsuarioYSede(): void {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    this.sedeRefEmpleado.set(user?.idSede ?? null);

    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticación',
        detail: 'No hay usuario autenticado.',
        life: 3000,
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Sede actual',
      detail: `Mostrando ventas de: ${user.sedeNombre ?? 'Sede'}`,
      life: 2000,
    });
  }

  cargarHistorial(): void {
    this.loading.set(true);

    const f = this.filtros();
    const dateTo = f.fechaFin ? new Date(f.fechaFin) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    const pagina = this.currentPage();

    const query: SalesReceiptsQuery = {
      page: pagina,
      limit: this.currentLimit(),
      status: f.estado ?? undefined,
      search: f.busqueda?.trim() || undefined,
      dateFrom: f.fechaInicio ? this.toDateStr(f.fechaInicio) : undefined,
      dateTo: dateTo ? this.toDateStr(dateTo) : undefined,
      receiptTypeId: f.tipoComprobante ? RECEIPT_TYPE_ID_MAP[f.tipoComprobante] : undefined,
      paymentMethodId: f.tipoPago ?? undefined,
      sedeId: this.sedeRefEmpleado() ?? undefined,
    };

    const sub = this.ventaService.listarHistorialVentas(query).subscribe({
      next: (res: SalesReceiptSummaryListResponse) => {
        this.comprobantes.set(res.receipts.map((r) => this.toVM(r)));
        this.totalRecords.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial de ventas.',
          life: 3000,
        });
      },
    });

    this.subs.add(sub);
  }

  cargarKpiSede(): void {
    const sub = this.ventaService.getKpiSemanal().subscribe({
      next: (kpi) => this.kpiSede.set(kpi),
      error: () => {},
    });
    this.subs.add(sub);
  }

cargarOpcionesFiltros(): void {
  this.tiposComprobante.set(this.comprobantesService.getTiposComprobanteOptions());
  this.estadosComprobante.set(this.comprobantesService.getEstadosComprobanteOptions());
  
  // PRUEBA MANUAL: Asegúrate de que los IDs coincidan con tu BD (1: Efectivo, 2: Tarjeta, etc.)
  this.tiposPago.set([
    { label: 'Efectivo', value: 1 },
    { label: 'DEPÓSITO EN CUENTA', value: 2 },
    { label: 'TRANSFERENCIA DE FONDOS', value: 3 }
  ]);
}


  cargarSedes(): void {
    const sub = this.sedeService.getSedes().subscribe({
      next: (s) => this.sedes.set(s),
      error: () => {},
    });
    this.subs.add(sub);
  }

  onPageChange(event: any): void {
    const newFirst = event.first ?? 0;
    const newLimit = (event.rows ?? 10) as 10 | 20 | 50 | 100;

    if (newFirst === this.firstRow() && newLimit === this.currentLimit()) return;

    this.firstRow.set(newFirst);
    this.currentLimit.set(newLimit);
    this.cargarHistorial();
  }

  aplicarFiltros(): void {
    this.firstRow.set(0);
    this.cargarHistorial();
  }

  limpiarFiltros(): void {
    this.filtros.set({
      tipoComprobante: null,
      estado: null,
      fechaInicio: null,
      fechaFin: null,
      busqueda: '',
      tipoPago: null,
    });
    this.firstRow.set(0);
    this.cargarHistorial();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se restablecieron todos los filtros.',
      life: 2000,
    });
  }

  actualizarFiltroBusqueda(valor: string): void {
    this.filtros.update((f) => ({ ...f, busqueda: valor }));
  }

  actualizarFiltroFechaInicio(valor: Date | null): void {
    this.filtros.update((f) => ({ ...f, fechaInicio: valor }));
  }

  actualizarFiltroFechaFin(valor: Date | null): void {
    this.filtros.update((f) => ({ ...f, fechaFin: valor }));
  }

  actualizarFiltroTipoComprobante(valor: string | null): void {
    this.filtros.update((f) => ({ ...f, tipoComprobante: valor }));
  }

  actualizarFiltroTipoPago(valor: number | null): void {
    this.filtros.update((f) => ({ ...f, tipoPago: valor }));
  }

  actualizarFiltroEstado(valor: ReceiptStatus | null): void {
    this.filtros.update((f) => ({ ...f, estado: valor }));
  }

  buscarSugerencias(event: any): void {
    const q = (event.query ?? '').toLowerCase().trim();
    const pool = this.sugerenciasPool();
    this.sugerenciasBusqueda.set(
      q ? pool.filter((s) => s.toLowerCase().includes(q)).slice(0, 15) : pool.slice(0, 10),
    );
  }

  nuevaVenta(): void {
    this.router.navigate(['/ventas/generar-venta']);
  }

  verDetalleVenta(c: ComprobanteVentaVM): void {
    this.router.navigate(['/ventas/ver-detalle', c.id]);
  }

  imprimirComprobante(c: ComprobanteVentaVM): void {
    this.router.navigate(['/ventas/imprimir-comprobante'], {
      state: { comprobante: c, rutaRetorno: '/ventas/historial-ventas' },
    });
  }

  getNumeroFormateado(c: ComprobanteVentaVM): string {
    return this.comprobantesService.getNumeroFormateado(c.serie, c.numero);
  }

  getTipoComprobanteLabel(tipo: string): string {
    return this.comprobantesService.getTipoComprobanteLabel(tipo as '01' | '03');
  }

  getTipoPagoLabel(tipoPago: string): string {
    return tipoPago === 'N/A' ? 'N/A' : this.posService.getTipoPagoLabel(tipoPago);
  }

  getSeverityEstado(estado: string): 'success' | 'danger' | 'warn' | 'info' {
    const map: Record<string, 'success' | 'danger' | 'warn' | 'info'> = {
      EMITIDO: 'success',
      ANULADO: 'warn',
      RECHAZADO: 'danger',
    };
    return map[estado] ?? 'info';
  }

  getSeverityTipoPago(tipoPago: string): 'success' | 'info' | 'warn' | 'secondary' {
    return tipoPago === 'N/A' ? 'secondary' : this.posService.getSeverityTipoPago(tipoPago);
  }

  private toVM(r: SalesReceiptSummaryDto): ComprobanteVentaVM {
    return {
      id: r.idComprobante,
      id_sede: r.idSede,
      serie: r.serie,
      numero: r.numero,
      fec_emision: r.fecEmision,
      tipo_comprobante: TIPO_MAP[r.tipoComprobante?.toUpperCase()] ?? '03',
      tipo_pago: r.metodoPago || 'N/A',
      idCliente: r.clienteNombre || '',
      idResponsableRef: Number(r.idResponsable),
      cliente_nombre: r.clienteNombre || '—',
      cliente_doc: r.clienteDocumento || '—',
      responsable: r.responsableNombre || '—',
      sede_nombre: r.sedeNombre || '—',
      total: r.total,
      estadoSunat: r.estado,
      estado: r.estado === 'EMITIDO',
    };
  }

  private toDateStr(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
}
