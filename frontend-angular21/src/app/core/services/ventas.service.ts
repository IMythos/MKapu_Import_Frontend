import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
export interface DetalleComprobante {
  id_det_com: number;
  id_comprobante: string;
  id_producto: string;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  valor_unit: number;
  pre_uni: number;
  igv: number;
  tipo_afe_igv: string;
}

export interface ComprobanteVenta {
  id: number;
  id_comprobante: string;
  id_cliente: string;
  tipo_comprobante: '01' | '03';
  serie: string;
  numero: number;
  fec_emision: Date;
  fec_venc: Date | null;
  moneda: 'PEN' | 'USD';
  tipo_pago: string;
  tipo_op: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  estado: boolean;
  hash_cpe: string;
  xml_cpe: string;
  cdr_cpe: string;
  responsable: string;
  id_sede: string;
  id_empleado?: string;
  detalles: DetalleComprobante[];
  cliente_nombre?: string;
  cliente_doc?: string;
  codigo_promocion?: string;
  descuento_promocion?: number;
  descripcion_promocion?: string;
  id_promocion?: string;
}

export interface VentaWizard {
  tipoComprobante: '01' | '03';
  cliente: any | null;
  productos: DetalleComprobante[];
  promociones?: any[];
  tipoVenta: 'ENVIO' | 'RECOJO' | 'DELIVERY' | 'PRESENCIAL';
  departamento?: string;
  tipoPago: 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
  montoPago?: number;
  banco?: string;
  numeroOperacion?: string;
}

