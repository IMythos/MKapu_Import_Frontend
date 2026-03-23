export const IGV_RATE_ADMIN = 0.18;
export const IGVRATEADMIN = IGV_RATE_ADMIN;

export interface SedeAdmin {
  id_sede: number;
  idsede?: number;
  nombre: string;
  direccion?: string;
  activo: boolean;
}

export interface SalesReceiptSummaryAdmin {
  idComprobante: number;
  numeroCompleto: string;
  serie: string;
  numero: number;
  tipoComprobante: string;
  fecEmision: string;
  clienteNombre: string;
  clienteDocumento: string;
  idResponsable: string;
  responsableNombre: string;
  idSede: number;
  sedeNombre: string;
  metodoPago: string;
  total: number;
  estado: 'EMITIDO' | 'ANULADO' | 'RECHAZADO' | 'PENDIENTE';
}

export interface SalesReceiptSummaryListResponseAdmin {
  receipts: SalesReceiptSummaryAdmin[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SalesReceiptsQueryAdmin {
  status?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO' | 'PENDIENTE';
  customerId?: string;
  receiptTypeId?: number;
  paymentMethodId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sedeId?: number;
  page?: number;
  limit?: number;
  _t?: number;
}

export interface RemateDetalleProductoDto {
  id_detalle_remate: number;
  id_remate: number;
  cod_remate: string;
  descripcion: string;
  pre_original: number;
  pre_remate: number;
}

export interface ProductoDetalleAdmin {
  id_prod_ref: string;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  igv: number;
  total: number;
  descuento_nombre: string | null;
  descuento_porcentaje: number | null;
  promocion_aplicada: boolean;
  descuento_promo_monto: number | null;
  descuento_promo_porcentaje: number | null;
  /** Presente si el ítem fue vendido desde un remate activo. Null = venta normal */
  remate: RemateDetalleProductoDto | null;
}

export interface PromocionDetalleAdmin {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  monto_descuento: number;
  descuento_nombre: string;
  descuento_porcentaje: number;
  productosIds?: (number | string)[];
  reglas?: {
    idRegla: number;
    tipoCondicion: string;
    valorCondicion: string;
  }[];
}

export interface ClienteDetalleAdmin {
  id_cliente: string;
  nombre: string;
  documento: string;
  tipo_documento: string;
  direccion: string;
  email: string;
  telefono: string;
  total_gastado_cliente: number;
  cantidad_compras: number;
}

export interface ResponsableDetalleAdmin {
  id: string;
  nombre: string;
  sede: number;
  nombreSede: string;
}

export interface HistorialItemAdmin {
  id_comprobante: number;
  numero_completo: string;
  fec_emision: string;
  total: number;
  estado: string;
  metodo_pago: string;
  responsable: string;
}

export interface SalesReceiptDetalleCompletoDto {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  fec_venc: string | null;
  estado: string;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;
  cliente: ClienteDetalleAdmin;
  productos: ProductoDetalleAdmin[];
  promocion: PromocionDetalleAdmin | null;
  responsable: ResponsableDetalleAdmin;
  historial_cliente: HistorialItemAdmin[];
  historial_pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface SalesReceiptWithHistoryDtoAdmin extends SalesReceiptDetalleCompletoDto {}

export interface SalesReceiptKpiDto {
  total_ventas: number;
  cantidad_ventas: number;
  total_boletas: number;
  total_facturas: number;
  cantidad_boletas: number;
  cantidad_facturas: number;
  semana_desde?: string;
  semana_hasta?: string;
}

export interface ItemVentaRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  codigo?: string;
  categoriaId?: number;
  /** Presente solo cuando el ítem proviene de un remate activo */
  id_detalle_remate?: number | null;
}

export interface RegistroVentaAdminRequest {
  customerId: string;
  receiptTypeId: number;
  saleTypeId: number;
  serie: string;
  subtotal: number;
  igv: number;
  isc?: number;
  total: number;
  descuento?: number;
  promotionId?: number | null;
  responsibleId: string;
  branchId: number;
  warehouseId?: number;
  paymentMethodId?: number;
  operationNumber?: string | null;
  esCreditoPendiente?: boolean;
  dueDate?: string;
  operationType?: string;
  currencyCode?: string;
  items: ItemVentaRequest[];
}

export interface RegistroVentaItemResponseAdmin {
  productId: string;
  productName: string;
  codigoProducto: string;
  quantity: number;
  unitPrice: number;
  unitValue: number;
  igv: number;
  tipoAfectacionIgv: number;
  total: number;
}

export interface RegistroVentaAdminResponse {
  idComprobante: number;
  idCliente: string;
  numeroCompleto: string;
  serie: string;
  numero: number;
  fecEmision: string;
  fecVenc?: string;
  tipoOperacion: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  estado: string;
  codMoneda: string;
  idTipoComprobante: number;
  idTipoVenta: number;
  idSedeRef: number;
  idResponsableRef: string;
  items: RegistroVentaItemResponseAdmin[];
}

export interface AnularVentaAdminRequest {
  receiptId: number;
  reason: string;
}

export interface AnularVentaAdminResponse {
  id_comprobante: number;
  estado: string;
  mensaje: string;
}

export interface TipoVentaAdmin {
  id: number;
  tipo: string;
  descripcion: string;
}

export interface TipoComprobanteAdmin {
  id: number;
  codSunat: string;
  descripcion: string;
  estado: boolean;
}

export interface MetodoPagoAdmin {
  id: number;
  codSunat: string;
  descripcion: string;
}

export interface ProductoStockAdmin {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  id_categoria: number;
  stock: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
  sede: string;
  id_sede: number;
}

export interface ProductoStockAdminResponse {
  data: ProductoStockAdmin[];
  pagination: {
    total_records: number;
    page: number;
    size: number;
    total_pages: number;
  };
}

export interface ProductoAutocompleteAdmin {
  id_producto: number;
  codigo: string;
  nombre: string;
  familia: string;
  id_categoria: number;
  stock: number;
  precio_unitario: number;
  precio_caja: number;
  precio_mayor: number;
  sede: string;
  id_sede: number;
}

export interface ProductoAutocompleteAdminResponse {
  data: ProductoAutocompleteAdmin[];
}

export interface ProductoUIAdmin {
  id: number;
  codigo: string;
  nombre: string;
  familia: string;
  categoriaId?: number;
  precioUnidad: number;
  precioCaja: number;
  precioMayorista: number;
  stock: number;
  sede: string;
  almacenes: Array<{ nombre: string; stock: number }>;
}

export interface CategoriaConStockAdmin {
  id_categoria: number;
  nombre: string;
}

export interface ClienteBusquedaAdminResponse {
  customerId: string;
  name: string;
  documentValue: string;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  invoiceType: string;
  status: string;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  displayName?: string;
}

export interface CrearClienteAdminRequest {
  documentTypeId: number;
  documentValue: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ActualizarClienteAdminRequest {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ClienteAdminResponse {
  customerId: string;
  name: string;
  documentValue: string;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  invoiceType: string;
  status: string;
  address?: string;
  email?: string;
  phone?: string;
  displayName?: string;
}

export interface TipoDocumentoAdmin {
  documentTypeId: number;
  description: string;
  sunatCode: string;
}

export interface ItemVentaUIAdmin {
  productId: number;
  codigo: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igvUnitario: number;
  categoriaId?: number;
  /** Solo presente si el ítem viene de un remate */
  idDetalleRemate?: number | null;
}

export interface PromocionAdmin {
  idPromocion: number;
  concepto: string;
  tipo: string;
  valor: number;
  activo: boolean | { type: 'Buffer'; data: number[] };
  descripcion?: string;
  reglas?: {
    idRegla: number;
    tipoCondicion: string;
    valorCondicion: string;
  }[];
  descuentosAplicados?: {
    idDescuento: number;
    monto: string;
  }[];
  productosIds?: number[];
}

export interface QuoteDetalleItem {
  id_prod_ref: number;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio: number;
}

export interface QuoteCliente {
  id_tipo_documento: number;
  valor_doc: string;
  razon_social?: string;
  nombre_cliente?: string;
  apellidos_cliente?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
}

export interface Quote {
  id_cotizacion: number;
  id_sede?: number;
  id_cliente: number;
  cliente?: QuoteCliente;
  detalles?: QuoteDetalleItem[];
}

export interface WhatsAppStatusResponse {
  ready: boolean;
  qr: string | null;
}

export interface SendNotificationResponse {
  message: string;
  sentTo: string;
}

export interface BancoAdmin {
  id_banco: number;
  nombre_banco: string;
}

export interface TipoServicioAdmin {
  id_servicio: number;
  id_banco: number;
  nombre_servicio: string;
  descripcion?: string;
}

export interface AuctionAutocompleteItemAdmin {
  id_detalle_remate: number;
  id_remate: number;
  cod_remate: string;
  id_producto: number;
  codigo_producto: string;
  nombre_producto: string;
  descripcion_remate: string;
  id_categoria: number;
  familia: string;
  pre_original: number;
  pre_remate: number;
  stock_remate: number;
}

export interface AuctionAutocompleteResponseAdmin {
  data: AuctionAutocompleteItemAdmin[];
}

/** Versión UI del ítem de remate listo para el carrito */
export interface RemateUIAdmin {
  idDetalleRemate: number;
  idRemate: number;
  codRemate: string;
  idProducto: number;
  preOriginal: number;
  preRemate: number;
  stockRemate: number;
  descripcionRemate: string;
}

export interface CarritoItemUIAdmin {
  tipo: 'PRODUCTO' | 'REMANTE';
  id: string | number; // id_producto o id_detalle_remate
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  precioVenta: number; // total parcial
  igvUnitario: number;
  subtotal: number;
  // Solo para remates
  remate?: RemateUIAdmin;
}
