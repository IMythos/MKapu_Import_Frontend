// src/app/ventas/pages/cotizaciones/listado-cotizacion/listado-cotizacion.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';

import {
  MockDataService,
  CotizacionMock,
} from '../../../../core/services/mock-data.service';

interface BusquedaSugerida {
  label: string;
  numero: string;
  cliente: string;
  ruc: string;
  estado: string;
}

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterOutlet,
    TableModule,
    CardModule,
    ButtonModule,
    SelectModule,
    TagModule,
    PaginatorModule,
    InputTextModule,
    DatePickerModule,
    TooltipModule,
    AutoCompleteModule,
  ],
  templateUrl: './listado-cotizacion.html',
  styleUrl: './listado-cotizacion.css',
})
export class ListadoCotizacion implements OnInit {
  pageSizeOptions = [10, 20, 50];
  loading = false;

  buscarValue: string | null = null;
  estadoFiltro: string | null = null;
  fechaInicio: Date | null = null;
  fechaFin: Date | null = null;

  estadosOptions = [
    { label: 'Todos', value: null },
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Enviada', value: 'ENVIADA' },
    { label: 'Aceptada', value: 'ACEPTADA' },
    { label: 'Rechazada', value: 'RECHAZADA' },
  ];

  cotizaciones: CotizacionMock[] = [];
  cotizacionesFiltradas: CotizacionMock[] = [];
  cotizacionesPaginadas: CotizacionMock[] = [];

  rows = 10;
  first = 0;
  totalRecords = 0;

  // autocomplete buscador
  buscarModelo: string = '';
  buscarSugeridos: BusquedaSugerida[] = [];

  constructor(
    private router: Router,
    private mockData: MockDataService,
  ) {}

  ngOnInit(): void {
    this.recargarDesdeServicio();
  }

  private recargarDesdeServicio(): void {
    this.cotizaciones = [...this.mockData.getCotizaciones()];
    this.aplicarFiltros();
  }

  cargarCotizaciones(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.cotizaciones];

    if (this.estadoFiltro) {
      lista = lista.filter(c => c.estado === this.estadoFiltro);
    }

    if (this.buscarModelo && this.buscarModelo.trim().length > 0) {
      const q = this.buscarModelo.toLowerCase().trim();
      lista = lista.filter(
        c =>
          c.numero.toLowerCase().includes(q) ||
          c.cliente.razon_social.toLowerCase().includes(q) ||
          c.cliente.ruc.toLowerCase().includes(q),
      );
    }

    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      lista = lista.filter(c => new Date(c.fecha) >= inicio);
    }

    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59, 999);
      lista = lista.filter(c => new Date(c.fecha) <= fin);
    }

    this.cotizacionesFiltradas = [...lista];
    this.totalRecords = this.cotizacionesFiltradas.length;
    this.first = 0;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    const slice = this.cotizacionesFiltradas.slice(
      this.first,
      this.first + this.rows,
    );
    this.cotizacionesPaginadas = [...slice];
  }

  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    this.aplicarPaginacion();
  }

  cambiarFilas(rows: number): void {
    this.rows = rows;
    this.first = 0;
    this.aplicarPaginacion();
  }

  getLast(): number {
    return Math.min(this.first + this.rows, this.totalRecords);
  }

  mapEstadoSeverity(
    estado: CotizacionMock['estado'],
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (estado) {
      case 'ACEPTADA': return 'success';
      case 'RECHAZADA': return 'danger';
      case 'ENVIADA':   return 'info';
      default:          return 'warn';
    }
  }

  irNueva(): void {
    this.router.navigate(['/ventas/cotizaciones/crear']);
  }

  irDetalle(id: number): void {
    this.router.navigate(['/ventas/cotizaciones/detalle', id]);
  }

  irEditar(id: number): void {
    this.router.navigate(['/ventas/cotizaciones/editar', id]);
  }

  enviarCorreo(id: number): void {
    const cot = this.cotizaciones.find(c => c.id_cotizacion === id);
    console.log('Enviar correo de cotización', cot);
  }

  marcarComoEnviada(id: number): void {
    const cot = this.cotizaciones.find(c => c.id_cotizacion === id);
    if (!cot) return;

    if (cot.estado === 'BORRADOR') {
      const actualizada: CotizacionMock = { ...cot, estado: 'ENVIADA' };
      this.mockData.actualizarCotizacion(actualizada);
      this.recargarDesdeServicio();
    }
  }

  isRutaHija(): boolean {
    const url = this.router.url;
    return (
      url.includes('crear') ||
      url.includes('editar') ||
      url.includes('detalle')
    );
  }

  limpiarFiltros(): void {
    this.buscarModelo = '';
    this.buscarSugeridos = [];
    this.estadoFiltro = null;
    this.fechaInicio = null;
    this.fechaFin = null;
    this.aplicarFiltros();
  }

  // ── AUTOCOMPLETE BUSCADOR ──────────────────────────────
  buscarSugerencias(event: any): void {
    const q = (event.query ?? '').toLowerCase().trim();

    if (!q) {
      this.buscarSugeridos = [];
      return;
    }

    const sugerencias: BusquedaSugerida[] = [];

    this.cotizaciones.forEach(c => {
      if (
        c.numero.toLowerCase().includes(q) ||
        c.cliente.razon_social.toLowerCase().includes(q) ||
        c.cliente.ruc.toLowerCase().includes(q)
      ) {
        sugerencias.push({
          label: `${c.numero} · ${c.cliente.razon_social}`,
          numero: c.numero,
          cliente: c.cliente.razon_social,
          ruc: c.cliente.ruc,
          estado: c.estado,
        });
      }
    });

    // quitar duplicados por numero-cliente-ruc
    const uniqMap = new Map<string, BusquedaSugerida>();
    sugerencias.forEach(s => {
      const key = `${s.numero}-${s.cliente}-${s.ruc}`;
      if (!uniqMap.has(key)) uniqMap.set(key, s);
    });

    this.buscarSugeridos = Array.from(uniqMap.values()).slice(0, 20);
  }

  onBuscarSeleccionado(item: BusquedaSugerida): void {
    this.buscarModelo = item.numero;
    this.cargarCotizaciones();
  }

  onBuscarEnter(): void {
    this.cargarCotizaciones();
  }
}
