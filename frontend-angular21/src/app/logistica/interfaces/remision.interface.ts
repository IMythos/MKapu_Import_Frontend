export enum RemissionType { REMITENTE = 0, TRANSPORTISTA = 1 }
export enum TransportMode { PUBLICO = 0, PRIVADO = 1 }

// DTO de entrada (POST)
export interface CreateRemissionDto {
  id_comprobante_ref: number;
  id_almacen_origen: number;
  id_sede_origen: string;
  id_usuario: number;
  tipo_guia: RemissionType;
  modalidad: TransportMode;
  fecha_inicio_traslado: string;
  motivo_traslado: string;
  unidad_peso: string;
  peso_bruto_total: number;
  datos_traslado: any;
  datos_transporte: any;
  items: RemissionItemDto[];
}

export interface RemissionItemDto {
  id_producto: number;
  cod_prod: string;
  cantidad: number;
  peso_total: number;
  peso_unitario: number;
}

// DTOs de salida (GET del Backend)

export interface RemissionResponse {
  id_guia: string;
  serie: string;
  numero: number;
  estado: number | string;
  fecha_emision: string | Date;
  id_comprobante_ref?: number;
  tipo_guia: RemissionType;
  modalidad: TransportMode;
  fecha_inicio: string | Date;
  motivo_traslado: string;
  unidad_peso: string;
  peso_total: number;
  cantidad: number; 
  items?: RemissionItemDto[]; 
}

export interface RemisionPaginatedResponse {
  data: RemissionResponse[];
  total: number;
}
export interface RemissionSummaryResponse {
  totalMes: number;
  enTransito: number;
  entregadas: number;
  observadas: number;
}