// src/app/ventas/interfaces/in/venta.in.ts

import { ReceiptStatus } from '../shared/catalogos';



// ─── Crear venta ──────────────────────────────────────────────────
export interface RegistroVentaResponse {
  success: boolean;
  message: string;
  data: {
    receiptId:     string;
    receiptNumber: string;
    serie:         string;
    total:         number;
    createdAt:     string;
  };
}

// ─── Listado historial ────────────────────────────────────────────
export interface SalesReceiptSummaryDto {
  idComprobante:     number;
  numeroCompleto:    string;
  serie:             string;
  numero:            number;
  tipoComprobante:   string;
  fecEmision:        string;
  clienteNombre:     string;
  clienteDocumento:  string;
  idResponsable:     string;
  responsableNombre: string;
  idSede:            number;
  sedeNombre:        string;
  metodoPago:        string;
  total:             number;
  estado:            ReceiptStatus;
}

export interface SalesReceiptSummaryListResponse {
  receipts:    SalesReceiptSummaryDto[];
  total:       number;
  page:        number;
  limit:       number;
  total_pages: number;
}

// Alias para compatibilidad con código existente
export type SalesReceiptListResponse = SalesReceiptSummaryListResponse;

// ─── Detalle de comprobante ───────────────────────────────────────
export interface SalesReceiptProductoDto {
  id_prod_ref: number;
  cod_prod:    string;
  descripcion: string;
  cantidad:    number;
  precio_unit: number;
  igv:         number;
  total:       number;
}

export interface CustomerPurchaseHistoryDto {
  id_cliente:            number;
  nombre:                string;
  documento:             string;
  tipo_documento:        string;
  direccion:             string;
  email:                 string;
  telefono:              string;
  total_gastado_cliente: number;
  cantidad_compras:      number;
}

export interface RecentPurchase {
  id_comprobante:  number;
  numero_completo: string;
  fec_emision:     string;
  total:           number;
  estado:          ReceiptStatus;
  metodo_pago:     string;
  responsable:     string;
}

export interface SalesReceiptWithHistoryDto {
  id_comprobante:   number;
  numero_completo:  string;
  serie:            string;
  numero:           number;
  tipo_comprobante: string;
  fec_emision:      string;
  estado:           ReceiptStatus;
  subtotal:         number;
  igv:              number;
  total:            number;
  metodo_pago:      string;
  cliente:          CustomerPurchaseHistoryDto;
  productos:        SalesReceiptProductoDto[];
  responsable: {
    id:         string;
    nombre:     string;
    sede:       number;
    nombreSede: string;
  };
  historial_cliente:    RecentPurchase[];
  historial_pagination: {
    total:       number;
    page:        number;
    limit:       number;
    total_pages: number;
  };
}

// ─── KPI Semanal ──────────────────────────────────────────────────
export interface SalesReceiptKpiDto {
  total_ventas:    number;
  cantidad_ventas: number;
  total_boletas:   number;
  total_facturas:  number;
  semana_desde:    string;
  semana_hasta:    string;
}

// ─── Historial paginado del cliente (endpoint dedicado) ──────────
export interface ClienteHistorialResponse {
  data:       RecentPurchase[];
  pagination: {
    total:       number;
    page:        number;
    limit:       number;
    total_pages: number;
  };
}
