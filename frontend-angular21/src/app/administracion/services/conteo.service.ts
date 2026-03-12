import { Injectable } from '@angular/core';

/* 🔹 NUEVA INTERFAZ PARA PRODUCTOS */
export interface ProductoConteoDetalle {
  codigo: string;
  producto: string;
  categoria: string;
  stockSistema: number;
  conteoReal: number;
}

export interface ConteoInventario {
  id: number;
  fecha: string;
  detalle: string;
  estado: string;
  familia: string;

  /* 🔹 OPCIONAL para no romper tus mocks */
  productos?: ProductoConteoDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class ConteoService {

  private conteos: ConteoInventario[] = [
    {
      id: 1,
      fecha: '08/02/2026',
      detalle: 'Conteo mensual licuadoras',
      estado: 'Inicio',
      familia: 'Licuadoras'
    },
    {
      id: 2,
      fecha: '07/02/2026',
      detalle: 'Revisión anual freidoras',
      estado: 'Finalizado',
      familia: 'Freidoras'
    },
    {
      id: 3,
      fecha: '06/02/2026',
      detalle: 'Conteo REFRIS - Sede Norte',
      estado: 'Anulado',
      familia: 'Refris'
    },
    {
      id: 4,
      fecha: '05/02/2026',
      detalle: 'Stock Cocinas industriales',
      estado: 'Inicio',
      familia: 'Cocinas'
    },
    {
      id: 5,
      fecha: '04/02/2026',
      detalle: 'Inventario licuadoras portátiles',
      estado: 'Finalizado',
      familia: 'Licuadoras'
    }
  ];

  /* ================= GETS ================= */

  getConteos() {
    return this.conteos;
  }

  getConteoById(id: number) {
    return this.conteos.find(c => c.id === id);
  }

  /* 🔥 NUEVO: Obtener cantidad de productos */
  getCantidadProductos(id: number): number {
    const conteo = this.getConteoById(id);
    return conteo?.productos?.length || 0;
  }

  /* ================= CREAR ================= */

  crearConteo(nuevo: Omit<ConteoInventario, 'id'>) {

    const nuevoId =
      this.conteos.length > 0
        ? Math.max(...this.conteos.map(c => c.id)) + 1
        : 1;

    const conteo: ConteoInventario = {
      id: nuevoId,
      ...nuevo
    };

    this.conteos.unshift(conteo);
  }

}
