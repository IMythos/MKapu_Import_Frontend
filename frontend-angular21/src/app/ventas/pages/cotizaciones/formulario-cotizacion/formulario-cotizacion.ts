// src/app/ventas/pages/cotizaciones/formulario-cotizacion/formulario-cotizacion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

import {
  MockDataService,
  CotizacionMock,
  CotizacionMockDetalle,
  ClienteMock,
  ProductoMock,
} from '../../../../core/services/mock-data.service';
import {
  ProductMockService,
  ProductoSugerido,
} from '../../../../core/services/product-mock.service';

export interface LineaCotizacion {
  id: number;
  productoInput: any;
  producto?: ProductoSugerido;
  cantidad: number;
  precio_unitario: number;
  descuento: number; // %
  subtotal: number;
}

@Component({
  selector: 'app-formulario-cotizacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    AutoCompleteModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    DividerModule,
    TooltipModule,
  ],
  templateUrl: './formulario-cotizacion.html',
  styleUrl: './formulario-cotizacion.css',
})
export class FormularioCotizacion implements OnInit {
  esEdicion = false;
  idCotizacion: number | null = null;
  titulo = 'Nueva Cotización';

  // para comparar cambios
  cotizacionOriginal: CotizacionMock | null = null;

  // Cliente
  clientes: ClienteMock[] = [];
  clientesFiltrados: ClienteMock[] = [];
  clienteSeleccionado: ClienteMock | null = null;
  clienteInput: any = null;

  // Configuración
  fechaEmision: Date = new Date();
  fechaVencimiento: Date | null = null;
  observaciones = '';
  estadoSeleccionado: CotizacionMock['estado'] = 'BORRADOR';

