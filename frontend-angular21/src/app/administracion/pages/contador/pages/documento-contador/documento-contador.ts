import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
import { AuthService } from '../../../../../auth/services/auth.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../../shared/components/paginador/paginador.components';
import { getDomingoSemanaActualPeru, getLunesSemanaActualPeru } from '../../../../../shared/utils/date-peru.utils';

// ─── Tipos locales ────────────────────────────────────────────────────────────r

type TipoComprobante = 'Boleta' | 'Factura' | 'Nota de Crédito';
type EstadoComprobante = 'EMITIDO' | 'ANULADO' | 'PENDIENTE' | 'RECHAZADO';
type Moneda = 'PEN' | 'USD';

interface Comprobante {
  idComprobante: number;
  serie: string;
  numero: number;
  tipoComprobante: TipoComprobante;
  fechaEmision: Date;
  fechaVencimiento: Date;
  clienteNombre: string;
  clienteDocumento: string;
  moneda: Moneda;
  baseImponible: number;
  igv: number;
  total: number;
  estado: EstadoComprobante;
  responsable: string;
  observacion?: string;
}

interface FiltrosComprobante {
  busqueda: string;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  tipoComprobante: TipoComprobante | null;
  moneda: Moneda | null;
  estado: EstadoComprobante | null;
  periodo: string | null;
}

// ─── Datos aleatorios ─────────────────────────────────────────────────────────

const CLIENTES: { nombre: string; doc: string }[] = [
  { nombre: 'IMPORTACIONES SANTA ROSA S.A.C.', doc: '20512345678' },
  { nombre: 'DISTRIBUIDORA EL SOL E.I.R.L.', doc: '20498765432' },
  { nombre: 'FERRETERÍA LOS ANDES S.R.L.', doc: '20387654321' },
  { nombre: 'Juan Carlos Mendoza Torres', doc: '43256789' },
  { nombre: 'María Elena Quispe Huanca', doc: '47891234' },
  { nombre: 'CONSTRUCTORA PERUANA S.A.', doc: '20123456789' },
  { nombre: 'FARMACIA VIDA SANA E.I.R.L.', doc: '20654321987' },
  { nombre: 'Carlos Alberto Ramos Díaz', doc: '46123456' },
  { nombre: 'TEXTILES NORTE S.A.C.', doc: '20789012345' },
  { nombre: 'INVERSIONES PACÍFICO S.R.L.', doc: '20345678901' },
  { nombre: 'Ana Sofía Villanueva Prado', doc: '48765432' },
  { nombre: 'SERVICIOS GENERALES LIMA S.A.C.', doc: '20901234567' },
];

const RESPONSABLES = [
  'Luis García Rivera',
  'Carmen López Vega',
  'Roberto Silva Castillo',
  'Patricia Morales Ruiz',
  'Miguel Ángel Torres',
];

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fechaAleatoria(desdeDias: number, hastaDias: number): Date {
  const hoy = new Date();
  const offset = Math.floor(Math.random() * (hastaDias - desdeDias + 1)) + desdeDias;
  return new Date(hoy.getTime() + offset * 24 * 60 * 60 * 1000);
}

