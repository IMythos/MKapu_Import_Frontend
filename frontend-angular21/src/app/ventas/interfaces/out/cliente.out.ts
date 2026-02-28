export interface ClienteBusquedaResponse {
  customerId: string;
  name: string;
  documentValue: string;
  invoiceType: 'BOLETA' | 'FACTURA';
  status: boolean;
  documentTypeId?: number;
  documentTypeDescription?: string;
  documentTypeSunatCode?: string;
  address?: string;
  email?: string;
  phone?: string;
  displayName?: string;
}

// Alias: crear y obtener por ID devuelven el mismo shape completo
export interface ClienteResponse {
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

export interface ListarClientesResponse {
  customers: ClienteResponse[];
  total: number;
}

export interface TipoDocumento {
  documentTypeId: number;
  sunatCode: string;
  description: string;
}

export interface ClienteErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

