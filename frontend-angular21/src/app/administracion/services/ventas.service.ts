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
  ProductoAutocompleteAdminResponse,
  ProductoUIAdmin,
  CategoriaConStockAdmin,
  ClienteBusquedaAdminResponse,
  CrearClienteAdminRequest,
  ActualizarClienteAdminRequest,
  ClienteAdminResponse,
  TipoDocumentoAdmin,
  PromocionAdmin,
  MetodoPagoAdmin,
  TipoVentaAdmin,
  TipoComprobanteAdmin,
  SalesReceiptDetalleCompletoDto,
  WhatsAppStatusResponse,
  SendNotificationResponse,
  BancoAdmin,
  TipoServicioAdmin,
  AuctionAutocompleteItemAdmin,
  AuctionAutocompleteResponseAdmin,
  RemateUIAdmin,
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

  registrarVenta(request: RegistroVentaAdminRequest): Observable<RegistroVentaAdminResponse> {
    return this.http
      .post<RegistroVentaAdminResponse>(`${this.salesUrl}/receipts`, request, {
        headers: this.headers,
      })
      .pipe(
        map(
          (res: any) =>
            ({
              idComprobante: res.idComprobante ?? res.id_comprobante ?? 0,
              idCliente: res.idCliente ?? res.id_cliente ?? '',
              numeroCompleto:
                res.numeroCompleto ??
                res.numero_completo ??
                `${res.serie}-${String(res.numero ?? 0).padStart(8, '0')}`,
              serie: res.serie ?? '',
              numero: res.numero ?? 0,
              fecEmision: res.fecEmision ?? res.fec_emision ?? new Date().toISOString(),
              fecVenc: res.fecVenc ?? res.fec_venc ?? undefined,
              tipoOperacion: res.tipoOperacion ?? res.tipo_operacion ?? '',
              subtotal: res.subtotal ?? 0,
              igv: res.igv ?? 0,
              isc: res.isc ?? 0,
              total: res.total ?? 0,
              estado: res.estado ?? 'EMITIDO',
              codMoneda: res.codMoneda ?? res.cod_moneda ?? 'PEN',
              idTipoComprobante: res.idTipoComprobante ?? res.id_tipo_comprobante ?? 0,
              idTipoVenta: res.idTipoVenta ?? res.id_tipo_venta ?? 0,
              idSedeRef: res.idSedeRef ?? res.id_sede_ref ?? 0,
              idResponsableRef: res.idResponsableRef ?? res.id_responsable_ref ?? '',
              items: res.items ?? [],
            }) as RegistroVentaAdminResponse,
        ),
        catchError((err) => throwError(() => err)),
      );
  }

  anularVenta(id: number, reason: string): Observable<AnularVentaAdminResponse> {
    return this.http.put<AnularVentaAdminResponse>(
      `${this.salesUrl}/receipts/${id}/annul`,
      { reason },
      { headers: this.headers },
    );
  }

  emitirComprobante(id: number, paymentTypeId?: number): Observable<any> {
    return this.http.put<any>(
      `${this.salesUrl}/receipts/${id}/emit`,
      { paymentTypeId },
      { headers: this.headers },
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

  getDetalleComprobante(receiptId: number): Observable<any> {
    return this.http.get<any>(`${this.salesUrl}/receipts/${receiptId}/detalle`, {
      headers: this.headers,
    });
  }

  getKpiSemanal(sedeId?: number): Observable<SalesReceiptKpiDto> {
    let params = new HttpParams();
    if (sedeId != null) params = params.set('sedeId', String(sedeId));
    return this.http.get<SalesReceiptKpiDto>(`${this.salesUrl}/receipts/kpi/semanal`, {
      headers: this.headers,
      params,
    });
  }

  obtenerTiposVenta(): Observable<TipoVentaAdmin[]> {
    return this.http
      .get<TipoVentaAdmin[]>(`${this.salesUrl}/receipts/sale-types`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }

  obtenerTiposComprobante(): Observable<TipoComprobanteAdmin[]> {
    return this.http
      .get<TipoComprobanteAdmin[]>(`${this.salesUrl}/receipts/receipt-types`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }

  obtenerMetodosPago(): Observable<MetodoPagoAdmin[]> {
    return this.http
      .get<MetodoPagoAdmin[]>(`${this.salesUrl}/receipts/payment-types`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }

  descargarComprobantePdf(id: number, nombreArchivo?: string): Observable<void> {
    return this.http
      .get(`${this.salesUrl}/receipts/${id}/pdf`, {
        headers: this.headers,
        responseType: 'blob',
      })
      .pipe(
        map((blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = nombreArchivo ?? `comprobante-${id}.pdf`;
          anchor.click();
          URL.revokeObjectURL(url);
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  verComprobantePdfEnPestana(id: number): Observable<void> {
    return this.http
      .get(`${this.salesUrl}/receipts/${id}/pdf`, {
        headers: this.headers,
        responseType: 'blob',
      })
      .pipe(
        map((blob: Blob) => {
          const pdfBlob = new Blob([blob], { type: 'application/pdf' });
          const url = URL.createObjectURL(pdfBlob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10_000);
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  enviarComprobantePorEmail(id: number): Observable<SendNotificationResponse> {
    return this.http
      .post<SendNotificationResponse>(
        `${this.salesUrl}/receipts/${id}/send-email`,
        {},
        { headers: this.headers },
      )
      .pipe(catchError((err) => throwError(() => err)));
  }

  obtenerEstadoWhatsApp(): Observable<WhatsAppStatusResponse> {
    return this.http
      .get<WhatsAppStatusResponse>(`${this.salesUrl}/receipts/whatsapp/status`, {
        headers: this.headers,
      })
      .pipe(catchError((err) => throwError(() => err)));
  }

  enviarComprobantePorWhatsApp(id: number): Observable<SendNotificationResponse> {
    return this.http
      .post<SendNotificationResponse>(
        `${this.salesUrl}/receipts/${id}/send-whatsapp`,
        {},
        { headers: this.headers },
      )
      .pipe(catchError((err) => throwError(() => err)));
  }

  obtenerPromocionesActivas(): Observable<PromocionAdmin[]> {
    return this.http
      .get<PromocionAdmin[]>(`${this.salesUrl}/promotions/active`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }

  obtenerSedes(): Observable<SedeAdmin[]> {
    return this.http
      .get<any>(`${this.adminUrl}/headquarters`, { headers: this.headers })
      .pipe(map((res) => res.data ?? res.headquarters ?? res ?? []));
  }

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

  buscarRematesAutocomplete(
    search: string,
    idSede?: number,
  ): Observable<AuctionAutocompleteItemAdmin[]> {
    let params = new HttpParams().set('search', search);
    if (idSede != null) params = params.set('id_sede', String(idSede));
    return this.http
      .get<any>(`${this.logisticsUrl}/auctions/autocomplete`, {
        headers: this.headers,
        params,
      })
      .pipe(
        map((res) => {
          if (Array.isArray(res)) return res as AuctionAutocompleteItemAdmin[];
          if (res?.data && Array.isArray(res.data)) return res.data as AuctionAutocompleteItemAdmin[];
          return [];
        }),
        catchError(() => of([])),
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

  mapearProductoConStock(p: any): ProductoUIAdmin {
    const almacenes: Array<{ nombre: string; stock: number }> = Array.isArray(p.almacenes)
      ? p.almacenes.map((a: any) => ({
          nombre: a.nombre ?? a.nombre_almacen ?? 'Almacén',
          stock: Number(a.stock ?? a.cantidad ?? 0),
        }))
      : [{ nombre: p.nombre_almacen ?? 'Almacén', stock: Number(p.stock ?? 0) }];

    return {
      id: Number(p.id ?? p.id_producto),
      codigo: p.codigo ?? p.cod_prod ?? '',
      nombre: p.nombre ?? p.descripcion ?? '',
      familia: p.familia ?? p.categoria ?? '',
      categoriaId: Number(p.id_categoria ?? p.categoriaId ?? 0) || undefined,
      precioUnidad: Number(p.precioUnidad ?? p.precio_unitario ?? 0),
      precioCaja: Number(p.precioCaja ?? p.precio_caja ?? 0),
      precioMayorista: Number(p.precioMayorista ?? p.precio_mayor ?? 0),
      stock: almacenes.reduce((s, a) => s + a.stock, 0),
      sede: p.sede ?? '',
      almacenes,
    };
  }

  mapearAutocompleteVentas(p: any): ProductoUIAdmin {
    const almacenes: Array<{ nombre: string; stock: number }> = Array.isArray(p.almacenes)
      ? p.almacenes.map((a: any) => ({
          nombre: a.nombre ?? a.nombre_almacen ?? 'Almacén',
          stock: Number(a.stock ?? a.cantidad ?? 0),
        }))
      : [{ nombre: p.nombre_almacen ?? 'Almacén', stock: Number(p.stock ?? 0) }];

    return {
      id: p.id ?? p.id_producto,
      codigo: p.codigo ?? p.cod_prod ?? '',
      nombre: p.nombre ?? p.descripcion ?? '',
      familia: p.familia ?? p.categoria ?? '',
      categoriaId: Number(p.id_categoria ?? p.categoriaId ?? 0) || undefined,
      precioUnidad: Number(p.precioUnidad ?? p.precio_unitario ?? 0),
      precioCaja: Number(p.precioCaja ?? p.precio_caja ?? 0),
      precioMayorista: Number(p.precioMayorista ?? p.precio_mayor ?? 0),
      stock: almacenes.reduce((s, a) => s + a.stock, 0),
      sede: p.sede ?? '',
      almacenes,
    };
  }

  mapearAuctionItem(item: AuctionAutocompleteItemAdmin): RemateUIAdmin {
    return {
      idDetalleRemate: item.id_detalle_remate,
      idRemate: item.id_remate,
      codRemate: item.cod_remate,
      idProducto: item.id_producto,
      preOriginal: Number(item.pre_original),
      preRemate: Number(item.pre_remate),
      stockRemate: Number(item.stock_remate),
      descripcionRemate: item.descripcion_remate,
    };
  }

  buscarCliente(documentValue: string): Observable<ClienteBusquedaAdminResponse> {
    return this.http
      .get<any>(`${this.salesUrl}/customers/document/${documentValue}`, {
        headers: this.headers,
      })
      .pipe(
        map((cliente) => {
          if (!cliente) throw { error: { message: 'Cliente no encontrado' } };
          return {
            customerId: cliente.customerId ?? cliente.id_cliente,
            name: cliente.name ?? cliente.nombres ?? cliente.displayName ?? '',
            documentValue: cliente.documentValue ?? cliente.valor_doc,
            documentTypeDescription: cliente.documentTypeDescription ?? '',
            documentTypeSunatCode: cliente.documentTypeSunatCode ?? '',
            invoiceType: cliente.invoiceType ?? cliente.invoice_type ?? '',
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

  crearCliente(request: CrearClienteAdminRequest): Observable<ClienteAdminResponse> {
    return this.http.post<ClienteAdminResponse>(`${this.salesUrl}/customers`, request, {
      headers: this.headers,
    });
  }

  actualizarCliente(
    id: string,
    payload: ActualizarClienteAdminRequest,
  ): Observable<ClienteAdminResponse> {
    return this.http.put<ClienteAdminResponse>(`${this.salesUrl}/customers/${id}`, payload, {
      headers: this.headers,
    });
  }

  obtenerTiposDocumento(): Observable<TipoDocumentoAdmin[]> {
    return this.http.get<TipoDocumentoAdmin[]>(`${this.url}/sales/customers/document-types`, {
      headers: this.headers,
    });
  }

  consultarDocumentoIdentidad(numero: string): Observable<{
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombreCompleto: string;
    tipoDocumento: string;
    razonSocial?: string;
    direccion?: string;
  }> {
    return this.http
      .get<any>(`${this.salesUrl}/reniec/consultar/${numero}`, {
        headers: this.headers,
      })
      .pipe(
        catchError(() =>
          of({
            nombres: '',
            apellidoPaterno: '',
            apellidoMaterno: '',
            nombreCompleto: '',
            tipoDocumento: '',
          }),
        ),
      );
  }

  getDetalleCompleto(id: number, historialPage = 1): Observable<SalesReceiptDetalleCompletoDto> {
    const params = new HttpParams().set('historialPage', String(historialPage));
    return this.http.get<SalesReceiptDetalleCompletoDto>(
      `${this.salesUrl}/receipts/${id}/detalle`,
      { headers: this.headers, params },
    );
  }

  generarVoucher(id: number, esCopia = false): Observable<void> {
    const params = esCopia ? '?copia=true' : '';
    return this.http
      .get(`${this.salesUrl}/receipts/${id}/thermal${params}`, {
        headers: this.headers,
        responseType: 'blob',
      })
      .pipe(
        map((blob: Blob) => {
          const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 10_000);
        }),
        catchError((err) => throwError(() => err)),
      );
  }

  obtenerBancos(): Observable<BancoAdmin[]> {
    return this.http
      .get<BancoAdmin[]>(`${this.salesUrl}/banks`, {
        headers: this.headers,
      })
      .pipe(catchError(() => of([])));
  }

  obtenerTiposServicio(bancoId?: number): Observable<TipoServicioAdmin[]> {
    let params = new HttpParams();
    if (bancoId != null) params = params.set('bancoId', String(bancoId));
    return this.http
      .get<TipoServicioAdmin[]>(`${this.salesUrl}/banks/service-types`, {
        headers: this.headers,
        params,
      })
      .pipe(catchError(() => of([])));
  }
}