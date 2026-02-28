export interface BuscarClienteParams {
  documento: string;
  tipoComprobante?: number;
}

export interface CrearClienteRequest {
  documentTypeId: number;
  documentValue: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ActualizarClienteRequest {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface ListarClientesParams {
  page?: number;
  size?: number;
  search?: string;
}

