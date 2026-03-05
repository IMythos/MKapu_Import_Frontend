import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';

import {
  SalesReceiptsQueryAdmin,
  SalesReceiptSummaryListResponseAdmin,
  SalesReceiptWithHistoryDtoAdmin,
  SalesReceiptKpiDto,
  RegistroVentaAdminRequest,
  RegistroVentaAdminResponse,
  AnularVentaAdminResponse,
  SedeAdmin,
  ProductoStockAdminResponse,
  ProductoStockAdmin,
  ProductoAutocompleteAdminResponse,
  ProductoAutocompleteAdmin,
  ProductoUIAdmin,
  CategoriaConStockAdmin,
  ClienteBusquedaAdminResponse,
  CrearClienteAdminRequest,
  ActualizarClienteAdminRequest,
  ClienteAdminResponse,
  TipoDocumentoAdmin,
  PromocionAdmin,
} from '../interfaces/ventas.interface';

@Injectable({ providedIn: 'root' })
export class VentasAdminService {
  private readonly http = inject(HttpClient);

  private readonly url = environment.apiUrl;
  private readonly salesUrl = `${environment.apiUrl}/sales`;
  private readonly adminUrl = `${environment.apiUrl}/admin`;
  private readonly logisticsUrl = `${environment.apiUrl}/logistics`;

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'x-role': 'Administrador' });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORIAL DE VENTAS
  // ─────────────────────────────────────────────────────────────────────────

  listarHistorialVentas(
    query: SalesReceiptsQueryAdmin = {},
  ): Observable<SalesReceiptSummaryListResponseAdmin> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('limit', String(query.limit ?? 10));

    if (query.status) params = params.set('status', query.status);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.receiptTypeId != null)
      params = params.set('receiptTypeId', String(query.receiptTypeId));
    if (query.paymentMethodId != null)
      params = params.set('paymentMethodId', String(query.paymentMethodId));
    if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
    if (query.dateTo) params = params.set('dateTo', query.dateTo);
    if (query.search) params = params.set('search', query.search);
    if (query.sedeId != null) params = params.set('sedeId', String(query.sedeId));

    return this.http.get<SalesReceiptSummaryListResponseAdmin>(
      `${this.salesUrl}/receipts/historial`,
      { headers: this.headers, params },
    );
  }

  obtenerVentaConHistorial(
    id: number,
    historialPage = 1,
  ): Observable<SalesReceiptWithHistoryDtoAdmin> {
    const params = new HttpParams().set('historialPage', String(historialPage));
    return this.http.get<SalesReceiptWithHistoryDtoAdmin>(
      `${this.salesUrl}/receipts/${id}/detalle`,
      { headers: this.headers, params },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // KPI
  // ─────────────────────────────────────────────────────────────────────────

  getKpiSemanal(sedeId?: number): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    if (sedeId != null) params = params.set('sedeId', String(sedeId));
    return this.http.get<SalesReceiptKpiDto>(`${this.salesUrl}/receipts/kpi/semanal`, {
      headers: this.headers,
      params,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REGISTRO / ANULACIÓN DE VENTA
  // ─────────────────────────────────────────────────────────────────────────

  registrarVenta(request: RegistroVentaAdminRequest): Observable<RegistroVentaAdminResponse> {
    return this.http.post<RegistroVentaAdminResponse>(`${this.salesUrl}/receipts`, request, {
      headers: this.headers,
    });
  }

  anularVenta(id: number, reason: string): Observable<AnularVentaAdminResponse> {
    return this.http.put<AnularVentaAdminResponse>(
      `${this.salesUrl}/receipts/${id}/annul`,
      { reason },
      { headers: this.headers },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SEDES
  // ─────────────────────────────────────────────────────────────────────────

  obtenerSedes(): Observable<SedeAdmin[]> {
    return this.http
      .get<any>(`${this.adminUrl}/headquarters`, { headers: this.headers })
      .pipe(map((res) => res.data ?? res.headquarters ?? res ?? []));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCTOS
  // ─────────────────────────────────────────────────────────────────────────

  obtenerProductosConStock(
    idSede?: number,
    idCategoria?: number,
    page = 1,
    size = 10,
  ): Observable<ProductoStockAdminResponse> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (idSede != null) params = params.set('id_sede', String(idSede));
    if (idCategoria != null) params = params.set('id_categoria', String(idCategoria));

    return this.http.get<ProductoStockAdminResponse>(`${this.logisticsUrl}/products/ventas/stock`, {
      headers: this.headers,
      params,
    });
  }

  buscarProductosVentas(
    query: string,
    idSede?: number,
    idCategoria?: number,
  ): Observable<ProductoAutocompleteAdminResponse> {
    let params = new HttpParams().set('search', query);
    if (idSede != null) params = params.set('id_sede', String(idSede));
    if (idCategoria != null) params = params.set('id_categoria', String(idCategoria));

    return this.http.get<ProductoAutocompleteAdminResponse>(
      `${this.logisticsUrl}/products/ventas/autocomplete`,
      { headers: this.headers, params },
    );
  }

  obtenerCategoriasConStock(idSede?: number): Observable<CategoriaConStockAdmin[]> {
    let params = new HttpParams();
    if (idSede != null) params = params.set('id_sede', String(idSede));
    return this.http.get<CategoriaConStockAdmin[]>(
      `${this.logisticsUrl}/products/categorias-con-stock`,
      { headers: this.headers, params },
    );
  }
  buscarCliente(
    documentValue: string,
    receiptTypeId: number,
  ): Observable<ClienteBusquedaAdminResponse> {
    return this.http
      .get<any>(`${this.salesUrl}/customers/document/${documentValue}`, { headers: this.headers })
      .pipe(
        map((cliente) => {
          if (!cliente) throw { error: { message: 'Cliente no encontrado' } };
          return {
            customerId: cliente.customerId ?? cliente.id_cliente,
            name: cliente.name ?? cliente.nombres ?? cliente.displayName ?? '',
            documentValue: cliente.documentValue ?? cliente.valor_doc,
            documentTypeDescription: cliente.documentTypeDescription ?? '',
            documentTypeSunatCode: cliente.documentTypeSunatCode ?? '',
            invoiceType: (receiptTypeId === 1 ? 'FACTURA' : 'BOLETA') as 'BOLETA' | 'FACTURA',
            status: cliente.status ?? cliente.estado,
            address: cliente.address ?? cliente.direccion ?? null,
            email: cliente.email ?? null,
            phone: cliente.phone ?? cliente.telefono ?? null,
            displayName: cliente.displayName ?? cliente.name ?? '',
          } as ClienteBusquedaAdminResponse;
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  obtenerTiposDocumento(): Observable<TipoDocumentoAdmin[]> {
    return this.http.get<TipoDocumentoAdmin[]>(`${this.url}/sales/customers/document-types`, {
      headers: this.headers,
    });
  }

  crearCliente(request: CrearClienteAdminRequest): Observable<ClienteAdminResponse> {
    return this.http.post<ClienteAdminResponse>(`${this.salesUrl}/customers`, request, {
      headers: this.headers,
    });
  }

  obtenerKpiSemanal(sedeId?: number): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    if (sedeId) params = params.set('sedeId', String(sedeId));
    return this.http.get<SalesReceiptKpiDto>(`${this.salesUrl}/receipts/kpi/semanal`, { params });
  }

  actualizarCliente(
    id: string,
    payload: ActualizarClienteAdminRequest,
  ): Observable<ClienteAdminResponse> {
    return this.http.put<ClienteAdminResponse>(`${this.salesUrl}/customers/${id}`, payload, {
      headers: this.headers,
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPPERS
  // ─────────────────────────────────────────────────────────────────────────

  mapearProductoConStock(prod: ProductoStockAdmin): ProductoUIAdmin {
    return {
      id: prod.id_producto,
      codigo: prod.codigo,
      nombre: prod.nombre,
      familia: prod.familia,
      id_categoria: prod.id_categoria,
      stock: prod.stock,
      precioUnidad: prod.precio_unitario,
      precioCaja: prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede: prod.sede,
      id_sede: prod.id_sede,
    };
  }

  mapearAutocompleteVentas(prod: ProductoAutocompleteAdmin): ProductoUIAdmin {
    return {
      id: prod.id_producto,
      codigo: prod.codigo,
      nombre: prod.nombre,
      familia: prod.familia,
      id_categoria: prod.id_categoria,
      stock: prod.stock,
      precioUnidad: prod.precio_unitario,
      precioCaja: prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede: prod.sede,
      id_sede: prod.id_sede,
    };
  }

  // ventas.service.ts

  obtenerPromocionesActivas(): Observable<PromocionAdmin[]> {
    return this.http
      .get<PromocionAdmin[]>(`${this.salesUrl}/promotions/active`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }
}
