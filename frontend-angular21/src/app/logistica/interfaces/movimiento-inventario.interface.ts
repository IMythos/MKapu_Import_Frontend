export interface MovimientoInventario {
  id: number;
  tipoMovimiento: 'COMPRA' | 'VENTA' | 'TRANSFERENCIA' | 'AJUSTE' | string;
  fechaMovimiento: string | Date;
  motivo: string;
  documentoReferencia: string;
  almacenOrigenNombre: string;
  almacenDestinoNombre: string;
  sedeNombre: string; 
  usuario: string;
  detalles: DetalleMovimientoInventario[];
}

export interface DetalleMovimientoInventario {
  id: number;
  productoId?: number;
  codigo: string;
  productoNombre: string;
  cantidad: number;
  unidadMedida: string;
  tipoOperacionItem?: 'INGRESO' | 'SALIDA' | string;
}