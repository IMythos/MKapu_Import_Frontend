import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Promocion {
  id_promocion: string;
  codigo: string;
  descripcion: string;
  tipo_descuento: 'PORCENTAJE' | 'MONTO_FIJO';
  valor_descuento: number; // % o monto fijo
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: boolean;
  tipo_comprobante?: '01' | '03' | 'AMBOS'; // null = todos
  monto_minimo?: number; // Monto mínimo de compra
  uso_maximo?: number; // null = ilimitado
  usos_actuales: number;
  categorias_aplicables?: string[]; // null = todas
  clientes_aplicables?: string[]; // null = todos
  sedes_aplicables?: string[]; // null = todas
  dias_aplicables?: number[]; // 0=domingo, 6=sábado, null = todos
  hora_inicio?: string; // "09:00"
  hora_fin?: string; // "18:00"
}

export interface PromocionAplicada {
  id_promocion: string;
  codigo: string;
  descripcion: string;
  descuento_calculado: number;
  id_comprobante?: string;
  fecha_aplicacion: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PromocionesService {
  private promocionesSubject = new BehaviorSubject<Promocion[]>([]);
  public promociones$: Observable<Promocion[]> = this.promocionesSubject.asObservable();

  private promocionesAplicadasSubject = new BehaviorSubject<PromocionAplicada[]>([]);
  public promocionesAplicadas$: Observable<PromocionAplicada[]> = 
    this.promocionesAplicadasSubject.asObservable();

  constructor() {
    this.inicializarPromociones();
  }

  private inicializarPromociones(): void {
    const promocionesIniciales: Promocion[] = [
      {
        id_promocion: 'PROMO-001',
        codigo: 'VERANO2026',
        descripcion: 'Descuento de Verano 15%',
        tipo_descuento: 'PORCENTAJE',
        valor_descuento: 15,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-03-31'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 500,
        uso_maximo: undefined,
        usos_actuales: 45,
      },
      {
        id_promocion: 'PROMO-002',
        codigo: 'CLIENTE50',
        descripcion: 'Descuento S/. 50 en compras mayores a S/. 1000',
        tipo_descuento: 'MONTO_FIJO',
        valor_descuento: 50,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 1000,
        uso_maximo: undefined,
        usos_actuales: 128,
      },
      {
        id_promocion: 'PROMO-003',
        codigo: 'FINDE20',
        descripcion: '20% OFF Fines de Semana',
        tipo_descuento: 'PORCENTAJE',
        valor_descuento: 20,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 300,
        uso_maximo: undefined,
        usos_actuales: 89,
        dias_aplicables: [0, 6], // Domingo y Sábado
      },
      {
        id_promocion: 'PROMO-004',
        codigo: 'ELECTRODOM100',
        descripcion: 'S/. 100 OFF en Electrodomésticos',
        tipo_descuento: 'MONTO_FIJO',
        valor_descuento: 100,
        fecha_inicio: new Date('2026-01-10'),
        fecha_fin: new Date('2026-02-28'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 1500,
        uso_maximo: 200,
        usos_actuales: 67,
      },
      {
        id_promocion: 'PROMO-005',
        codigo: 'PRIMERA10',
        descripcion: '10% Primera Compra',
        tipo_descuento: 'PORCENTAJE',
        valor_descuento: 10,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 200,
        uso_maximo: undefined,
        usos_actuales: 234,
      },
      {
        id_promocion: 'PROMO-006',
        codigo: 'HAPPYHOUR',
        descripcion: 'Happy Hour 25% OFF (14:00-18:00)',
        tipo_descuento: 'PORCENTAJE',
        valor_descuento: 25,
        fecha_inicio: new Date('2026-01-01'),
        fecha_fin: new Date('2026-12-31'),
        estado: true,
        tipo_comprobante: 'AMBOS',
        monto_minimo: 400,
        uso_maximo: undefined,
        usos_actuales: 156,
        hora_inicio: '14:00',
        hora_fin: '18:00',
      },
    ];

    this.promocionesSubject.next(promocionesIniciales);
  }

  getPromociones(): Promocion[] {
    return this.promocionesSubject.value;
  }

  getPromocionesActivas(): Promocion[] {
    const ahora = new Date();
    return this.promocionesSubject.value.filter(
      (p) =>
        p.estado &&
        p.fecha_inicio <= ahora &&
        p.fecha_fin >= ahora &&
        (p.uso_maximo === null || p.uso_maximo === undefined || p.usos_actuales < p.uso_maximo)
    );
  }

  buscarPorCodigo(codigo: string): Promocion | null {
    const codigoUpper = codigo.trim().toUpperCase();
    return this.promocionesSubject.value.find((p) => p.codigo.toUpperCase() === codigoUpper) || null;
  }

  validarPromocion(
    codigo: string,
    opciones: {
      subtotal: number;
      tipoComprobante: '01' | '03';
      idCliente?: string;
      idSede?: string;
      fecha?: Date;
    }
  ): { valida: boolean; mensaje: string; promocion?: Promocion } {
    const promocion = this.buscarPorCodigo(codigo);

    if (!promocion) {
      return { valida: false, mensaje: 'Código de promoción no existe' };
    }

    if (!promocion.estado) {
      return { valida: false, mensaje: 'Promoción no está activa' };
    }

    const ahora = opciones.fecha || new Date();

    // Validar fechas
    if (ahora < promocion.fecha_inicio || ahora > promocion.fecha_fin) {
      return { valida: false, mensaje: 'Promoción fuera del período válido' };
    }

    // Validar uso máximo
    if (promocion.uso_maximo && promocion.usos_actuales >= promocion.uso_maximo) {
      return { valida: false, mensaje: 'Promoción ha alcanzado el límite de usos' };
    }

    // Validar monto mínimo
    if (promocion.monto_minimo && opciones.subtotal < promocion.monto_minimo) {
      return {
        valida: false,
        mensaje: `Monto mínimo requerido: S/. ${promocion.monto_minimo.toFixed(2)}`,
      };
    }

    // Validar tipo de comprobante
    if (
      promocion.tipo_comprobante &&
      promocion.tipo_comprobante !== 'AMBOS' &&
      promocion.tipo_comprobante !== opciones.tipoComprobante
    ) {
      const tipoRequerido = promocion.tipo_comprobante === '01' ? 'Facturas' : 'Boletas';
      return { valida: false, mensaje: `Promoción válida solo para ${tipoRequerido}` };
    }

    // Validar día de la semana
    if (promocion.dias_aplicables && promocion.dias_aplicables.length > 0) {
      const diaSemana = ahora.getDay();
      if (!promocion.dias_aplicables.includes(diaSemana)) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diasValidos = promocion.dias_aplicables.map((d) => dias[d]).join(', ');
        return { valida: false, mensaje: `Promoción válida solo: ${diasValidos}` };
      }
    }

    // Validar horario
    if (promocion.hora_inicio && promocion.hora_fin) {
      const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
      if (horaActual < promocion.hora_inicio || horaActual > promocion.hora_fin) {
        return {
          valida: false,
          mensaje: `Promoción válida de ${promocion.hora_inicio} a ${promocion.hora_fin}`,
        };
      }
    }

    // Validar sede
    if (promocion.sedes_aplicables && promocion.sedes_aplicables.length > 0 && opciones.idSede) {
      if (!promocion.sedes_aplicables.includes(opciones.idSede)) {
        return { valida: false, mensaje: 'Promoción no válida para esta sede' };
      }
    }

    return { valida: true, mensaje: 'Promoción válida', promocion };
  }

  calcularDescuento(promocion: Promocion, subtotal: number): number {
    if (promocion.tipo_descuento === 'PORCENTAJE') {
      return Number(((subtotal * promocion.valor_descuento) / 100).toFixed(2));
    } else {
      // MONTO_FIJO
      return Math.min(promocion.valor_descuento, subtotal);
    }
  }

  aplicarPromocion(
    codigo: string,
    opciones: {
      subtotal: number;
      tipoComprobante: '01' | '03';
      idCliente?: string;
      idSede?: string;
    }
  ): { exito: boolean; mensaje: string; descuento?: number; promocion?: Promocion } {
    const validacion = this.validarPromocion(codigo, opciones);

    if (!validacion.valida || !validacion.promocion) {
      return { exito: false, mensaje: validacion.mensaje };
    }

    const descuento = this.calcularDescuento(validacion.promocion, opciones.subtotal);

    return {
      exito: true,
      mensaje: `Promoción aplicada: ${validacion.promocion.descripcion}`,
      descuento,
      promocion: validacion.promocion,
    };
  }

  registrarUsoPromocion(codigo: string, idComprobante: string): void {
    const promociones = [...this.promocionesSubject.value];
    const index = promociones.findIndex((p) => p.codigo.toUpperCase() === codigo.toUpperCase());

    if (index !== -1) {
      promociones[index].usos_actuales += 1;
      this.promocionesSubject.next(promociones);

      // Registrar en historial
      const promocionAplicada: PromocionAplicada = {
        id_promocion: promociones[index].id_promocion,
        codigo: promociones[index].codigo,
        descripcion: promociones[index].descripcion,
        descuento_calculado: 0, // Se debe pasar como parámetro si se necesita
        id_comprobante: idComprobante,
        fecha_aplicacion: new Date(),
      };

      const historial = [...this.promocionesAplicadasSubject.value, promocionAplicada];
      this.promocionesAplicadasSubject.next(historial);
    }
  }

  getPromocionPorId(id: string): Promocion | null {
    return this.promocionesSubject.value.find((p) => p.id_promocion === id) || null;
  }

  crearPromocion(promocion: Omit<Promocion, 'id_promocion' | 'usos_actuales'>): Promocion {
    const promociones = this.promocionesSubject.value;
    const nuevoId = `PROMO-${String(promociones.length + 1).padStart(3, '0')}`;

    const nuevaPromocion: Promocion = {
      ...promocion,
      id_promocion: nuevoId,
      usos_actuales: 0,
    };

    this.promocionesSubject.next([...promociones, nuevaPromocion]);
    return nuevaPromocion;
  }

  actualizarPromocion(id: string, cambios: Partial<Promocion>): boolean {
    const promociones = [...this.promocionesSubject.value];
    const index = promociones.findIndex((p) => p.id_promocion === id);

    if (index !== -1) {
      promociones[index] = { ...promociones[index], ...cambios };
      this.promocionesSubject.next(promociones);
      return true;
    }
    return false;
  }

  desactivarPromocion(id: string): boolean {
    return this.actualizarPromocion(id, { estado: false });
  }

  getHistorialPromociones(): PromocionAplicada[] {
    return this.promocionesAplicadasSubject.value;
  }

  getEstadisticasPromociones() {
    const promociones = this.promocionesSubject.value;
    const activas = this.getPromocionesActivas().length;
    const totalUsos = promociones.reduce((sum, p) => sum + p.usos_actuales, 0);

    return {
      total: promociones.length,
      activas,
      inactivas: promociones.length - activas,
      totalUsos,
      masUsada: promociones.reduce((max, p) => (p.usos_actuales > max.usos_actuales ? p : max)),
    };
  }
}
