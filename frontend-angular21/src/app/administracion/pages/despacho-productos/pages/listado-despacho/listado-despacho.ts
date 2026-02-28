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
  ],
  templateUrl: './listado-despacho.html',
  styleUrl: './listado-despacho.css',
  providers: [ConfirmationService, MessageService],
})
export class ListadoDespacho {

  // ================================
  // 🔥 INYECCIÓN
  // ================================
  readonly dispatchService         = inject(DispatchService); // public para usarlo en el template (reintentar)
  private readonly empleadosService    = inject(EmpleadosService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // ================================
  // 🏷️ CABECERA
  // ================================
  tituloKicker    = 'ADMINISTRADOR - DESPACHO - PRODUCTOS';
  subtituloKicker = 'LISTADO DE DESPACHO';
  iconoCabecera   = 'pi pi-truck';

  // ================================
  // 🔥 SIGNALS BASE
  // ================================
  searchTerm   = signal<string | null>(null);
  estadoFiltro = signal<string>('TODOS');
  empleados    = signal<Empleado[]>([]);

  // Incluye CANCELADO alineado a DispatchStatus
  estadoOptions = [
    { label: 'Todos',      value: 'TODOS'      },
    { label: 'Pendiente',  value: 'PENDIENTE'  },
    { label: 'Enviado',    value: 'ENVIADO'    },
    { label: 'Entregado',  value: 'ENTREGADO'  },
    { label: 'Cancelado',  value: 'CANCELADO'  },
  ];

  // ================================
  // 🔗 SIGNALS DEL SERVICIO (fuente de verdad)
  // ================================
  dispatches = this.dispatchService.dispatches; // computed → Dispatch[]
  loading    = this.dispatchService.loading;    // computed → boolean
  error      = this.dispatchService.error;      // computed → string | null

  // ================================
  // 🏗️ CONSTRUCTOR — carga inicial
  // ================================
  constructor() {
    // Dispara GET /dispatch → rellena el signal interno del servicio
    this.dispatchService.loadDispatches().subscribe({
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error de carga',
          detail: 'No se pudieron cargar los despachos. Intenta de nuevo.',
          life: 4000,
        });
      }
    });

    // Empleados para mostrar nombre del almacenero y asesor
    this.empleadosService.getEmpleados().subscribe({
      next: (lista) => this.empleados.set(lista),
      error: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudieron cargar los empleados.',
          life: 3000,
        });
      }
    });
  }

  // ================================
  // 🔥 COMPUTED: RESPONSABLES
  // ================================
  despachador = computed(() => this.obtenerNombreEmpleado('ALMACENERO'));
  asesor      = computed(() => this.obtenerNombreEmpleado('VENTAS'));

  // ================================
  // 🔥 COMPUTED: CONTADORES
  // Sobre el total de dispatches (no filasFiltradas) para
  // reflejar la realidad completa del catálogo.
  // ================================
  totalPendientes = computed(() =>
    this.dispatches().filter(d => d.estado === 'PENDIENTE').length
  );

  totalEnviados = computed(() =>
    this.dispatches().filter(d => d.estado === 'ENVIADO').length
  );

  totalEntregados = computed(() =>
    this.dispatches().filter(d => d.estado === 'ENTREGADO').length
  );

  totalCancelados = computed(() =>
    this.dispatches().filter(d => d.estado === 'CANCELADO').length
  );

  // ================================
  // 🔥 COMPUTED: FILTRADO REACTIVO
  // Se recalcula automáticamente cuando cambia:
  //   dispatches()   → nueva data del backend
  //   estadoFiltro() → usuario cambia el select
  //   searchTerm()   → usuario escribe en el input
  // ================================
  filasFiltradas = computed(() => {
    let data = this.dispatches();

    // 1. Filtro por estado
    if (this.estadoFiltro() !== 'TODOS') {
      data = data.filter(d => d.estado === this.estadoFiltro());
    }

    // 2. Filtro por búsqueda: id_despacho, id_venta_ref o tipo_envio
    const term = this.searchTerm()?.trim().toLowerCase();
    if (term) {
      data = data.filter(d =>
        d.id_despacho?.toString().includes(term)      ||
        d.id_venta_ref?.toString().includes(term)     ||
        d.tipo_envio?.toLowerCase().includes(term)
      );
    }

    return data;
  });

  // ================================
  // 🔥 ACCIONES
  // ================================

  /** Confirmación + DELETE al backend */
  eliminar(despacho: Dispatch): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Eliminar el despacho <strong>#${despacho.id_despacho}</strong>? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.dispatchService.deleteDispatch(despacho.id_despacho).subscribe({
          next: () => {
            // El servicio ya elimina del cache → la tabla se actualiza sola vía signal
            this.messageService.add({
              severity: 'success',
              summary: 'Eliminado',
              detail: `Despacho #${despacho.id_despacho} eliminado correctamente.`,
              life: 3000,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el despacho.',
              life: 4000,
            });
          }
        });
      }
    });
  }

  /** Resetea los filtros activos */
  limpiarFiltros(): void {
    this.searchTerm.set(null);
    this.estadoFiltro.set('TODOS');
  }

  /** Severity de p-tag según DispatchStatus */
  getEstadoSeverity(estado: DispatchStatus): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (estado) {
      case 'ENTREGADO':  return 'success';
      case 'ENVIADO':    return 'warn';
      case 'CANCELADO':  return 'secondary';
      default:           return 'danger';   // PENDIENTE
    }
  }

  // ================================
  // 🔒 PRIVADOS
  // ================================
  private obtenerNombreEmpleado(cargo: Empleado['cargo']): string {
    const emp = this.empleados().find(e => e.cargo === cargo && e.estado);
    return emp ? `${emp.nombres} ${emp.apellidos}` : 'Sin asignar';
  }
}