export interface FiltrosVenta {
  fechaDesde?: Date;
  fechaHasta?: Date;
  tipoComprobante?: '01' | '03';
  estado?: boolean;
  cliente?: string;
  responsable?: string;
  empleado?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VentasService {
  private comprobantesSubject = new BehaviorSubject<ComprobanteVenta[]>([]);
  public comprobantes$: Observable<ComprobanteVenta[]> = this.comprobantesSubject.asObservable();

  private comprobanteActualSubject = new BehaviorSubject<Partial<ComprobanteVenta> | null>(null);
  public comprobanteActual$: Observable<Partial<ComprobanteVenta> | null> =
    this.comprobanteActualSubject.asObservable();

  private ventaWizardSubject = new BehaviorSubject<Partial<VentaWizard> | null>(null);
  public ventaWizard$: Observable<Partial<VentaWizard> | null> =
    this.ventaWizardSubject.asObservable();
  private readonly http = inject(HttpClient);
  private urlLogistica = `${environment.apiUrl}/logistics/remission`;
  constructor() {
  }


  getComprobantes(): ComprobanteVenta[] {
    return this.comprobantesSubject.value;
  }

  getComprobantePorIdNumerico(id: number): ComprobanteVenta | undefined {
    return this.comprobantesSubject.value.find((c) => c.id === id);
  }

  getComprobantePorId(id: string): ComprobanteVenta | undefined {
    return this.comprobantesSubject.value.find((c) => c.id_comprobante === id);
  }

  crearComprobante(
    comprobante: Omit<
      ComprobanteVenta,
      'id' | 'id_comprobante' | 'hash_cpe' | 'xml_cpe' | 'cdr_cpe' | 'numero'
    >,
  ): ComprobanteVenta {
    const comprobantes = this.comprobantesSubject.value;
    const ultimoNumero = this.getUltimoNumero(comprobante.serie);
    const nuevoNumero = ultimoNumero + 1;
    const nuevoId = comprobantes.length > 0 ? Math.max(...comprobantes.map((c) => c.id)) + 1 : 1;
    const idComprobante = `CPE-${new Date().getFullYear()}-${String(nuevoId).padStart(4, '0')}`;

    const nuevoComprobante: ComprobanteVenta = {
      ...comprobante,
      id: nuevoId,
      id_comprobante: idComprobante,
      numero: nuevoNumero,
      hash_cpe: this.generarHash(idComprobante, comprobante.serie, nuevoNumero),
      xml_cpe: '<?xml version="1.0"?>',
      cdr_cpe: 'CDR-ACEPTADO',
    };

    this.comprobantesSubject.next([...comprobantes, nuevoComprobante]);
    return nuevoComprobante;
  }

  actualizarComprobante(id: string, cambios: Partial<ComprobanteVenta>): boolean {
    const comprobantes = [...this.comprobantesSubject.value];
    const index = comprobantes.findIndex((c) => c.id_comprobante === id);

    if (index !== -1) {
      comprobantes[index] = { ...comprobantes[index], ...cambios };
      this.comprobantesSubject.next(comprobantes);
      return true;
    }
    return false;
  }

  anularComprobante(id: string): boolean {
    const comprobante = this.getComprobantePorId(id);
    if (comprobante && comprobante.estado) {
      this.actualizarComprobante(id, { estado: false, cdr_cpe: 'CDR-ANULADO' });
      return true;
    }
    return false;
  }

  getComprobantesPorTipo(tipo: '01' | '03'): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.tipo_comprobante === tipo);
  }

  getComprobantesPorFecha(fechaDesde: Date, fechaHasta: Date): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter(
      (c) => c.fec_emision >= fechaDesde && c.fec_emision <= fechaHasta,
    );
  }

  getComprobantesPorEstado(estado: boolean): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.estado === estado);
  }

  getComprobantesPorCliente(idCliente: string): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.id_cliente === idCliente);
  }

  getComprobantesPorResponsable(responsable: string): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.responsable === responsable);
  }

  getComprobantesPorEmpleado(idEmpleado: string): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.id_empleado === idEmpleado);
  }

  getComprobantesPorSede(idSede: string): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => c.id_sede === idSede);
  }

  buscarPorSerieNumero(serie: string, numero: number): ComprobanteVenta | undefined {
    return this.comprobantesSubject.value.find((c) => c.serie === serie && c.numero === numero);
  }

  filtrarComprobantes(filtros: FiltrosVenta): ComprobanteVenta[] {
    let comprobantes = this.comprobantesSubject.value;

    if (filtros.fechaDesde && filtros.fechaHasta) {
      comprobantes = comprobantes.filter(
        (c) => c.fec_emision >= filtros.fechaDesde! && c.fec_emision <= filtros.fechaHasta!,
      );
    }

    if (filtros.tipoComprobante) {
      comprobantes = comprobantes.filter((c) => c.tipo_comprobante === filtros.tipoComprobante);
    }

    if (filtros.estado !== undefined) {
      comprobantes = comprobantes.filter((c) => c.estado === filtros.estado);
    }

    if (filtros.cliente) {
      comprobantes = comprobantes.filter((c) => c.id_cliente === filtros.cliente);
    }

    if (filtros.responsable) {
      comprobantes = comprobantes.filter((c) => c.responsable === filtros.responsable);
    }

    if (filtros.empleado) {
      comprobantes = comprobantes.filter((c) => c.id_empleado === filtros.empleado);
    }

    return comprobantes;
  }

  getTotalVentas(filtros?: FiltrosVenta): number {
    const comprobantes = filtros
      ? this.filtrarComprobantes(filtros)
      : this.getComprobantesPorEstado(true);
    return comprobantes.reduce((total, c) => total + c.total, 0);
  }

  getSubtotalVentas(filtros?: FiltrosVenta): number {
    const comprobantes = filtros
      ? this.filtrarComprobantes(filtros)
      : this.getComprobantesPorEstado(true);
    return comprobantes.reduce((total, c) => total + c.subtotal, 0);
  }

  getIGVVentas(filtros?: FiltrosVenta): number {
    const comprobantes = filtros
      ? this.filtrarComprobantes(filtros)
      : this.getComprobantesPorEstado(true);
    return comprobantes.reduce((total, c) => total + c.igv, 0);
  }

  getCountComprobantes(filtros?: FiltrosVenta): number {
    return filtros
      ? this.filtrarComprobantes(filtros).length
      : this.comprobantesSubject.value.length;
  }

  getVentasHoy(): ComprobanteVenta[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    return this.getComprobantesPorFecha(hoy, mañana);
  }

  getTotalVentasHoy(): number {
    return this.getVentasHoy().reduce((total, c) => (c.estado ? total + c.total : total), 0);
  }

  getVentasMes(mes: number, año: number): ComprobanteVenta[] {
    return this.comprobantesSubject.value.filter((c) => {
      const fecha = new Date(c.fec_emision);
      return fecha.getMonth() === mes && fecha.getFullYear() === año;
    });
  }

  getResumenPorTipo(): { [tipo: string]: { cantidad: number; total: number } } {
    const facturas = this.getComprobantesPorTipo('01').filter((c) => c.estado);
    const boletas = this.getComprobantesPorTipo('03').filter((c) => c.estado);

    return {
      FACTURAS: { cantidad: facturas.length, total: facturas.reduce((sum, c) => sum + c.total, 0) },
      BOLETAS: { cantidad: boletas.length, total: boletas.reduce((sum, c) => sum + c.total, 0) },
    };
  }

  generarSerie(tipo: '01' | '03', numero: number = 1): string {
    return tipo === '01'
      ? `F${String(numero).padStart(3, '0')}`
      : `B${String(numero).padStart(3, '0')}`;
  }

  getUltimoNumero(serie: string): number {
    const comprobantes = this.comprobantesSubject.value.filter((c) => c.serie === serie);
    return comprobantes.length > 0 ? Math.max(...comprobantes.map((c) => c.numero)) : 0;
  }

  private generarHash(id: string, serie: string, numero: number): string {
    const timestamp = Date.now();
    return `HASH-${id}-${timestamp}`;
  }

  calcularIGV(subtotal: number): number {
    return Number((subtotal * 0.18).toFixed(2));
  }

  calcularSubtotal(total: number): number {
    return Number((total / 1.18).toFixed(2));
  }

  setComprobanteActual(comprobante: Partial<ComprobanteVenta>): void {
    this.comprobanteActualSubject.next(comprobante);
  }

  getComprobanteActual(): Partial<ComprobanteVenta> | null {
    return this.comprobanteActualSubject.value;
  }

  limpiarComprobanteActual(): void {
    this.comprobanteActualSubject.next(null);
  }

  setVentaWizard(wizard: Partial<VentaWizard>): void {
    this.ventaWizardSubject.next(wizard);
  }

  getVentaWizard(): Partial<VentaWizard> | null {
    return this.ventaWizardSubject.value;
  }

  limpiarVentaWizard(): void {
    this.ventaWizardSubject.next(null);
  }

  validarComprobante(comprobante: Partial<ComprobanteVenta>): {
    valido: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!comprobante.id_cliente) errores.push('Cliente requerido');
    if (!comprobante.tipo_comprobante) errores.push('Tipo de comprobante requerido');
    if (!comprobante.detalles || comprobante.detalles.length === 0)
      errores.push('Debe agregar productos');
    if (!comprobante.total || comprobante.total <= 0) errores.push('Total inválido');

    return { valido: errores.length === 0, errores };
  }

  puedeAnular(id: string): boolean {
    const comprobante = this.getComprobantePorId(id);
    if (!comprobante) return false;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEmision = new Date(comprobante.fec_emision);
    fechaEmision.setHours(0, 0, 0, 0);

    return comprobante.estado && fechaEmision.getTime() === hoy.getTime();
  }

  getEstadisticasPorEmpleado(idEmpleado: string) {
    const ventas = this.getComprobantesPorEmpleado(idEmpleado).filter((c) => c.estado);

    return {
      totalVentas: ventas.length,
      totalMonto: ventas.reduce((sum, c) => sum + c.total, 0),
      promedio: ventas.length > 0 ? ventas.reduce((sum, c) => sum + c.total, 0) / ventas.length : 0,
      boletas: ventas.filter((c) => c.tipo_comprobante === '03').length,
      facturas: ventas.filter((c) => c.tipo_comprobante === '01').length,
    };
  }

  getEstadisticasPorSede(idSede: string) {
    const ventas = this.getComprobantesPorSede(idSede).filter((c) => c.estado);

    return {
      totalVentas: ventas.length,
      totalMonto: ventas.reduce((sum, c) => sum + c.total, 0),
      promedio: ventas.length > 0 ? ventas.reduce((sum, c) => sum + c.total, 0) / ventas.length : 0,
      boletas: ventas.filter((c) => c.tipo_comprobante === '03').length,
      facturas: ventas.filter((c) => c.tipo_comprobante === '01').length,
    };
  }
  getVentaByCorrelativo(correlativo: string): Observable<any> {
    return this.http.get<any>(`${this.urlLogistica}/sale/${correlativo}`);
  }
}
