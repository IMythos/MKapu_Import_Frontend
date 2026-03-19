export enum RemissionType { REMITENTE = 0, TRANSPORTISTA = 1 }
export enum TransportMode { PUBLICO = 0, PRIVADO = 1 }

export interface CreateRemissionDto {
  id_comprobante_ref: number;
  id_almacen_origen: number;
  id_sede_origen: string;   // NestJS exige este nombre como string
  id_usuario: number;       // NestJS exige este campo como número
  tipo_guia: number;        // NestJS exige número (0 o 1)
  modalidad: number;        // NestJS exige número (0 o 1)
  fecha_inicio_traslado: string; // NestJS exige este nombre
  motivo_traslado: string;
  peso_bruto_total: number; // NestJS exige este nombre
  unidad_peso: string;
  
  // Campos opcionales que tu backend mapeará internamente
  descripcion?: string;
  observaciones?: string;
  cantidad?: number; 
  razon_social?: string; 
  
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
  descripcion: string;
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