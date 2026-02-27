export interface Headquarter {
  id?: number;           
  id_almacen?: number;   
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** DTO que envías para crear */
export interface CreateWarehouseDto {
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo?: boolean;
}

/** DTO para actualizar */
export interface UpdateWarehouseDto {
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo?: boolean;
}