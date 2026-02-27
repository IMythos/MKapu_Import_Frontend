/* =========================================
   DISPATCH STATUS (alineado a backend)
========================================= */
export type DispatchStatus =
  | 'PENDIENTE'
  | 'ENVIADO'
  | 'ENTREGADO'
  | 'CANCELADO';


/* =========================================
   ENTIDAD PRINCIPAL
========================================= */
export interface Dispatch {
  id_despacho: number;
  id_venta_ref: number;
  tipo_envio: string;
  estado: DispatchStatus;
  fecha_envio: string; // ISO string desde backend
}


/* =========================================
   RESPUESTA LISTADO BACKEND
========================================= */
export interface DispatchListResponse {
  dispatches: Dispatch[];
  total: number;
  page: number;
  pageSize: number;
}


/* =========================================
   REQUEST TYPES
========================================= */

export type CreateDispatchRequest = Omit<
  Dispatch,
  'estado'
>;

export type UpdateDispatchRequest = Partial<
  Omit<Dispatch, 'id_despacho'>
>;