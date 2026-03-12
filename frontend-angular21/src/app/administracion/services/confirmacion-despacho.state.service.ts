import { Injectable, signal } from '@angular/core';

export interface ConfirmacionDespachoData {
  id_despacho: number;
  numeroComprobante: string;
  fechaEmision: string;
  clienteNombre: string;
  clienteDoc: string;
  clienteTelefono: string;
  sedeNombre: string;
  direccionEntrega: string;
  observacion: string | null;
  estado: string;
  productos: {
    id_producto: number;
    nombre: string;
    codigo: string;
    cantidad_solicitada: number;
    cantidad_despachada: number;
    estado: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ConfirmacionDespachoStateService {
  private _data = signal<ConfirmacionDespachoData | null>(null);

  set(data: ConfirmacionDespachoData): void {
    this._data.set(data);
  }

  get(): ConfirmacionDespachoData | null {
    return this._data();
  }

  clear(): void {
    this._data.set(null);
  }
}