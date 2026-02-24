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
  private readonly http   = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  private get sedeId(): number | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user?.id_sede ?? user?.sedeId ?? null;
    } catch {
      return null;
    }
  }

  private withSede(params: HttpParams): HttpParams {
    const sede = this.sedeId;
    return sede ? params.set('sedeId', String(sede)) : params;
  }

  registrarVenta(request: RegistroVentaRequest): Observable<RegistroVentaResponse> {
    return this.http.post<RegistroVentaResponse>(`${this.apiUrl}/receipts`, request);
  }

  anularVenta(ventaId: number, reason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/receipts/${ventaId}/annul`, { reason });
  }

  eliminarVenta(ventaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/receipts/${ventaId}`);
  }

  listarVentas(query: SalesReceiptsQuery = {}): Observable<SalesReceiptSummaryListResponse> {
    let params = new HttpParams()
      .set('page',  String(query.page  ?? 1))
      .set('limit', String(query.limit ?? 10));

    if (query.status)                 params = params.set('status',           query.status);
    if (query.customerId)             params = params.set('customerId',       query.customerId);
    if (query.receiptTypeId  != null) params = params.set('receiptTypeId',    String(query.receiptTypeId));
    if (query.dateFrom)               params = params.set('dateFrom',         query.dateFrom);
    if (query.dateTo)                 params = params.set('dateTo',           query.dateTo);
    if (query.search)                 params = params.set('search',           query.search);

    params = this.withSede(params);

    return this.http.get<SalesReceiptSummaryListResponse>(
      `${this.apiUrl}/receipts`,
      { params },
    );
  }

  listarHistorialVentas(query: SalesReceiptsQuery = {}): Observable<SalesReceiptSummaryListResponse> {
    let params = new HttpParams()
      .set('page',  String(query.page  ?? 1))
      .set('limit', String(query.limit ?? 10));

    if (query.status)                  params = params.set('status',           query.status);
    if (query.customerId)              params = params.set('customerId',       query.customerId);
    if (query.receiptTypeId  != null)  params = params.set('receiptTypeId',    String(query.receiptTypeId));
    if (query.paymentMethodId != null) params = params.set('paymentMethodId',  String(query.paymentMethodId));
    if (query.dateFrom)                params = params.set('dateFrom',         query.dateFrom);
    if (query.dateTo)                  params = params.set('dateTo',           query.dateTo);
    if (query.search)                  params = params.set('search',           query.search);
    if (query.sedeId != null)          params = params.set('sedeId',           String(query.sedeId));

    return this.http.get<SalesReceiptSummaryListResponse>(
      `${this.apiUrl}/receipts/historial`,
      { params },
    );
  }

  obtenerVentaPorId(ventaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/receipts/${ventaId}`);
  }

  obtenerVentaConHistorial(id: number): Observable<SalesReceiptWithHistoryDto> {
    return this.http.get<SalesReceiptWithHistoryDto>(
      `${this.apiUrl}/receipts/${id}/detalle`,
    );
  }

  obtenerVentasPorSerie(serie: string): Observable<SalesReceiptSummaryListResponse> {
    return this.http.get<SalesReceiptSummaryListResponse>(
      `${this.apiUrl}/receipts/serie/${serie}`,
    );
  }

  obtenerHistorialCliente(customerId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/receipts/customer/${customerId}/history`,
    );
  }

  getKpiSemanal(): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    const sede = this.sedeId;
    if (sede) params = params.set('sedeId', String(sede));

    return this.http.get<SalesReceiptKpiDto>(
      `${this.apiUrl}/receipts/kpi/semanal`,
      { params },
    );
  }

  autocompleteClientes(search: string): Observable<any[]> {
    if (search.trim().length < 2) {
      return new Observable((obs) => { obs.next([]); obs.complete(); });
    }

    let params = new HttpParams().set('search', search.trim());
    params = this.withSede(params);

    return this.http.get<any[]>(
      `${this.apiUrl}/receipts/autocomplete/customers`,
      { params },
    );
  }
}
