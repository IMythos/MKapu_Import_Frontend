export type ReceiptStatus = 'EMITIDO' | 'ANULADO' | 'RECHAZADO';

export interface SalesReceiptsQuery {
  page?: number;
  limit?: number;
  status?: ReceiptStatus;
  customerId?: string;
  receiptTypeId?: number;
  paymentMethodId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sedeId?: number;
}

export interface SalesReceiptSummaryDto {
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
  estado: ReceiptStatus;
}

export interface SalesReceiptSummaryListResponse {
  receipts: SalesReceiptSummaryDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export type SalesReceiptListResponse = SalesReceiptSummaryListResponse;

export interface SalesReceiptProductoDto {
  id_prod_ref: number;
  cod_prod: string;
  descripcion: string;
  cantidad: number;
  precio_unit: number;
  igv: number;
  total: number;
}

export interface RecentPurchase {
  id_comprobante: number;
  numero_completo: string;
  fec_emision: string;
  total: number;
  estado: ReceiptStatus;
  metodo_pago: string;
  responsable: string;
}

export interface CustomerPurchaseStatistics {
  totalCompras: number;
  montoTotal: number;
  promedioCompra: number;
}

export interface CustomerPurchaseHistoryDto {
  id_cliente: number;
  nombre: string;
  documento: string;
  tipo_documento: string;
  direccion: string;
  email: string;
  telefono: string;
  total_gastado_cliente: number;
  cantidad_compras: number;
}

export interface SalesReceiptWithHistoryDto {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  estado: ReceiptStatus;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;
  cliente: CustomerPurchaseHistoryDto;
  productos: SalesReceiptProductoDto[];
  responsable: {
    id: string;
    nombre: string;
    sede: number;
    nombreSede: string;
  };
  historial_cliente: RecentPurchase[];
}

export interface SalesReceiptResponseDto {
  id_comprobante: number;
  numero_completo: string;
  serie: string;
  numero: number;
  tipo_comprobante: string;
  fec_emision: string;
  estado: ReceiptStatus;
  subtotal: number;
  igv: number;
  total: number;
  metodo_pago: string;
  productos: SalesReceiptProductoDto[];
}

export interface SalesReceiptAutocompleteItem {
  id_cliente: string;
  nombre: string;
  documento: string;
}

export interface SalesReceiptKpiDto {
  total_ventas:    number;
  cantidad_ventas: number;
  total_boletas:   number;
  total_facturas:  number;
  semana_desde:    string;
  semana_hasta:    string;
}
