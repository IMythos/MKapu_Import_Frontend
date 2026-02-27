export type ReceiptStatus = 'EMITIDO' | 'ANULADO' | 'RECHAZADO';


export interface MetodoPago {
  id:          number;
  code:        string;
  description: string;
}

export const METODOS_PAGO: MetodoPago[] = [
  { id: 1, code: '008', description: 'EFECTIVO' },
  { id: 2, code: '005', description: 'TARJETA DE DÉBITO' },
  { id: 3, code: '006', description: 'TARJETA DE CRÉDITO' },
  { id: 4, code: '003', description: 'TRANSFERENCIA DE FONDOS (yape/plin)' },
  { id: 5, code: '001', description: 'DEPÓSITO EN CUENTA' },
];

export const RECEIPT_TYPES = {
  BOLETA:   1,
  FACTURA:  2,
} as const;

// ─── Constantes de operación ──────────────────────────────────────
export const OPERATION_TYPE_VENTA_INTERNA = '0101';
export const CURRENCY_PEN                 = 'PEN';
export const IGV_RATE                     = 0.18;
