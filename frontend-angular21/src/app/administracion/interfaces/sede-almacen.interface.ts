export interface SedeAlmacenSummaryDto {
  id_sede: number;
  codigo: string;
  nombre: string;
}

export interface SedeAlmacenWarehouseDto {
  id_almacen: number;
  codigo: string;
  nombre?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  activo?: boolean;
}

export interface SedeAlmacenListItemDto {
  id_almacen: number;
  almacen?: SedeAlmacenWarehouseDto | null;
}

export interface SedeAlmacenListResponseDto {
  id_sede: number;
  sede?: SedeAlmacenSummaryDto;
  almacenes: SedeAlmacenListItemDto[];
  total: number;
}

export interface WarehouseSelectOption {
  value: number;
  label: string;
}

export interface AssignWarehouseToSedeRequestDto {
  id_sede: number;
  id_almacen: number;
}

export interface SedeAlmacenResponseDto {
  id_sede: number;
  id_almacen: number;
  sede?: SedeAlmacenSummaryDto;
  almacen?: SedeAlmacenWarehouseDto | null;
}
