"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// COMPROBANTES
// ─────────────────────────────────────────────────────────────────────────────
exports.__esModule = true;
exports.TIPOS_COMPROBANTE_ADMIN = exports.METODOS_PAGO_ADMIN = exports.OPERATION_TYPE_VENTA_INTERNA = exports.CURRENCY_PEN_ADMIN = exports.IGV_RATE_ADMIN = void 0;
// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────
exports.IGV_RATE_ADMIN = 0.18;
exports.CURRENCY_PEN_ADMIN = 'PEN';
exports.OPERATION_TYPE_VENTA_INTERNA = '0101';
exports.METODOS_PAGO_ADMIN = [
    { id: 1, description: 'Efectivo' },
    { id: 2, description: 'Yape / Plin' },
    { id: 3, description: 'Tarjeta' },
];
exports.TIPOS_COMPROBANTE_ADMIN = [
    { id: 2, description: 'Boleta', serie: 'B001' },
    { id: 1, description: 'Factura', serie: 'F001' },
];
