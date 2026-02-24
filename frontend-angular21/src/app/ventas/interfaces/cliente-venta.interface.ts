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

export interface ClienteErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

export interface CrearClienteRequest {
  documentTypeId: number;
  documentValue: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface CrearClienteResponse {
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

export interface ActualizarClienteRequest {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ListarClientesResponse {
  customers: CrearClienteResponse[];
  total: number;
}

export interface TipoDocumento {
  documentTypeId: number;
  sunatCode: string;
  description: string;
}
