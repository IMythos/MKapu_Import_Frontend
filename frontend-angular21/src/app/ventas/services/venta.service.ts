/* ============================================
   frontend-angular21/src/app/ventas/services/venta.service.ts
   ============================================ */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  RegistroVentaRequest,
  RegistroVentaResponse,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
  SalesReceiptsQuery,
  SalesReceiptListResponse,
  SalesReceiptAutocompleteItem,     // ✅ agregar a interfaces si no existe
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http        = inject(HttpClient);
  private readonly apiUrl      = `${environment.apiUrl}/sales`;

  // ── sedeId se inyecta automáticamente desde la sesión ──────────────────────
  private get sedeId(): number | null {
    const raw = localStorage.getItem('user');          // ajusta la key a la tuya
    if (!raw) return null;
    try {
      const user = JSON.parse(raw);
      return user?.id_sede ?? user?.sedeId ?? null;
    } catch {
      return null;
    }
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  /** Añade sedeId automáticamente si existe en sesión */
  private withSede(params: HttpParams): HttpParams {
    const sede = this.sedeId;
    return sede ? params.set('sedeId', String(sede)) : params;
  }

  // ─── COMMANDS ─────────────────────────────────────────────────────────────

  registrarVenta(request: RegistroVentaRequest): Observable<RegistroVentaResponse> {
    return this.http.post<RegistroVentaResponse>(
      `${this.apiUrl}/receipts`,
      request,
    );
  }

  anularVenta(ventaId: number, reason: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/receipts/${ventaId}/annul`,
      { reason },
    );
  }

  eliminarVenta(ventaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/receipts/${ventaId}`);
  }

  // ─── QUERIES ──────────────────────────────────────────────────────────────

  /** Listado resumido paginado — sedeId se agrega desde sesión automáticamente */
  listarVentas(
    query: SalesReceiptsQuery = {},
  ): Observable<SalesReceiptSummaryListResponse> {
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 10;

    let params = new HttpParams()
      .set('page',  String(page))
      .set('limit', String(limit));

    if (query.status)          params = params.set('status',        query.status);
    if (query.customerId)      params = params.set('customerId',    query.customerId);
    if (query.receiptTypeId != null)
                               params = params.set('receiptTypeId', String(query.receiptTypeId));
    if (query.dateFrom)        params = params.set('dateFrom',      query.dateFrom);
    if (query.dateTo)          params = params.set('dateTo',        query.dateTo);
    if (query.search)          params = params.set('search',        query.search);

    // ✅ sedeId desde sesión, no del filtro manual
    params = this.withSede(params);

    return this.http.get<SalesReceiptSummaryListResponse>(
      `${this.apiUrl}/receipts`,
      { params },
    );
  }

  /** Detalle completo + historial del cliente */
  obtenerVentaPorId(ventaId: number): Observable<SalesReceiptWithHistoryDto> {
    return this.http.get<SalesReceiptWithHistoryDto>(
      `${this.apiUrl}/receipts/${ventaId}`,
    );
  }

  /** Comprobantes por serie */
  obtenerVentasPorSerie(serie: string): Observable<SalesReceiptListResponse> {
    return this.http.get<SalesReceiptListResponse>(
      `${this.apiUrl}/receipts/serie/${serie}`,
    );
  }

  /** Historial de compras de un cliente específico */
  obtenerHistorialCliente(
    customerId: string,
  ): Observable<CustomerPurchaseHistoryDto> {
    return this.http.get<CustomerPurchaseHistoryDto>(
      `${this.apiUrl}/receipts/customer/${customerId}/history`,
    );
  }

  /** Autocomplete de clientes — mínimo 2 caracteres, sedeId desde sesión */
  autocompleteClientes(
    search: string,
  ): Observable<SalesReceiptAutocompleteItem[]> {
    if (search.trim().length < 2) {
      return new Observable((obs) => { obs.next([]); obs.complete(); });
    }

    let params = new HttpParams().set('search', search.trim());

    // ✅ filtra por sede de la sesión
    params = this.withSede(params);

    return this.http.get<SalesReceiptAutocompleteItem[]>(
      `${this.apiUrl}/receipts/autocomplete/customers`,
      { params },
    );
  }
}
