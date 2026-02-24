export interface ItemVenta {
  productId: string;
  quantity: number;
  unitPrice: number;
  description: string;
  total: number;
  igv?: number;
}

export interface RegistroVentaRequest {
  customerId:      string;
  saleTypeId:      number;
  receiptTypeId:   number;
  serie:           string;   // ✅ AGREGAR — ej: 'B001' o 'F001'
  dueDate:         string;
  operationType:   string;
  subtotal:        number;
  igv:             number;
  isc:             number;
  total:           number;
  currencyCode:    string;
  responsibleId:   string;
  branchId:        number;
  paymentMethodId: number;
  operationNumber: string | null;
  items:           ItemVenta[];
}


export interface RegistroVentaResponse {
  success: boolean;
  message: string;
  data: {
    receiptId: string;
    receiptNumber: string;
    serie: string;
    total: number;
    createdAt: string;
  };
}

export interface MetodoPago {
  id: number;
  code: string;
  description: string;
}

export const METODOS_PAGO: MetodoPago[] = [
  { id: 1, code: '008', description: 'EFECTIVO' },
  { id: 2, code: '005', description: 'TARJETA DE DÉBITO' },
  { id: 3, code: '006', description: 'TARJETA DE CRÉDITO' },
  { id: 4, code: '003', description: 'TRANSFERENCIA DE FONDOS (yape/plin)' },
  { id: 5, code: '001', description: 'DEPÓSITO EN CUENTA' }
];

export const OPERATION_TYPE_VENTA_INTERNA = '0101';
export const CURRENCY_PEN = 'PEN';
export const IGV_RATE = 0.18;
