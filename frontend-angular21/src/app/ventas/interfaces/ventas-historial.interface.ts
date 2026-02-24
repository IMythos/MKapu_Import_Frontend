/* frontend-angular21/src/app/ventas/interfaces/ventas-historial.interface.ts */

export type ReceiptStatus = 'EMITIDO' | 'ANULADO' | 'RECHAZADO';

// ✅ NUEVO: Para el listado resumido (enriquecido con TCP)
export interface SalesReceiptSummaryDto {
  idComprobante: number;
  numeroCompleto: string;
  serie: string;
  numero: number;
  tipoComprobante: string;
  fecEmision: string;
  clienteNombre: string;
  clienteDocumento: string;
  idResponsable: string | number;
  responsableNombre: string; // ← Enriquecido por TCP
  idSede: number;
  sedeNombre: string; // ← Enriquecido por TCP
  metodoPago: string;
  total: number;
  estado: ReceiptStatus;
}

export interface SalesReceiptSummaryListResponse {
  receipts: SalesReceiptSummaryDto[];
  total: number;
}

// ✅ EXISTENTE: Para detalle completo
export interface SalesReceiptItemResponseDto {
  productId: string;
  productName: string;
  codigoProducto?: string | number;
  quantity: number;
  unitPrice: number;
  unitValue?: number;
  igv: number;
  tipoAfectacionIgv?: number;
  total: number;
}

export interface SalesReceiptCustomerDto {
  id: string;
  documentTypeId: number;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  documentValue: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  status: boolean;
}

export interface SalesReceiptResponsableDto {
  id: number | string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
}

export interface SalesReceiptSedeDto {
  id: number;
  nombre: string;
}

export interface SalesReceiptTipoComprobanteDto {
  id: number;
  codigoSunat: string;
  descripcion: string;
}

export interface SalesReceiptTipoVentaDto {
  id: number;
  tipo: string;
  descripcion: string;
}

export interface SalesReceiptPaymentMethodDto {
  id: number;
  codigoSunat: string;
  descripcion: string;
}

export interface SalesReceiptCurrencyDto {
  codigo: string;
  descripcion: string;
}

export interface SalesReceiptResponseDto {
  idComprobante: number;
  numeroCompleto: string;
  serie: string;
  numero: number;
  fecEmision: string;
  fecVenc: string;
  tipoOperacion: string;
  subtotal: number;
  igv: number;
  isc: number;
  total: number;
  estado: ReceiptStatus;
  cliente: SalesReceiptCustomerDto;
  responsable: SalesReceiptResponsableDto;
  tipoComprobante: SalesReceiptTipoComprobanteDto;
  tipoVenta: SalesReceiptTipoVentaDto;
  sede: SalesReceiptSedeDto;
  metodoPago?: SalesReceiptPaymentMethodDto;
  moneda: SalesReceiptCurrencyDto;
  items: SalesReceiptItemResponseDto[];
}

// ✅ NUEVO: Historial de compras del cliente
export interface CustomerPurchaseStatistics {
  totalCompras: number;
  totalEmitidos: number;
  totalAnulados: number;
  montoTotal: number;
  montoEmitido: number;
  promedioCompra: number;
}

export interface RecentPurchase {
  idComprobante: number;
  numeroCompleto: string;
  tipoComprobante: string;
  fecha: string;
  sedeNombre: string;
  responsableNombre: string;
  total: number;
  estado: ReceiptStatus;
}

export interface CustomerPurchaseHistoryDto {
  customer: {
    id: string;
    nombre: string;
    documento: string;
    tipoDocumento: string;
  };
  statistics: CustomerPurchaseStatistics;
  recentPurchases: RecentPurchase[];
}

// ✅ NUEVO: Detalle + historial combinado
export interface SalesReceiptWithHistoryDto {
  receipt: SalesReceiptResponseDto;
  customerHistory?: CustomerPurchaseHistoryDto;
}

// Query para filtros
export interface SalesReceiptsQuery {
  page?: number;
  limit?: number;
  status?: ReceiptStatus;
  customerId?: string;
  receiptTypeId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sedeId?: number; // ← Agregado
}

// Respuestas antiguas (mantener compatibilidad)
export interface SalesReceiptListResponse {
  receipts: SalesReceiptResponseDto[];
  total: number;
}

export interface CustomerByIdResponse {
  customerId: string;
  documentTypeId: number;
  documentTypeDescription: string;
  documentTypeSunatCode: string;
  documentValue: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  status: boolean;
  displayName: string;
  invoiceType: string;
}

export interface AdminUserFullResponse {
  usuario: {
    id_usuario: number;
    usu_nom: string;
    ape_mat: string;
    ape_pat: string;
    nombreCompleto: string;
    dni: string;
    email: string;
    celular: string;
    direccion: string;
    genero: string;
    fec_nac: string;
    activo: boolean;
    id_sede: number;
    sedeNombre: string;
    rolNombre: string;
  };
  cuenta_usuario: {
    id_cuenta: number;
    nom_usu: string;
    email_emp: string;
    activo: boolean;
    ultimo_acceso: string;
    rolNombre: string;
  };
}



// ─── AUTOCOMPLETE ─────────────────────────────────────────────────────────────
export interface SalesReceiptAutocompleteItem {
  clienteId:       number;
  documento:       string;
  nombres:         string | null;
  apellidos:       string | null;
  razonSocial:     string | null;
  tipoComprobante: string;
  ultimaCompra:    string;
  totalCompras:    number;
}

// ─── ANULACIÓN / ELIMINACIÓN ─────────────────────────────────────────────────
export interface SalesReceiptDeletedResponseDto {
  receiptId:  number;
  message:    string;
  deletedAt:  string | Date;
}
