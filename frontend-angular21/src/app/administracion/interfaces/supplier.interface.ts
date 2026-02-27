// src/app/administracion/interfaces/supplier.interface.ts

export interface SupplierResponse {
  id_proveedor: number;
  razon_social: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
  estado: boolean;
}

export interface RegisterSupplierRequest {
  razon_social: string;
  ruc: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
}

export type CreateSupplierRequest = RegisterSupplierRequest;

export interface UpdateSupplierRequest {
  razon_social?: string;
  ruc?: string;
  contacto?: string;
  email?: string;
  telefono?: string;
  dir_fiscal?: string;
}

export interface ChangeSupplierStatusRequest {
  estado: boolean;
}

export interface SupplierListResponse {
  suppliers: SupplierResponse[];
  total: number;
}

export interface SupplierDeletedResponse {
  id_proveedor: number;
  message: string;
  deletedAt: Date;
}

export interface SupplierFilters {
  estado?: boolean;
  search?: string;
}
