/* ============================================
   frontend-angular21/src/app/ventas/pages/historial-ventas/historial-ventas.ts
   ============================================ */

import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
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

import { VentasApiService } from '../../services/ventas-api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { SedeService, Sede } from '../../../core/services/sede.service';
import { ComprobantesService } from '../../../core/services/comprobantes.service';
import { PosService } from '../../../core/services/pos.service';

import type { User } from '../../../core/interfaces/user.interface';
import type {
  SalesReceiptSummaryListResponse,
  SalesReceiptSummaryDto,
  SalesReceiptsQuery,
  ReceiptStatus,
} from '../../interfaces';

// ─── VIEW MODEL ───────────────────────────────────────────────────────────────

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
  tipoPago: string | null;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

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
  // ─── INYECCIONES ──────────────────────────────────────────────────────────

  private readonly router = inject(Router);
  private readonly ventasApi = inject(VentasApiService);
  private readonly authService = inject(AuthService);
  private readonly sedeService = inject(SedeService);
  private readonly comprobantesService = inject(ComprobantesService);
  private readonly posService = inject(PosService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ─── CONSTANTES ───────────────────────────────────────────────────────────

  readonly tituloKicker = 'VENTAS - HISTORIAL DE VENTAS';
  readonly subtituloKicker = 'CONSULTA Y GESTIÓN DE VENTAS';
  readonly iconoCabecera = 'pi pi-list';

  // ✅ usado por el HTML en el selector de página
  readonly opcionesLimit = [
    { label: '10 por página', value: 10 },
    { label: '20 por página', value: 20 },
    { label: '50 por página', value: 50 },
    { label: '100 por página', value: 100 },
  ];

  // ─── SIGNALS ──────────────────────────────────────────────────────────────

  comprobantes = signal<ComprobanteVentaVM[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  sedes = signal<Sede[]>([]);
  tiposComprobante = signal<any[]>([]);
  estadosComprobante = signal<any[]>([]);
  tiposPago = signal<any[]>([]);

  sugerenciasBusqueda = signal<string[]>([]);
  private todasSugeren = signal<string[]>([]);

  inicioSemana = signal(new Date());
  finSemana = signal(new Date());

  private currentUser = signal<User | null>(null);
  private sedeRefEmpleado = signal<number | null>(null);

  // ✅ paginación — usados por el HTML
  currentPage = signal(1);
  currentLimit = signal<10 | 20 | 50 | 100>(10);

  filtros = signal<FiltroVentas>({
    tipoComprobante: null,
    estado: null,
    fechaInicio: null,
    fechaFin: null,
    busqueda: '',
    tipoPago: null,
  });

  // ─── COMPUTED ─────────────────────────────────────────────────────────────

  comprobantesFiltrados = computed(() => this.comprobantes());

  ventasSemana = computed(() => {
    const inicio = this.inicioSemana();
    const fin = this.finSemana();
    return this.comprobantes().filter((c) => {
      const f = new Date(c.fec_emision);
      return f >= inicio && f <= fin;
    });
  });

  totalVentas = computed(() => this.ventasSemana().reduce((s, c) => s + (c.total || 0), 0));
  numeroVentas = computed(() => this.ventasSemana().length);
  totalBoletas = computed(
    () => this.ventasSemana().filter((c) => c.tipo_comprobante === '03').length,
  );
  totalFacturas = computed(
    () => this.ventasSemana().filter((c) => c.tipo_comprobante === '01').length,
  );

  // ✅ usado por el HTML en filtros y empty state
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

  // ─── SUBS ─────────────────────────────────────────────────────────────────

  private subscriptions = new Subscription();

  // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      this.actualizarSugerenciasBusqueda(this.comprobantes());
    });
  }

  // ─── LIFECYCLE ────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.calcularRangoSemana();
    this.cargarOpcionesFiltros();
    this.cargarUsuarioYSede();
    this.cargarSedes();
    setTimeout(() => this.cargarHistorial(), 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ─── CARGA PRINCIPAL ──────────────────────────────────────────────────────

  private cargarUsuarioYSede(): void {
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);
    this.sedeRefEmpleado.set(user?.idSede ?? null);

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
      severity: 'info',
      summary: 'Sede actual',
      detail: `Mostrando ventas de: ${user.sedeNombre ?? 'Sede'}`,
      life: 2000,
    });
  }

  // ✅ nombre público — usado por el HTML en (ngModelChange) del selector
  cargarHistorial(): void {
    this.loading.set(true);

    const f = this.filtros();
    const dateTo = f.fechaFin ? new Date(f.fechaFin) : null;
    if (dateTo) dateTo.setHours(23, 59, 59, 999);

    const query: SalesReceiptsQuery = {
      page: this.currentPage(),
      limit: this.currentLimit(),
      status: f.estado ?? undefined,
      search: f.busqueda?.trim() || undefined,
      dateFrom: f.fechaInicio ? new Date(f.fechaInicio).toISOString() : undefined,
      dateTo: dateTo ? dateTo.toISOString() : undefined,
      receiptTypeId: this.mapTipoToReceiptTypeId(f.tipoComprobante),
    };

    const sub = this.ventasApi.listarHistorialVentas(query).subscribe({
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
          detail: 'No se pudo cargar el historial de ventas',
          life: 3000,
        });
      },
    });

    this.subscriptions.add(sub);
  }

  cargarOpcionesFiltros(): void {
    this.tiposComprobante.set(this.comprobantesService.getTiposComprobanteOptions());
    this.estadosComprobante.set(this.comprobantesService.getEstadosComprobanteOptions());
    this.tiposPago.set(this.posService.getTiposPagoOptions());
  }

  cargarSedes(): void {
    const sub = this.sedeService.getSedes().subscribe({
      next: (s) => this.sedes.set(s),
      error: () => {},
    });
    this.subscriptions.add(sub);
  }

  // ─── PAGINACIÓN ───────────────────────────────────────────────────────────

  onPageChange(event: any): void {
    console.log('PageChange event:', event); // ← verifica qué llega
    const newPage = Math.floor(event.first / event.rows) + 1;
    const newLimit = event.rows as 10 | 20 | 50 | 100;

    this.currentPage.set(newPage);
    this.currentLimit.set(newLimit);
    this.cargarHistorial();
  }

  // ─── FILTROS ──────────────────────────────────────────────────────────────

  aplicarFiltros(): void {
    this.currentPage.set(1);
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
    this.currentPage.set(1);
    this.cargarHistorial();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se restablecieron todos los filtros',
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

  actualizarFiltroTipoPago(valor: string | null): void {
    this.filtros.update((f) => ({ ...f, tipoPago: valor }));
  }

  actualizarFiltroEstado(valor: ReceiptStatus | null): void {
    this.filtros.update((f) => ({ ...f, estado: valor }));
  }

  // ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────

  buscarSugerencias(event: any): void {
    const q = (event.query ?? '').toLowerCase().trim();
    const todas = this.todasSugeren();
    const result = q
      ? todas.filter((s) => s.toLowerCase().includes(q)).slice(0, 15)
      : todas.slice(0, 10);
    this.sugerenciasBusqueda.set(result);
  }

  private actualizarSugerenciasBusqueda(comprobantes: ComprobanteVentaVM[]): void {
    const set = new Set<string>();
    comprobantes.forEach((c) => {
      set.add(this.getNumeroFormateado(c));
      if (c.cliente_nombre?.trim()) set.add(c.cliente_nombre.trim());
      if (c.cliente_doc?.trim()) set.add(c.cliente_doc.trim());
    });
    this.todasSugeren.set([...set].sort());
  }

  // ─── NAVEGACIÓN ───────────────────────────────────────────────────────────

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

  verHistorialCliente(c: ComprobanteVentaVM): void {
    this.router.navigate(['/ventas/historial-cliente', c.cliente_doc]);
  }

  // ─── ANULAR (solo UI por ahora) ───────────────────────────────────────────

  anularComprobante(c: ComprobanteVentaVM): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de anular el comprobante ${this.getNumeroFormateado(c)}?`,
      header: 'Confirmar Anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const lista = this.comprobantes();
        const idx = lista.findIndex((x) => x.id === c.id);
        if (idx !== -1) {
          lista[idx] = { ...lista[idx], estadoSunat: 'ANULADO', estado: false };
          this.comprobantes.set([...lista]);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Comprobante anulado',
          detail: `${this.getNumeroFormateado(c)} fue anulado`,
          life: 3000,
        });
      },
    });
  }

  // ─── HELPERS UI ───────────────────────────────────────────────────────────

  getNumeroFormateado(c: ComprobanteVentaVM): string {
    return this.comprobantesService.getNumeroFormateado(c.serie, c.numero);
  }

  getTipoComprobanteLabel(tipo: string): string {
    return this.comprobantesService.getTipoComprobanteLabel(tipo as '01' | '03');
  }

  getTipoPagoLabel(tipoPago: string): string {
    if (tipoPago === 'N/A') return 'N/A';
    return this.posService.getTipoPagoLabel(tipoPago);
  }

  getEstadoComprobante(c: ComprobanteVentaVM): string {
    return c.estadoSunat;
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
    if (tipoPago === 'N/A') return 'secondary';
    return this.posService.getSeverityTipoPago(tipoPago);
  }

  // ─── SEMANA ───────────────────────────────────────────────────────────────

  calcularRangoSemana(): void {
    const hoy = new Date();
    const diasDesdeInicio = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diasDesdeInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    this.inicioSemana.set(inicio);
    this.finSemana.set(fin);
  }

  // ─── MAPPER ───────────────────────────────────────────────────────────────

  private toVM(r: SalesReceiptSummaryDto): ComprobanteVentaVM {
    const tipoMap: Record<string, string> = {
      'FACTURA DE VENTA': '01',
      FACTURA: '01',
      'BOLETA DE VENTA': '03',
      BOLETA: '03',
      'NOTA DE CREDITO': '07',
      'NOTA DE DEBITO': '08',
    };

    return {
      id: r.idComprobante,
      id_sede: r.idSede,
      serie: r.serie,
      numero: r.numero,
      fec_emision: r.fecEmision,
      tipo_comprobante: tipoMap[r.tipoComprobante?.toUpperCase()] ?? '03',
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

  private mapTipoToReceiptTypeId(tipo: string | null): number | undefined {
    const map: Record<string, number> = { '01': 1, '03': 2, '07': 3, '08': 4 };
    return tipo ? map[tipo] : undefined;
  }
}
