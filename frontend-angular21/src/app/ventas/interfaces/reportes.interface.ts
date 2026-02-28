export interface GetSalesReportFilters {
  startDate: string; 
  endDate: string;   
  sedeId?: number;
  vendedorId?: number;
}

export interface SalesReportRow {
  comprobanteVentaId: number;
  serie: string;
  numero: string;
  fechaEmision: string; 
  tipoComprobanteDescripcion: string;
  clienteNombre: string;
  clienteDocumentoIdentidad: string;
  monedaCodigo: string;
  totalOperacion: number; 
  estadoActual: string;
  sedeNombre: string;
  vendedorNombreCompleto: string;
}
