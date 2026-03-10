/**
 * ============================================================
 * ENUMS Y TIPOS DE ESTADO
 * ============================================================
 */

/** Estado individual de cada item dentro de un despacho */
export type DispatchDetailStatus =
  | 'PENDIENTE'
  | 'PREPARADO'
  | 'DESPACHADO'
  | 'FALTANTE';

/** Estado global del proceso de despacho (Sincronizado con Backend) */
export type DispatchStatus =
  | 'GENERADO'
  | 'EN_PREPARACION'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'CANCELADO';

/**
 * ============================================================
 * ENTIDADES PRINCIPALES (OUTPUT DTOs)
 * ============================================================
 */

/** Detalle de producto específico en un despacho */
export interface DispatchDetail {
  id_detalle_despacho: number | null;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  estado: DispatchDetailStatus;
  tieneFaltante: boolean;
}

/** Entidad principal de Despacho */
export interface Dispatch {
  id_despacho: number ;
  id_venta_ref: number;
  id_usuario_ref: string;
  id_almacen_origen: number;
  fecha_creacion: Date;
  fecha_programada: Date | null;
  fecha_salida: Date | null;
  fecha_entrega: Date | null;
  direccion_entrega: string;
  observacion: string | null;
  estado: DispatchStatus;
  tieneFaltantes: boolean;
  estaActivo: boolean;
  detalles: DispatchDetail[];
}

/** Respuesta estándar para listados de despachos */
export interface DispatchListResponse {
  dispatches: Dispatch[];
}

/**
 * ============================================================
 * ACCIONES Y PETICIONES (INPUT DTOs)
 * ============================================================
 */

/** Payload para crear un nuevo detalle de despacho */
export interface CreateDispatchDetailRequest {
  id_producto: number;
  cantidad_solicitada: number;
}

/** Payload para la creación de un despacho completo */
export interface CreateDispatchRequest {
  id_venta_ref: number;
  id_usuario_ref: string;
  id_almacen_origen: number;
  direccion_entrega: string;
  fecha_programada?: Date;
  observacion?: string;
  detalles: CreateDispatchDetailRequest[];
}

/** Payload para actualización parcial de un despacho */
export type UpdateDispatchRequest = Partial<Omit<Dispatch, 'id_despacho'>>;

/**
 * ============================================================
 * DTOS PARA FLUJOS DE ESTADO (ACTIONS)
 * ============================================================
 */

export interface IniciarTransitoRequest {
  fecha_salida: Date;
}

export interface ConfirmarEntregaRequest {
  fecha_entrega: Date;
}

export interface CancelarDespachoRequest {
  motivo?: string;
}

export interface MarcarDetallePreparadoRequest {
  cantidad_despachada: number;
}