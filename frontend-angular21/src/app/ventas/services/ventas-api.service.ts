import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import {
  SalesReceiptsQuery,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  SalesReceiptKpiDto,
  ClienteHistorialResponse,     // ← añadir esta interface (ver abajo)
} from '../interfaces';


@Injectable({ providedIn: 'root' })
export class VentasApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sales`;


  private get sedeId(): number | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user?.id_sede ?? user?.idSede ?? null;
    } catch {
      return null;
    }
  }


  // ─── Historial de ventas (listado paginado) ───────────────────────
  listarHistorialVentas(
    query: SalesReceiptsQuery = {},
  ): Observable<SalesReceiptSummaryListResponse> {
    let params = new HttpParams()
      .set('page',  String(query.page  ?? 1))
      .set('limit', String(query.limit ?? 10));

    if (query.status)              params = params.set('status',          query.status);
    if (query.customerId)          params = params.set('customerId',       query.customerId);
    if (query.receiptTypeId != null)
      params = params.set('receiptTypeId',  String(query.receiptTypeId));
    if (query.paymentMethodId != null)
      params = params.set('paymentMethodId', String(query.paymentMethodId));
    if (query.dateFrom)  params = params.set('dateFrom',  query.dateFrom);
    if (query.dateTo)    params = params.set('dateTo',    query.dateTo);
    if (query.search)    params = params.set('search',    query.search);
    if (query.sedeId != null)
      params = params.set('sedeId', String(query.sedeId));

    return this.http.get<SalesReceiptSummaryListResponse>(
      `${this.apiUrl}/receipts/historial`,
      { params },
    );
  }


  // ─── Detalle de venta con historial del cliente ───────────────────
  obtenerVentaConHistorial(
    id: number,
    historialPage = 1,
  ): Observable<SalesReceiptWithHistoryDto> {
    const params = new HttpParams().set('historialPage', historialPage);
    return this.http.get<SalesReceiptWithHistoryDto>(
      `${this.apiUrl}/receipts/${id}/detalle`,
      { params },
    );
  }


  // ─── Historial paginado del cliente (endpoint dedicado) ──────────
  obtenerHistorialCliente(
    documento: string,
    page = 1,
    limit = 5,
  ): Observable<ClienteHistorialResponse> {
    const params = new HttpParams()
      .set('documento', documento)
      .set('page',      String(page))
      .set('limit',     String(limit));

    return this.http.get<ClienteHistorialResponse>(
      `${this.apiUrl}/receipts/historial-cliente`,
      { params },
    );
  }


  // ─── KPI semanal ──────────────────────────────────────────────────
  getKpiSemanal(): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    const sede = this.sedeId;
    if (sede) params = params.set('sedeId', String(sede));

    return this.http.get<SalesReceiptKpiDto>(
      `${this.apiUrl}/receipts/kpi/semanal`,
      { params },
    );
  }
}
