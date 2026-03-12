/* =========================================
   DISPATCH DETAIL STATUS — inline, sin imports externos
========================================= */
export type DispatchDetailStatus =
  | 'PENDIENTE'
  | 'PREPARADO'
  | 'DESPACHADO'
  | 'FALTANTE';

/* =========================================
   DISPATCH STATUS — alineado al backend
   (DispatchStatus enum en dispatch-domain-entity.ts)
========================================= */
export type DispatchStatus =
  | 'GENERADO'
  | 'EN_PREPARACION'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'CANCELADO';

/* =========================================
   DETALLE DE DESPACHO — alineado a DispatchDetailOutputDto
========================================= */
export interface DispatchDetail {
  id_detalle_despacho: number | null;
  id_producto: number;
  cantidad_solicitada: number;
  cantidad_despachada: number;
  estado: DispatchDetailStatus;
  tieneFaltante: boolean;
}

/* =========================================
   ENTIDAD PRINCIPAL — alineada a DispatchOutputDto
========================================= */
export interface Dispatch {
  id_despacho: number;
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

/* =========================================
   RESPONSE — backend devuelve array directo
========================================= */
export interface DispatchListResponse {
  dispatches: Dispatch[];
}

/* =========================================
   REQUEST TYPES — alineados a CreateDispatchDto
========================================= */
export interface CreateDispatchDetailRequest {
  id_producto: number;
  cantidad_solicitada: number;
}

export interface CreateDispatchRequest {
  id_venta_ref: number;
  id_usuario_ref: string;
  id_almacen_origen: number;
  fecha_programada?: Date;
  direccion_entrega: string;
  observacion?: string;
  detalles: CreateDispatchDetailRequest[];
}

export type UpdateDispatchRequest = Partial<Omit<Dispatch, 'id_despacho'>>;

/* =========================================
   DTOs para acciones de estado
========================================= */
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