function generarComprobantes(): Comprobante[] {
  const tipos: TipoComprobante[] = ['Boleta', 'Boleta', 'Factura', 'Factura', 'Nota de Crédito'];
  const estados: EstadoComprobante[] = ['EMITIDO', 'EMITIDO', 'EMITIDO', 'ANULADO', 'PENDIENTE', 'RECHAZADO'];
  const monedas: Moneda[] = ['PEN', 'PEN', 'PEN', 'USD'];

  const series: Record<TipoComprobante, string> = {
    'Boleta': 'B001',
    'Factura': 'F001',
    'Nota de Crédito': 'NC01',
  };

  const comprobantes: Comprobante[] = [];

  for (let i = 1; i <= 45; i++) {
    const tipo = aleatorio(tipos);
    const moneda = aleatorio(monedas);
    const baseImponible = parseFloat((Math.random() * 4800 + 200).toFixed(2));
    const igv = parseFloat((baseImponible * 0.18).toFixed(2));
    const total = parseFloat((baseImponible + igv).toFixed(2));
    const cliente = aleatorio(CLIENTES);
    const emision = fechaAleatoria(-90, -1);
    const vencimiento = new Date(emision.getTime() + (Math.floor(Math.random() * 45) + 15) * 24 * 60 * 60 * 1000);

    comprobantes.push({
      idComprobante: i,
      serie: series[tipo],
      numero: 1000 + i,
      tipoComprobante: tipo,
      fechaEmision: emision,
      fechaVencimiento: vencimiento,
      clienteNombre: cliente.nombre,
      clienteDocumento: cliente.doc,
      moneda,
      baseImponible,
      igv,
      total,
      estado: aleatorio(estados),
      responsable: aleatorio(RESPONSABLES),
      observacion: Math.random() > 0.7 ? 'Pago a 30 días según acuerdo comercial.' : undefined,
    });
  }

  return comprobantes;
}

