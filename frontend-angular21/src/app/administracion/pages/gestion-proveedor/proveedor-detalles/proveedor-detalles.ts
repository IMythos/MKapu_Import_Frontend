// src/app/administracion/pages/gestion-proveedor/proveedor-detalles/proveedor-detalles.ts

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { CardModule } from 'primeng/card';
import { Button } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ProveedorService } from '../../../services/proveedor.service';
import { SupplierResponse } from '../../../interfaces/supplier.interface';

@Component({
  selector: 'app-proveedor-detalles',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    Button,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialog
  ],
  templateUrl: './proveedor-detalles.html',
  styleUrl: './proveedor-detalles.css',
  providers: [ConfirmationService, MessageService]
})
export class ProveedorDetalles implements OnInit, OnDestroy {
  // Signals
  proveedor = signal<SupplierResponse | null>(null);
  proveedorId = signal<number | null>(null);
  loading = signal(true);
  
  // Computed signals (✅ CORREGIDOS - sin errores TS2532)
  estadoSeverity = computed(() => 
    this.proveedor()?.estado ? 'success' : 'danger'
  );
  
  estadoLabel = computed(() => 
    this.proveedor()?.estado ? 'Activo' : 'Inactivo'
  );
  
  tieneContacto = computed(() => {
    const prov = this.proveedor();
    return !!(prov?.contacto && prov.contacto.trim() !== '');
  });
  
  tieneEmail = computed(() => {
    const prov = this.proveedor();
    return !!(prov?.email && prov.email.trim() !== '');
  });
  
  tieneTelefono = computed(() => {
    const prov = this.proveedor();
    return !!(prov?.telefono && prov.telefono.trim() !== '');
  });
  
  tieneDireccion = computed(() => {
    const prov = this.proveedor();
    return !!(prov?.dir_fiscal && prov.dir_fiscal.trim() !== '');
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.proveedorId.set(+params['id']);
        this.cargarProveedor(+params['id']);
      } else {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy() {
    this.confirmationService.close();
  }

  cargarProveedor(id: number) {
    this.loading.set(true);
    
    this.proveedorService.getSupplierById(id).subscribe({
      next: (proveedor) => {
        this.proveedor.set(proveedor);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Proveedor no encontrado',
          life: 3000
        });
        this.loading.set(false);
        setTimeout(() => this.volver(), 2000);
      }
    });
  }

  volver() {
    this.router.navigate(['/admin/proveedores']);
  }

  irEditar() {
    if (this.proveedorId()) {
      this.router.navigate(['/admin/proveedores/editar', this.proveedorId()], {
        queryParams: { returnUrl: `/admin/proveedores/ver-detalle/${this.proveedorId()}` }
      });
    }
  }

  cambiarEstado(event: Event) {
    const proveedorActual = this.proveedor();
    if (!proveedorActual) return;

    const nuevoEstado = !proveedorActual.estado;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Seguro que deseas ${accion} el proveedor "${proveedorActual.razon_social}"?`,
      header: `Confirmar ${accion.charAt(0).toUpperCase() + accion.slice(1)}`,
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: accion.charAt(0).toUpperCase() + accion.slice(1),
      acceptButtonProps: { severity: nuevoEstado ? 'success' : 'warn' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.proveedorService.changeSupplierStatus(proveedorActual.id_proveedor, nuevoEstado).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Estado Actualizado',
              detail: `Proveedor ${accion}do exitosamente`,
              life: 3000
            });
            this.proveedor.set(response);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Error al cambiar el estado',
              life: 3000
            });
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: `Cambio de estado cancelado`,
          life: 2000
        });
      }
    });
  }

  eliminarProveedor(event: Event) {
    const proveedorActual = this.proveedor();
    if (!proveedorActual) return;

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `¿Seguro que deseas eliminar el proveedor "<strong>${proveedorActual.razon_social}</strong>"?<br><br>Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'Cancelar',
      acceptLabel: 'Eliminar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.proveedorService.deleteSupplier(proveedorActual.id_proveedor).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Proveedor Eliminado',
              detail: response.message,
              life: 3000
            });
            setTimeout(() => this.volver(), 1500);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message || 'Error al eliminar el proveedor',
              life: 3000
            });
          }
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Eliminación cancelada',
          life: 2000
        });
      }
    });
  }

  copiarAlPortapapeles(texto: string, campo: string) {
    navigator.clipboard.writeText(texto).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: `${campo} copiado al portapapeles`,
        life: 2000
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo copiar al portapapeles',
        life: 2000
      });
    });
  }
}
