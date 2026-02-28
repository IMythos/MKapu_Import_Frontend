import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  RegistroVentaRequest,
  RegistroVentaResponse,
  SalesReceiptSummaryListResponse,
  SalesReceiptsQuery,
  SalesReceiptWithHistoryDto,
  SalesReceiptKpiDto,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  /**
   * Obtiene el ID de sede desde el localStorage del usuario logueado.
   */
  private get sedeId(): number | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user?.idSede ?? user?.id_sede ?? user?.sedeId ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Agrega el sedeId a los parámetros de la consulta si no se ha especificado uno.
   */
  private withSede(params: HttpParams): HttpParams {
    const sede = this.sedeId;
    return sede ? params.set('sedeId', String(sede)) : params;
  }

  /**
   * Registra una nueva venta en el sistema.
   */
  registrarVenta(request: RegistroVentaRequest): Observable<RegistroVentaResponse> {
    return this.http.post<RegistroVentaResponse>(`${this.apiUrl}/receipts`, request);
  }

  /**
   * Lista ventas generales (utilizado en el flujo de creación o listas simples).
   */
  listarVentas(query: SalesReceiptsQuery = {}): Observable<SalesReceiptSummaryListResponse> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('limit', String(query.limit ?? 10));

    if (query.status) params = params.set('status', query.status);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.receiptTypeId != null)
      params = params.set('receiptTypeId', String(query.receiptTypeId));
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    if (query.search) params = params.set('search', query.search);

    params = this.withSede(params);

    return this.http.get<SalesReceiptSummaryListResponse>(`${this.apiUrl}/receipts`, { params });
  }

  listarHistorialVentas(
    query: SalesReceiptsQuery = {},
  ): Observable<SalesReceiptSummaryListResponse> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('limit', String(query.limit ?? 10));

    // Filtro por Estado
    if (query.status) params = params.set('status', query.status);

    // Filtro por Tipo de Pago (Efectivo, Tarjeta, etc.)
    if (query.paymentMethodId != null) {
      params = params.set('paymentMethodId', String(query.paymentMethodId));
    }

    // Filtro por Tipo de Comprobante (Factura, Boleta, etc.)
    if (query.receiptTypeId != null) {
      params = params.set('receiptTypeId', String(query.receiptTypeId));
    }

    // Filtros por Rango de Fechas y Búsqueda general
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    if (query.search) params = params.set('search', query.search);

    // Filtro por Sede (si se pasa en el query se usa esa, sino la del usuario)
    if (query.sedeId) {
      params = params.set('sedeId', String(query.sedeId));
    } else {
      params = this.withSede(params);
    }

    return this.http.get<SalesReceiptSummaryListResponse>(`${this.apiUrl}/receipts/historial`, {
      params,
    });
  }

  /**
   * Busca los datos básicos de una venta por su ID.
   */
  obtenerVentaPorId(ventaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/receipts/${ventaId}`);
  }

  /**
   * Obtiene el detalle completo de un comprobante incluyendo productos e historial del cliente.
   */
  obtenerVentaConHistorial(id: number): Observable<SalesReceiptWithHistoryDto> {
    return this.http.get<SalesReceiptWithHistoryDto>(`${this.apiUrl}/receipts/${id}/detalle`);
  }

  /**
   * Busca comprobantes pertenecientes a una serie específica.
   */
  obtenerVentasPorSerie(serie: string): Observable<SalesReceiptSummaryListResponse> {
    return this.http.get<SalesReceiptSummaryListResponse>(`${this.apiUrl}/receipts/serie/${serie}`);
  }

  /**
   * Obtiene el historial resumido de compras de un cliente específico.
   */
  obtenerHistorialCliente(customerId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/receipts/customer/${customerId}/history`);
  }

  /**
   * Obtiene los KPIs (estadísticas) semanales de ventas de la sede actual.
   */
  getKpiSemanal(): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    const sede = this.sedeId;
    if (sede) params = params.set('sedeId', String(sede));

    return this.http.get<SalesReceiptKpiDto>(`${this.apiUrl}/receipts/kpi/semanal`, { params });
  }

  /**
   * Obtiene los tipos de pago disponibles (tipo_pago).
   */
  getPaymentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/receipts/payment-types`);
  }

  /**
   * Obtiene las monedas SUNAT disponibles (sunat_moneda).
   */
  getCurrencies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/receipts/currencies`);
  }

  autocompleteClientes(search: string): Observable<any[]> {
    if (search.trim().length < 2) {
      return new Observable((obs) => {
        obs.next([]);
        obs.complete();
      });
    }

    let params = new HttpParams().set('search', search.trim());
    params = this.withSede(params);

    return this.http.get<any[]>(`${this.apiUrl}/receipts/autocomplete/customers`, { params });
  }
}
