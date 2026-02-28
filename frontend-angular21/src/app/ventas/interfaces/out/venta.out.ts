// src/app/ventas/interfaces/out/venta.out.ts

import { ReceiptStatus } from '../shared/catalogos';

// ─── Registro de venta ────────────────────────────────────────────
export interface ItemVentaRequest {
  productId:   string;
  quantity:    number;
  unitPrice:   number;
  description: string;
  total:       number;
  igv?:        number;
}

export interface RegistroVentaRequest {
  customerId:       string;
  saleTypeId:       number;
  receiptTypeId:    number;
  serie:            string;
  dueDate:          string;
  operationType:    string;
  subtotal:         number;
  igv:              number;
  isc:              number;
  total:            number;
  currencyCode:     string;
  responsibleId:    string;
  branchId:         number;
  paymentMethodId:  number;
  operationNumber:  string | null;
  items:            ItemVentaRequest[];
}

// ─── Filtros historial comprobantes ──────────────────────────────
export interface SalesReceiptsQuery {
  page?:            number;
  limit?:           number;
  status?:          ReceiptStatus;
  customerId?:      string;
  receiptTypeId?:   number;
  paymentMethodId?: number;
  dateFrom?:        string;
  dateTo?:          string;
  search?:          string;
  sedeId?:          number;
}

// ─── Reportes ─────────────────────────────────────────────────────
export interface SalesBookParams {
  year:  number;
  month: number;
}

export interface SalesDashboardParams {
  startDate: string;
  endDate:   string;
}

export interface CommissionsParams {
  from: string;
  to:   string;
}
