// ─────────────────────────────────────────────────────────────────────────────
// COMPROBANTES
// ─────────────────────────────────────────────────────────────────────────────

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
  estado: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
}

export interface SalesReceiptSummaryListResponseAdmin {
  receipts: SalesReceiptSummaryAdmin[]; // ← era 'data', ahora es 'receipts'
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SalesReceiptsQueryAdmin {
  status?: 'EMITIDO' | 'ANULADO' | 'RECHAZADO';
  customerId?: string;
  receiptTypeId?: number;
  paymentMethodId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sedeId?: number;
  page?: number;
  limit?: number;
  _t?: number; // ← anti-caché
}


// ─────────────────────────────────────────────────────────────────────────────
// DETALLE COMPROBANTE
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductoDetalleAdmin {
  id_prod_ref: string;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  igv: number;
  total: number;
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
  serie: string;
  numero: number;
  fec_emision: string;
  total: number;
  estado: string;
  id_responsable: string;
  metodo_pago: string;
}

export interface SalesReceiptWithHistoryDtoAdmin {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  fec_venc: string | null;
  subtotal: number;
  igv: number;
  total: number;
  estado: string;
  metodo_pago: string;
  cliente: ClienteDetalleAdmin;
  productos: ProductoDetalleAdmin[];
  responsable: ResponsableDetalleAdmin;
  historial_cliente: HistorialItemAdmin[];
  historial_pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────────────────────────────────────

export interface SalesReceiptKpiDto {
  total_ventas: number;
  cantidad_ventas: number;
  total_boletas: number;
  total_facturas: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRO DE VENTA — Body y Response alineados con backend real
// ─────────────────────────────────────────────────────────────────────────────

export interface ItemVentaAdminRequest {
  id_prod_ref: number;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  pre_uni: number;
  igv: number;
}

export interface RegistroVentaAdminRequest {
  customerId: string;
  saleTypeId: number;
  serie: string;
  receiptTypeId: number;
  dueDate: string;
  operationType: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  currencyCode: string;
  responsibleId: string;
  branchId: number;
  paymentMethodId: number;
  operationNumber: string | null;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    description: string;
    total: number;
  }[];
}

export interface RegistroVentaAdminResponse {
  numero_completo: string;
  fec_emision: string;
  total: number;
  serie: string;
  numero: number;
  id_comprobante: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANULAR VENTA
// ─────────────────────────────────────────────────────────────────────────────

export interface AnularVentaAdminRequest {
  receiptId: number;
  reason: string;
}

export interface AnularVentaAdminResponse {
  id_comprobante: number;
  estado: string;
  mensaje: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEDES
// ─────────────────────────────────────────────────────────────────────────────

export interface SedeAdmin {
  id_sede: number;
  nombre: string;
  direccion?: string;
  activo: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS CON STOCK
// ─────────────────────────────────────────────────────────────────────────────

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
  id_categoria: number;
  stock: number;
  precioUnidad: number;
  precioCaja: number;
  precioMayorista: number;
  sede: string;
  id_sede: number;
}

export interface CategoriaConStockAdmin {
  id_categoria: number;
  nombre: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────────────────────────────────────

export interface ClienteBusquedaAdminResponse {
  customerId: string;
  name: string;
  documentValue: string;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  invoiceType: 'BOLETA' | 'FACTURA';
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

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS DEL CARRITO (uso interno UI)
// ─────────────────────────────────────────────────────────────────────────────

export interface ItemVentaUIAdmin {
  productId: number;
  codigo: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igvUnitario: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

export const IGV_RATE_ADMIN = 0.18;
export const CURRENCY_PEN_ADMIN = 'PEN';
export const OPERATION_TYPE_VENTA_INTERNA = '0101';

export const METODOS_PAGO_ADMIN = [
  { id: 1, description: 'Efectivo' },
  { id: 2, description: 'Yape / Plin' },
  { id: 3, description: 'Tarjeta' },
] as const;

export const TIPOS_COMPROBANTE_ADMIN = [
  { id: 2, description: 'Boleta', serie: 'B001' },
  { id: 1, description: 'Factura', serie: 'F001' },
] as const;
