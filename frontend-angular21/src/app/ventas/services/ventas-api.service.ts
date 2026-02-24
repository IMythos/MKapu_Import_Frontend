/* frontend-angular21/src/app/ventas/services/ventas-api.service.ts */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

import {
  ClienteBusquedaResponse,
  ClienteErrorResponse,
  RegistroVentaRequest,
  RegistroVentaResponse,
  ItemVenta,
  OPERATION_TYPE_VENTA_INTERNA,
  CURRENCY_PEN,
  IGV_RATE,
  SalesReceiptSummaryListResponse,
  SalesReceiptWithHistoryDto,
  CustomerPurchaseHistoryDto,
  SalesReceiptsQuery,
  CustomerByIdResponse,
  AdminUserFullResponse,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class VentasApiService {
  private readonly BASE_URL = environment.apiUrl;
  private readonly SALES_URL = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  buscarClientePorDocumento(numeroDocumento: string): Observable<ClienteBusquedaResponse> {
    return this.http
      .get<ClienteBusquedaResponse>(`${this.SALES_URL}/customers/document/${numeroDocumento}`)
      .pipe(catchError((e) => this.handleErrorCliente(e)));
  }

  obtenerClientePorId(customerId: string): Observable<CustomerByIdResponse | null> {
    return this.http
      .get<CustomerByIdResponse | null>(`${this.SALES_URL}/customers/${customerId}`)
      .pipe(
        catchError((e) => {
          console.warn('No se pudo obtener cliente por id:', customerId, e);
          return of(null);
        }),
      );
  }

  obtenerUsuarioFull(idUsuario: number): Observable<AdminUserFullResponse | null> {
    return this.http
      .get<AdminUserFullResponse>(`${this.BASE_URL}/admin/users/${idUsuario}/full`)
      .pipe(
        catchError((e) => {
          console.warn('No se pudo obtener usuario full:', idUsuario, e);
          return of(null);
        }),
      );
  }

  registrarVenta(venta: RegistroVentaRequest): Observable<RegistroVentaResponse> {
    return this.http
      .post<RegistroVentaResponse>(`${this.SALES_URL}/receipts`, venta)
      .pipe(catchError((e) => this.handleErrorVenta(e)));
  }

  // ✅ NUEVO: Listado resumido enriquecido con TCP
  listarHistorialVentas(query: SalesReceiptsQuery = {}): Observable<SalesReceiptSummaryListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (query.status) params = params.set('status', query.status);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.receiptTypeId != null) params = params.set('receiptTypeId', String(query.receiptTypeId));
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    if (query.search) params = params.set('search', query.search);
    if (query.sedeId) params = params.set('sedeId', String(query.sedeId));

    return this.http
      .get<SalesReceiptSummaryListResponse>(`${this.SALES_URL}/receipts`, { params })
      .pipe(catchError((e) => this.handleErrorVenta(e)));
  }

  // ✅ NUEVO: Detalle completo + historial del cliente
  obtenerVentaConHistorial(receiptId: number): Observable<SalesReceiptWithHistoryDto> {
    return this.http
      .get<SalesReceiptWithHistoryDto>(`${this.SALES_URL}/receipts/${receiptId}`)
      .pipe(catchError((e) => this.handleErrorVenta(e)));
  }

  // ✅ NUEVO: Historial de compras del cliente (standalone)
  obtenerHistorialCliente(customerId: string): Observable<CustomerPurchaseHistoryDto> {
    return this.http
      .get<CustomerPurchaseHistoryDto>(`${this.SALES_URL}/receipts/customer/${customerId}/history`)
      .pipe(catchError((e) => this.handleErrorVenta(e)));
  }

  construirRequestVenta(params: {
    customerId: string;
    receiptTypeId: number;
    serie: string;
    subtotal: number;
    igv: number;
    total: number;
    responsibleId: string;
    branchId: number;
    paymentMethodId: number;
    operationNumber: string | null;
    items: ItemVenta[];
    dueDate?: string | null;
  }): RegistroVentaRequest {
    const fechaVencimiento = params.dueDate || new Date().toISOString();

    return {
      customerId: params.customerId,
      saleTypeId: 1,
      serie: params.serie,
      receiptTypeId: params.receiptTypeId,
      dueDate: fechaVencimiento,
      operationType: OPERATION_TYPE_VENTA_INTERNA,
      subtotal: params.subtotal,
      igv: params.igv,
      isc: 0.0,
      total: params.total,
      currencyCode: CURRENCY_PEN,
      responsibleId: params.responsibleId,
      branchId: params.branchId,
      paymentMethodId: params.paymentMethodId,
      operationNumber: params.operationNumber,
      items: params.items,
    };
  }

  calcularSubtotal(items: ItemVenta[]): number {
    const totalBruto = items.reduce((sum, item) => sum + item.total, 0);
    return totalBruto / (1 + IGV_RATE);
  }

  calcularIGV(subtotal: number): number {
    return subtotal * IGV_RATE;
  }

  calcularTotal(subtotal: number, igv: number): number {
    return subtotal + igv;
  }

  construirItemVenta(params: {
    productId: string;
    quantity: number;
    unitPrice: number;
    description: string;
  }): ItemVenta {
    const total = params.quantity * params.unitPrice;

    return {
      productId: params.productId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      description: params.description,
      total,
      igv: 0.0,
    };
  }

  private handleErrorCliente(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.status === 404) {
      const errorBody = error.error as ClienteErrorResponse;
      errorMessage = errorBody.message || 'Cliente no encontrado';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
    }

    console.error('Error búsqueda cliente:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private handleErrorVenta(error: HttpErrorResponse): Observable<never> {
    const errorMessage =
      error.error?.message || `Error ${error.status}: ${error.statusText}` || 'Error venta';
    console.error('Error venta:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
