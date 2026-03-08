import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DispatchService } from '../../../../services/dispatch.service';
import { Dispatch, DispatchStatus } from '../../../../interfaces/dispatch.interfaces';
import { EmpleadosService, Empleado } from '../../../../../core/services/empleados.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-listado-despacho',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    SelectModule,
    ToastModule,
    ConfirmDialog,
    TooltipModule,
    LoadingOverlayComponent, // ← agregado
  ],
  templateUrl: './listado-despacho.html',
  styleUrl: './listado-despacho.css',
  providers: [ConfirmationService, MessageService],
})
export class ListadoDespacho {

  // ================================
  // 🔥 INYECCIÓN
  // ================================
  readonly dispatchService         = inject(DispatchService);
  private readonly empleadosService    = inject(EmpleadosService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ================================
  // 🏷️ CABECERA
  // ================================
  tituloKicker    = 'ADMINISTRADOR - LOGISTICA - DESPACHO';
  subtituloKicker = 'LISTADO DE DESPACHO';
  iconoCabecera   = 'pi pi-truck';

  // ================================
  // 🔥 SIGNALS BASE
  // ================================
  searchTerm   = signal<string | null>(null);
  estadoFiltro = signal<string>('TODOS');
  empleados    = signal<Empleado[]>([]);

  estadoOptions = [
    { label: 'Todos',          value: 'TODOS'          },
    { label: 'Generado',       value: 'GENERADO'       },
    { label: 'En preparación', value: 'EN_PREPARACION' },
    { label: 'En tránsito',    value: 'EN_TRANSITO'    },
    { label: 'Entregado',      value: 'ENTREGADO'      },
    { label: 'Cancelado',      value: 'CANCELADO'      },
  ];

  // ================================
  // 🔗 SIGNALS DEL SERVICIO
  // ================================
  dispatches = this.dispatchService.dispatches;
  loading    = this.dispatchService.loading;
  error      = this.dispatchService.error;

  // ================================
  // 🏗️ CONSTRUCTOR
  // ================================
  constructor() {
    this.dispatchService.loadDispatches().subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de carga',
          detail: 'No se pudieron cargar los despachos. Intenta de nuevo.',
          life: 4000,
        });
      },
    });

    this.empleadosService.getEmpleados().subscribe({
      next: (lista) => this.empleados.set(lista),
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar los empleados.',
          life: 3000,
        });
      },
    });
  }

  // ================================
  // 🔥 COMPUTED
  // ================================
  despachador = computed(() => this.obtenerNombreEmpleado('ALMACENERO'));
  asesor      = computed(() => this.obtenerNombreEmpleado('VENTAS'));

  totalGenerados     = computed(() => this.dispatches().filter(d => d.estado === 'GENERADO').length);
  totalEnPreparacion = computed(() => this.dispatches().filter(d => d.estado === 'EN_PREPARACION').length);
  totalEnTransito    = computed(() => this.dispatches().filter(d => d.estado === 'EN_TRANSITO').length);
  totalEntregados    = computed(() => this.dispatches().filter(d => d.estado === 'ENTREGADO').length);
  totalCancelados    = computed(() => this.dispatches().filter(d => d.estado === 'CANCELADO').length);
  totalPendientes    = computed(() => this.totalGenerados() + this.totalEnPreparacion());
  totalEnviados      = computed(() => this.totalEnTransito());

  filasFiltradas = computed(() => {
    let data = this.dispatches();

    if (this.estadoFiltro() !== 'TODOS') {
      data = data.filter(d => d.estado === this.estadoFiltro());
    }

    const term = this.searchTerm()?.trim().toLowerCase();
    if (term) {
      data = data.filter(d =>
        d.id_despacho?.toString().includes(term)   ||
        d.id_venta_ref?.toString().includes(term)  ||
        d.direccion_entrega?.toLowerCase().includes(term)
      );
    }

    return data;
  });

  // ================================
  // 🔥 ACCIONES
  // ================================
  cancelar(despacho: Dispatch): void {
    this.confirmationService.confirm({
      header: 'Confirmar cancelación',
      message: `¿Cancelar el despacho <strong>#${despacho.id_despacho}</strong>? Esta acción cambiará su estado a CANCELADO.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dispatchService.cancelarDespacho(despacho.id_despacho).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Cancelado',
              detail: `Despacho #${despacho.id_despacho} cancelado correctamente.`,
              life: 3000,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cancelar el despacho.',
              life: 4000,
            });
          },
        });
      },
    });
  }

  limpiarFiltros(): void {
    this.searchTerm.set(null);
    this.estadoFiltro.set('TODOS');
  }

  getEstadoSeverity(estado: DispatchStatus): 'success' | 'warn' | 'danger' | 'secondary' | 'info' {
    switch (estado) {
      case 'GENERADO':       return 'secondary';
      case 'EN_PREPARACION': return 'info';
      case 'EN_TRANSITO':    return 'warn';
      case 'ENTREGADO':      return 'success';
      case 'CANCELADO':      return 'danger';
      default:               return 'secondary';
    }
  }

  getEstadoLabel(estado: DispatchStatus): string {
    const labels: Record<DispatchStatus, string> = {
      GENERADO:       'Generado',
      EN_PREPARACION: 'En preparación',
      EN_TRANSITO:    'En tránsito',
      ENTREGADO:      'Entregado',
      CANCELADO:      'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  // ================================
  // 🔒 PRIVADOS
  // ================================
  private obtenerNombreEmpleado(cargo: Empleado['cargo']): string {
    const emp = this.empleados().find(e => e.cargo === cargo && e.estado);
    return emp ? `${emp.nombres} ${emp.apellidos}` : 'Sin asignar';
  }
}