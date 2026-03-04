// ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';

import { ReclamosService, Reclamo, EstadoReclamo, EstadisticasReclamos } from '../../../../core/services/reclamo.service';
import { SedeService, Sede } from '../../../../core/services/sede.service';
import { EmpleadosService, Empleado } from '../../../../core/services/empleados.service';
import { MessageService } from 'primeng/api';

interface FiltroReclamos {
  estado: EstadoReclamo | null;
  busqueda: string;
}

@Component({
  selector: 'app-reclamos-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    TableModule,
    Tag,
    InputText,
    Select,
    Tooltip,
    Toast
  ],
  providers: [MessageService],
  templateUrl: './reclamos-listado.html',
  styleUrl: './reclamos-listado.css',
})
export class ReclamosListado implements OnInit, OnDestroy {
  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'GESTIÓN DE RECLAMOS';
  iconoCabecera = 'pi pi-shield';

  private subscriptions = new Subscription();

  reclamos: Reclamo[] = [];
  reclamosFiltrados: Reclamo[] = [];
  sedes: Sede[] = [];
  empleadoActual: Empleado | null = null;

  filtros: FiltroReclamos = {
    estado: null,
    busqueda: ''
  };

  estadosOptions = [
    { label: 'Todos', value: null },
    { label: 'Pendiente', value: EstadoReclamo.PENDIENTE },
    { label: 'En Proceso', value: EstadoReclamo.EN_PROCESO },
    { label: 'Resuelto', value: EstadoReclamo.RESUELTO }
  ];

  loading: boolean = false;

  estadisticas: EstadisticasReclamos = {
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    resueltos: 0,
    rechazados: 0,
    porcentaje_resueltos: 0,
    tiempo_promedio_resolucion: 0
  };

  constructor(
    private router: Router,
    private reclamosService: ReclamosService,
    private sedeService: SedeService,
    private empleadosService: EmpleadosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarEmpleadoActual();
    this.cargarSedes();
    this.cargarReclamos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargarEmpleadoActual(): void {
    this.empleadoActual = this.empleadosService.getEmpleadoActual();

    if (!this.empleadoActual) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin autenticación',
        detail: 'No hay empleado logueado',
        life: 3000
      });
    }
  }

  cargarSedes(): void {
    const sub = this.sedeService.getSedes().subscribe({
      next: (sedes) => {
        this.sedes = sedes;
      },
      error: (error) => {
        console.error('Error al cargar sedes:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  cargarReclamos(): void {
    this.loading = true;

    const sub = this.reclamosService.getReclamos().subscribe({
      next: (reclamos) => {
        if (this.empleadoActual?.id_sede) {
          this.reclamos = reclamos
            .filter((r: Reclamo) => r.id_sede === this.empleadoActual!.id_sede)
            .sort((a: Reclamo, b: Reclamo) => new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime());
        } else {
          this.reclamos = reclamos.sort((a: Reclamo, b: Reclamo) => 
            new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
          );
        }

        this.reclamosFiltrados = [...this.reclamos];
        this.calcularEstadisticas();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar reclamos:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los reclamos',
          life: 3000
        });
      }
    });
    this.subscriptions.add(sub);
  }

  aplicarFiltros(): void {
    let resultado = [...this.reclamos];

    if (this.filtros.estado) {
      resultado = resultado.filter((r: Reclamo) => r.estado === this.filtros.estado);
    }

    if (this.filtros.busqueda && this.filtros.busqueda.trim()) {
      const busqueda = this.filtros.busqueda.toLowerCase().trim();
      resultado = resultado.filter((r: Reclamo) => 
        r.cliente_dni.includes(busqueda) ||
        r.cliente_nombre.toLowerCase().includes(busqueda) ||
        r.cod_producto.toLowerCase().includes(busqueda) ||
        r.descripcion_producto.toLowerCase().includes(busqueda) ||
        this.formatearComprobante(r.serie_comprobante, r.numero_comprobante).toLowerCase().includes(busqueda)
      );
    }

    this.reclamosFiltrados = resultado;
    this.calcularEstadisticas();
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: null,
      busqueda: ''
    };
    this.aplicarFiltros();

    this.messageService.add({
      severity: 'info',
      summary: 'Filtros limpiados',
      detail: 'Se restablecieron todos los filtros',
      life: 2000
    });
  }

  calcularEstadisticas(): void {
    this.estadisticas = this.reclamosService.getEstadisticas();
  }

  nuevoReclamo(): void {
    const isAdmin = this.router.url.startsWith('/admin');
    const base = isAdmin ? '/admin/reclamos-listado' : '/ventas/reclamos-listado';
    this.router.navigate([`${base}/crear`]);
  }

  verDetalle(idReclamo: number): void {
    const isAdmin = this.router.url.startsWith('/admin');
    const base = isAdmin ? '/admin/reclamos-listado' : '/ventas/reclamos-listado';
    this.router.navigate([`${base}/detalle`, idReclamo]);
  }

  editarReclamo(idReclamo: number): void {
    const isAdmin = this.router.url.startsWith('/admin');
    const base = isAdmin ? '/admin/reclamos-listado' : '/ventas/reclamos-listado';
    this.router.navigate([`${base}/editar`, idReclamo]);
  }

  getEstadoSeverity(estado: EstadoReclamo): 'warn' | 'info' | 'success' | 'danger' {
    return this.reclamosService.getEstadoSeverity(estado);
  }

  getEstadoLabel(estado: EstadoReclamo): string {
    return this.reclamosService.getEstadoLabel(estado);
  }

  calcularDiasDesdeRegistro(fecha: Date): number {
    return this.reclamosService.calcularDiasTranscurridos(fecha);
  }

  formatearComprobante(serie: string, numero: number): string {
    return this.reclamosService.formatearComprobante(serie, numero);
  }

  getSede(idSede: string): string {
    const sede = this.sedes.find((s: Sede) => s.id_sede === idSede);
    return sede ? sede.nombre : 'N/A';
  }

  getDiasGarantiaRestantes(fechaCompra: Date): number {
    return this.reclamosService.calcularDiasRestantes(fechaCompra);
  }

  estaEnGarantia(fechaCompra: Date): boolean {
    return this.reclamosService.validarGarantia(fechaCompra);
  }
}