// ─── Componente ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-historial-comprobantes',
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
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './documento-contador.html',
  styleUrl: './documento-contador.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentoContador implements OnInit {
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  // ── Datos ────────────────────────────────────────────────────────
  private todosLosComprobantes: Comprobante[] = [];
  comprobantesFiltrados: Comprobante[]        = [];
  sugerenciasBusqueda: string[]               = [];
  loading = false;

  // ── KPIs ─────────────────────────────────────────────────────────
  totalFacturado    = 0;
  cantidadBoletas   = 0;
  cantidadFacturas  = 0;
  cantidadNotasCredito = 0;

  // ── Paginación ───────────────────────────────────────────────────
  //comentario
  paginaActual    = 1;
  limitePorPagina = 5;
  totalRegistros  = 0;
  totalPaginas    = 1;

  readonly opcionesLimite = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
  ];

  // ── Dialog ───────────────────────────────────────────────────────
  detalleVisible          = false;
  comprobanteSeleccionado: Comprobante | null = null;

  // ── Filtros ──────────────────────────────────────────────────────
  filtros: FiltrosComprobante = {
    busqueda:        '',
    fechaInicio:     getLunesSemanaActualPeru(),
    fechaFin:        getDomingoSemanaActualPeru(),
    tipoComprobante: null,
    moneda:          null,
    estado:          null,
    periodo:         null,
  };

  readonly tiposComprobante = [
    { label: 'Todos',           value: null },
    { label: 'Boleta',          value: 'Boleta' },
    { label: 'Factura',         value: 'Factura' },
    { label: 'Nota de Crédito', value: 'Nota de Crédito' },
  ];

  readonly monedas = [
    { label: 'Todas', value: null },
    { label: 'Soles (PEN)',  value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  readonly estadosComprobante = [
    { label: 'Todos',     value: null },
    { label: 'Emitido',   value: 'EMITIDO' },
    { label: 'Anulado',   value: 'ANULADO' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Rechazado', value: 'RECHAZADO' },
  ];

  readonly periodos = [
    { label: 'Seleccionar',     value: null },
    { label: 'Esta semana',     value: 'semana' },
    { label: 'Este mes',        value: 'mes' },
    { label: 'Último trimestre', value: 'trimestre' },
    { label: 'Este año',        value: 'anio' },
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────

  ngOnInit(): void {
    this.todosLosComprobantes = generarComprobantes();
    this.aplicarFiltros();
    this.calcularKpis();
  }

  // ─── KPIs ─────────────────────────────────────────────────────────

  private calcularKpis(): void {
    const emitidos = this.todosLosComprobantes.filter(c => c.estado === 'EMITIDO');

    this.totalFacturado     = emitidos.reduce((acc, c) => acc + c.total, 0);
    this.cantidadBoletas    = this.todosLosComprobantes.filter(c => c.tipoComprobante === 'Boleta').length;
    this.cantidadFacturas   = this.todosLosComprobantes.filter(c => c.tipoComprobante === 'Factura').length;
    this.cantidadNotasCredito = this.todosLosComprobantes.filter(c => c.tipoComprobante === 'Nota de Crédito').length;
  }

  // ─── Filtros ──────────────────────────────────────────────────────

  aplicarFiltros(): void {
    let resultado = [...this.todosLosComprobantes];

    if (this.filtros.tipoComprobante) {
      resultado = resultado.filter(c => c.tipoComprobante === this.filtros.tipoComprobante);
    }

    if (this.filtros.moneda) {
      resultado = resultado.filter(c => c.moneda === this.filtros.moneda);
    }

    if (this.filtros.estado) {
      resultado = resultado.filter(c => c.estado === this.filtros.estado);
    }

    if (this.filtros.busqueda?.trim()) {
      const q = this.filtros.busqueda.trim().toLowerCase();
      resultado = resultado.filter(c =>
        c.clienteNombre.toLowerCase().includes(q) ||
        c.clienteDocumento.includes(q)
      );
    }

    if (this.filtros.fechaInicio) {
      resultado = resultado.filter(c => c.fechaEmision >= this.filtros.fechaInicio!);
    }

    if (this.filtros.fechaFin) {
      const fin = new Date(this.filtros.fechaFin);
      fin.setHours(23, 59, 59, 999);
      resultado = resultado.filter(c => c.fechaEmision <= fin);
    }

    // Ordenar por fecha desc
    resultado.sort((a, b) => b.fechaEmision.getTime() - a.fechaEmision.getTime());

    this.totalRegistros = resultado.length;
    this.totalPaginas   = Math.ceil(this.totalRegistros / this.limitePorPagina) || 1;

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = 1;
    }

    const desde = (this.paginaActual - 1) * this.limitePorPagina;
    this.comprobantesFiltrados = resultado.slice(desde, desde + this.limitePorPagina);

    // Sugerencias búsqueda
    const set = new Set<string>();
    resultado.forEach(c => {
      set.add(`${c.clienteNombre} - ${c.clienteDocumento}`);
    });
    this.sugerenciasBusqueda = Array.from(set).slice(0, 15);

    this.cdr.markForCheck();
  }

  limpiarFiltros(): void {
    this.filtros = {
      busqueda:        '',
      fechaInicio:     null,
      fechaFin:        null,
      tipoComprobante: null,
      moneda:          null,
      estado:          null,
      periodo:         null,
    };
    this.paginaActual = 1;
    this.aplicarFiltros();
    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se restablecieron los filtros',
      life: 2000,
    });
  }

  onPeriodoChange(): void {
    const hoy = new Date();
    switch (this.filtros.periodo) {
      case 'semana': {
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
        this.filtros.fechaInicio = lunes;
        this.filtros.fechaFin    = new Date();
        break;
      }
      case 'mes':
        this.filtros.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.filtros.fechaFin    = new Date();
        break;
      case 'trimestre': {
        const inicioTrimestre = new Date(hoy);
        inicioTrimestre.setMonth(hoy.getMonth() - 3);
        this.filtros.fechaInicio = inicioTrimestre;
        this.filtros.fechaFin    = new Date();
        break;
      }
      case 'anio':
        this.filtros.fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        this.filtros.fechaFin    = new Date();
        break;
      default:
        this.filtros.fechaInicio = null;
        this.filtros.fechaFin    = null;
    }
    this.aplicarFiltros();
  }

  buscarSugerencias(event: any): void {
    const q = (event.query ?? '').toLowerCase();
    const set = new Set<string>();
    this.todosLosComprobantes.forEach(c => {
      const label = `${c.clienteNombre} - ${c.clienteDocumento}`;
      if (label.toLowerCase().includes(q)) set.add(label);
    });
    this.sugerenciasBusqueda = Array.from(set).slice(0, 15);
  }

  // ─── Paginación ───────────────────────────────────────────────────

  getPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin    = Math.min(this.totalPaginas, inicio + 4);
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    return paginas;
  }

  irAPagina(p: number): void {
    this.paginaActual = p;
    this.aplicarFiltros();
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.irAPagina(this.paginaActual - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.irAPagina(this.paginaActual + 1);
  }

  onLimitChange(event: any): void {
    this.limitePorPagina = event.value;
    this.paginaActual    = 1;
    this.aplicarFiltros();
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // ─── Acciones ─────────────────────────────────────────────────────

  nuevoComprobante(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Nuevo Comprobante',
      detail: 'Redirigiendo al formulario de creación...',
      life: 2500,
    });
  }

  verDetalle(comprobante: Comprobante): void {
    this.comprobanteSeleccionado = comprobante;
    this.detalleVisible          = true;
    this.cdr.markForCheck();
  }

  descargarPdf(comprobante: Comprobante | null): void {
    if (!comprobante) return;
    this.messageService.add({
      severity: 'success',
      summary: 'PDF generado',
      detail: `Descargando ${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}.pdf`,
      life: 3000,
    });
  }

  generarNotaCredito(comprobante: Comprobante): void {
    if (comprobante.estado !== 'EMITIDO') return;
    this.messageService.add({
      severity: 'info',
      summary: 'Nota de Crédito',
      detail: `Generando nota de crédito para ${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}`,
      life: 3000,
    });
  }

  anularComprobante(comprobante: Comprobante): void {
    if (comprobante.estado !== 'EMITIDO') return;
    this.confirmationService.confirm({
      message: `¿Está seguro de anular el comprobante ${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')}?`,
      header: 'Confirmar Anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, anular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const idx = this.todosLosComprobantes.findIndex(c => c.idComprobante === comprobante.idComprobante);
        if (idx !== -1) {
          this.todosLosComprobantes[idx].estado = 'ANULADO';
        }
        this.aplicarFiltros();
        this.messageService.add({
          severity: 'success',
          summary: 'Comprobante anulado',
          detail: `${comprobante.serie}-${String(comprobante.numero).padStart(8, '0')} fue anulado correctamente`,
          life: 3000,
        });
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
    this.messageService.add({
      severity: 'success',
      summary: 'Exportación exitosa',
      detail: `comprobantes_${new Date().toLocaleDateString('es-PE')}.xlsx descargado`,
      life: 3000,
    });
  }

  exportarPdf(): void {
    if (this.comprobantesFiltrados.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay registros para exportar',
        life: 3000,
      });
      return;
    }
    this.messageService.add({
      severity: 'success',
      summary: 'PDF generado',
      detail: `reporte_comprobantes_${new Date().toLocaleDateString('es-PE')}.pdf descargado`,
      life: 3000,
    });
  }

  // ─── Helpers de severity ──────────────────────────────────────────

  getSeverityTipo(tipo: TipoComprobante): 'info' | 'warn' | 'secondary' {
    switch (tipo) {
      case 'Boleta':          return 'info';
      case 'Factura':         return 'warn';
      case 'Nota de Crédito': return 'secondary';
    }
  }

  getSeverityEstado(estado: EstadoComprobante): 'success' | 'danger' | 'warn' | 'info' {
    switch (estado) {
      case 'EMITIDO':   return 'success';
      case 'ANULADO':   return 'danger';
      case 'RECHAZADO': return 'warn';
      default:          return 'info';
    }
  }

  getClaseVencimiento(fecha: Date): string {
    const hoy   = new Date();
    const diff  = (fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0)   return 'vencimiento-vencido';
    if (diff <= 7)  return 'vencimiento-proximo';
    return 'vencimiento-ok';
  }
}