  estadosOptions = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Enviada', value: 'ENVIADA' },
  ];

  // Productos
  productos: ProductoSugerido[] = [];
  productosFiltrados: ProductoSugerido[] = [];

  // Líneas
  lineas: LineaCotizacion[] = [];
  nextId = 1;

  // Totales
  subtotalGeneral = 0;
  descuentoTotal = 0;
  igv = 0;
  total = 0;
  readonly IGV_RATE = 0.18;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private mockData: MockDataService,
    private productService: ProductMockService,
  ) {}

  ngOnInit(): void {
    this.clientes = this.mockData.getClientes();
    this.productos = this.productService.getProductos();

    this.idCotizacion = this.route.snapshot.params['id']
      ? Number(this.route.snapshot.params['id'])
      : null;

    this.esEdicion = !!this.idCotizacion;
    this.titulo = this.esEdicion ? 'Editar Cotización' : 'Nueva Cotización';

    if (this.esEdicion) {
      this.cargarDatos();
    } else {
      this.agregarLinea();
    }
  }

  cargarDatos(): void {
    const cot = this.idCotizacion ? this.mockData.getCotizacionById(this.idCotizacion) : undefined;

    if (!cot) {
      this.agregarLinea();
      return;
    }

    this.cotizacionOriginal = JSON.parse(JSON.stringify(cot));

    this.clienteSeleccionado = cot.cliente;
    this.clienteInput = cot.cliente;
    this.estadoSeleccionado = cot.estado;
    this.fechaEmision = new Date(cot.fecha);
    this.observaciones = cot.observaciones ?? '';

    this.lineas = cot.detalles.map((det) => {
      const prodSug: ProductoSugerido = {
        id: det.producto.id_producto,
        nombre: det.producto.descripcion,
        codigo: det.producto.codigo,
        precio: det.producto.precio_unitario,
      };
      return {
        id: this.nextId++,
        productoInput: prodSug,
        producto: prodSug,
        cantidad: det.cantidad,
        precio_unitario: det.precio_unitario,
        descuento: 0,
        subtotal: det.subtotal,
      };
    });

    if (this.lineas.length === 0) {
      this.agregarLinea();
    } else {
      this.calcularTotales();
    }
  }

  // CLIENTE
  buscarClientes(event: any): void {
    const q = (event.query ?? '').toLowerCase().trim();
    if (!q) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter((c) => {
      const rs = c.razon_social.toLowerCase();
      const ruc = c.ruc.toLowerCase();
      return rs.includes(q) || ruc.includes(q);
    });
  }

  onClienteSeleccionado(event: any): void {
    const cli: ClienteMock = event.value;
    this.clienteSeleccionado = cli;
  }

  // PRODUCTOS
  buscarProductos(event: any): void {
    const q = (event.query ?? '').toLowerCase();
    this.productosFiltrados = this.productos.filter(
      (p) => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q),
    );
  }

  onProductoSeleccionado(event: any, linea: LineaCotizacion): void {
    const prod: ProductoSugerido = event.value;
    linea.producto = prod;
    linea.precio_unitario = prod.precio;
    this.calcularSubtotal(linea);
  }

  // LÍNEAS
  agregarLinea(): void {
    this.lineas.push({
      id: this.nextId++,
      productoInput: null,
      producto: undefined,
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      subtotal: 0,
    });
  }

  eliminarLinea(id: number): void {
    if (this.lineas.length === 1) return;
    this.lineas = this.lineas.filter((l) => l.id !== id);
    this.calcularTotales();
  }

  calcularSubtotal(linea: LineaCotizacion): void {
    const bruto = (linea.cantidad ?? 0) * (linea.precio_unitario ?? 0);
    const descPct = linea.descuento ?? 0;
    const desc = descPct > 0 ? (bruto * descPct) / 100 : 0;
    linea.subtotal = bruto - desc;
    this.calcularTotales();
  }

  calcularTotales(): void {
    const brutoTotal = this.lineas.reduce(
      (acc, l) => acc + (l.cantidad ?? 0) * (l.precio_unitario ?? 0),
      0,
    );
    this.subtotalGeneral = this.lineas.reduce((acc, l) => acc + l.subtotal, 0);
    this.descuentoTotal = brutoTotal - this.subtotalGeneral;
    this.igv = this.subtotalGeneral * this.IGV_RATE;
    this.total = this.subtotalGeneral + this.igv;
  }

  // COMPARAR si hubo cambios versus la original
  private huboCambios(detalles: CotizacionMockDetalle[], total: number): boolean {
    if (!this.esEdicion || !this.cotizacionOriginal) return true;

    const orig = this.cotizacionOriginal;

    if (orig.cliente.id_cliente !== this.clienteSeleccionado?.id_cliente) {
      return true;
    }

    const fechaOrig = new Date(orig.fecha).toISOString().slice(0, 10);
    const fechaNueva = this.fechaEmision.toISOString().slice(0, 10);
    if (fechaOrig !== fechaNueva) return true;

    if ((orig.observaciones ?? '') !== (this.observaciones ?? '')) return true;

    if (orig.detalles.length !== detalles.length) return true;

    for (let i = 0; i < detalles.length; i++) {
      const a = orig.detalles[i];
      const b = detalles[i];
      if (
        a.producto.id_producto !== b.producto.id_producto ||
        a.cantidad !== b.cantidad ||
        a.precio_unitario !== b.precio_unitario ||
        a.subtotal !== b.subtotal
      ) {
        return true;
      }
    }

    if (orig.total !== total) return true;

    return false;
  }

  guardar(): void {
    if (!this.clienteSeleccionado) {
      console.warn('Debe seleccionar un cliente');
      return;
    }

    const detalles: CotizacionMockDetalle[] = this.lineas
      .filter((l) => l.producto)
      .map((l, idx) => {
        const prodSug = l.producto as ProductoSugerido;

        const productoMock: ProductoMock = {
          id_producto: prodSug.id,
          codigo: prodSug.codigo,
          descripcion: prodSug.nombre,
          unidad: 'UND',
          precio_unitario: l.precio_unitario,
        };

        return {
          id_detalle: idx + 1,
          producto: productoMock,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal: l.subtotal,
        };
      });

    const total = detalles.reduce((acc, d) => acc + d.subtotal, 0);

    if (this.esEdicion) {
      // IMPORTANTE: refrescar la cotización desde el servicio
      const originalActual = this.idCotizacion
        ? this.mockData.getCotizacionById(this.idCotizacion)
        : null;

      if (!originalActual) {
        console.warn('No se encontró la cotización original');
        return;
      }

      // usamos la versión fresca como referencia
      this.cotizacionOriginal = JSON.parse(JSON.stringify(originalActual));

      const cambios = this.huboCambios(detalles, total);

      // si NO hay cambios en detalle/cliente/total, solo cambiamos estado/fechas/obs
      if (!cambios) {
        const cotizacionActualizada: CotizacionMock = {
          ...originalActual,
          fecha: this.fechaEmision.toISOString(),
          observaciones: this.observaciones,
          estado: this.estadoSeleccionado, // aquí puede pasar de BORRADOR ↔ ENVIADA
        };

        this.mockData.actualizarCotizacion(cotizacionActualizada);
        this.router.navigate(['/ventas/cotizaciones']);
        return;
      }

      // si hay cambios de contenido → crear revisión nueva
      const existentes = this.mockData.getCotizaciones();

      const numeroBase = originalActual.numero.includes('-REV')
        ? originalActual.numero.split('-REV')[0]
        : originalActual.numero;

      const revisionesPrevias = existentes.filter((c) => c.numero.startsWith(numeroBase + '-REV'));
      const siguienteRevision = revisionesPrevias.length + 1;

      const newId =
        existentes.length > 0 ? Math.max(...existentes.map((c) => c.id_cotizacion)) + 1 : 1;

      const numeroNuevo = `${numeroBase}-REV${String(siguienteRevision).padStart(2, '0')}`;

      const cotizacion: CotizacionMock = {
        id_cotizacion: newId,
        numero: numeroNuevo,
        fecha: this.fechaEmision.toISOString(),
        cliente: this.clienteSeleccionado,
        observaciones: this.observaciones,
        estado: this.estadoSeleccionado,
        detalles,
        total,
        revision: siguienteRevision,
      };

      this.mockData.crearCotizacion(cotizacion);
    } else {
      // creación normal
      const existentes = this.mockData.getCotizaciones();
      const newId =
        existentes.length > 0 ? Math.max(...existentes.map((c) => c.id_cotizacion)) + 1 : 1;

      const cotizacion: CotizacionMock = {
        id_cotizacion: newId,
        numero: `COT-${String(newId).padStart(4, '0')}`,
        fecha: this.fechaEmision.toISOString(),
        cliente: this.clienteSeleccionado,
        observaciones: this.observaciones,
        estado: this.estadoSeleccionado,
        detalles,
        total,
        revision: undefined,
      };

      this.mockData.crearCotizacion(cotizacion);
    }

    this.router.navigate(['/ventas/cotizaciones']);
  }

  volver(): void {
    this.router.navigate(['/ventas/cotizaciones']);
  }
}
