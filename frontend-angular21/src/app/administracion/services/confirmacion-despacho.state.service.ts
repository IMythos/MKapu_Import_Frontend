import { Injectable, signal } from '@angular/core';

export interface ConfirmacionDespachoData {
  id_despacho: number;
  numeroComprobante: string;
  tipoComprobante: string;
  fechaEmision: string;
  clienteNombre: string;
  clienteDoc: string;
  clienteTipoDoc: string;
  clienteTelefono: string;
  clienteDireccion: string;
  sedeNombre: string;
  responsableNombre: string;
  direccionEntrega: string;
  tipoEntrega: 'tienda' | 'delivery';
  observacion: string | null;
  estado: string;
  subtotal: number;
  igv: number;
  descuento: number;
  total: number;
  metodoPago: string;
  esCopia?: boolean;
  productos: {
    id_producto: number;
    nombre: string;
    codigo: string;
    cantidad_solicitada: number;
    cantidad_despachada: number;
    precio_unit: number;
    total_item: number;
    estado: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionDespachoStateService {
  private _data = signal<ConfirmacionDespachoData | null>(null);

  set(data: ConfirmacionDespachoData): void { this._data.set(data); }
  get(): ConfirmacionDespachoData | null { return this._data(); }
  clear(): void { this._data.set(null); }
}