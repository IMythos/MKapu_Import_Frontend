// src/app/administracion/pages/gestion-proveedor/proveedor-listado/proveedor-listado.ts

import { Component, OnInit, OnDestroy, AfterViewInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, filter, takeUntil } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ProveedorService } from '../../../services/proveedor.service';
import { SupplierResponse } from '../../../interfaces/supplier.interface';

@Component({
  selector: 'app-proveedor-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterOutlet,
    ButtonModule,
    TableModule,
    CardModule,
    TagModule,
    AutoCompleteModule,
    SelectModule,
    ToggleButtonModule,
    InputTextModule,
    TooltipModule,
    PaginatorModule,
    ConfirmDialog,
    DialogModule,
    ToastModule,
  ],
  templateUrl: './proveedor-listado.html',
  styleUrl: './proveedor-listado.css',
  providers: [ConfirmationService, MessageService],
})
export class ProveedorListado implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  readonly pageSizeOptions = [10, 20, 50, 100];

  private currentUrl = signal<string>('');
  esVistaEliminados = signal(false);

  proveedores = signal<SupplierResponse[]>([]);
  proveedoresFiltrados = signal<SupplierResponse[]>([]);
  proveedoresPaginados = signal<SupplierResponse[]>([]);

  loading = signal(false);
  vistaLista = signal(true);

  buscarValue = signal<string | null>(null);
  items = signal<SupplierResponse[]>([]);

  rows = signal(10);
  first = signal(0);
  totalRecords = signal(0);

  tituloKicker = computed(() => {
    if (this.esVistaEliminados()) {
      return 'ADMINISTRADOR - ADMINISTRACIÓN - PROVEEDORES ELIMINADOS';
    }

    const url = this.currentUrl();

    if (url.includes('crear')) {
      return 'ADMINISTRACIÓN - PROVEEDORES CREACIÓN';
    } else if (url.includes('editar')) {
      return 'ADMINISTRACIÓN - PROVEEDORES EDICIÓN';
    } else if (url.includes('ver-detalle')) {
      return 'ADMINISTRACIÓN - PROVEEDORES DETALLE';
    } else {
      return 'ADMINISTRACIÓN - PROVEEDORES ACTIVOS';
    }
  });

  iconoCabecera = computed(() => {
    if (this.esVistaEliminados()) {
      return 'pi pi-trash';
    }

    const url = this.currentUrl();

    if (url.includes('crear')) {
      return 'pi pi-plus-circle';
    } else if (url.includes('editar')) {
      return 'pi pi-pencil';
    } else if (url.includes('ver-detalle')) {
      return 'pi pi-eye';
    } else {
      return 'pi pi-building';
    }
  });

  subtituloKicker = 'GESTIÓN DE PROVEEDORES';

  totalProveedoresActivos = computed(() => this.proveedores().length);

  totalProveedoresConContacto = computed(
    () => this.proveedores().filter(p => p.contacto).length
  );

  totalProveedoresConEmail = computed(
    () => this.proveedores().filter(p => p.email).length
  );

  totalProveedoresConTelefono = computed(
    () => this.proveedores().filter(p => p.telefono).length
  );

  constructor(
    private router: Router,
    private proveedorService: ProveedorService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {
    this.currentUrl.set(this.router.url);
  }

  ngOnInit(): void {
    this.cargarProveedores();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.confirmationService.close();
  }

  private getEstadoFiltro(): boolean {
    return !this.esVistaEliminados();
  }

  cargarProveedores(): void {
    this.loading.set(true);

    this.proveedorService
      .listSuppliers({
        estado: this.getEstadoFiltro(),
        search: this.buscarValue() || undefined,
      })
      .subscribe({
        next: response => {
          this.proveedores.set(response.suppliers);
          this.aplicarTodosLosFiltros();
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message,
            life: 3000,
          });
          this.loading.set(false);
        },
      });
  }

  aplicarTodosLosFiltros(): void {
    const proveedoresActuales = this.proveedores();

    if (proveedoresActuales.length === 0) {
      this.proveedoresFiltrados.set([]);
      this.aplicarPaginacion();
      return;
    }

    // Si toda la búsqueda ya se hace en backend, aquí solo podrías aplicar filtros extra locales.
    this.proveedoresFiltrados.set(proveedoresActuales);
    this.first.set(0);
    this.aplicarPaginacion();
  }

  searchBuscar(event: any): void {
    const query = event.query || '';
    this.buscarValue.set(query);

    this.proveedorService
      .listSuppliers({
        estado: this.getEstadoFiltro(),
        search: query,
      })
      .subscribe({
        next: response => {
          this.items.set(response.suppliers.slice(0, 10));
        },
        error: () => {
          this.items.set([]);
        },
      });
  }

  filtrarPorBusqueda(event: any): void {
    if (event?.value) {
      this.buscarValue.set(event.value.razon_social);
      this.cargarProveedores();
    }
  }

  toggleStatus(proveedor: SupplierResponse): void {
    const nuevoEstado = !proveedor.estado;
    const accion = nuevoEstado ? 'activar' : 'enviar a eliminados';
    const destino = nuevoEstado ? 'activos' : 'eliminados';

    this.confirmationService.confirm({
      message: `¿Está seguro de ${accion} el proveedor "${proveedor.razon_social}"?`,
      header: 'Confirmar acción',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.proveedorService.changeSupplierStatus(proveedor.id_proveedor, nuevoEstado).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Proveedor movido a ${destino}`,
              life: 3000,
            });
            this.cargarProveedores();
          },
          error: (error: Error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.message,
              life: 3000,
            });
          },
        });
      },
    });
  }

  limpiarFiltros(): void {
    this.buscarValue.set(null);
    this.items.set([]);
    this.cargarProveedores();
  }

  private aplicarPaginacion(): void {
    const filtrados = this.proveedoresFiltrados();

    if (filtrados.length === 0) {
      this.proveedoresPaginados.set([]);
      this.totalRecords.set(0);
      return;
    }

    this.totalRecords.set(filtrados.length);
    const paginados = filtrados.slice(this.first(), this.first() + this.rows());
    this.proveedoresPaginados.set(paginados);
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows || 10);
    this.aplicarPaginacion();
  }

  cambiarFilas(rowsNumber: number): void {
    this.rows.set(rowsNumber);
    this.first.set(0);
    this.aplicarPaginacion();
  }

  trackByFn(index: number, item: SupplierResponse): number {
    return item.id_proveedor;
  }

  irDetalle(id: number): void {
    this.router.navigate(['/admin/proveedores/ver-detalle', id]);
  }

  irCrear(): void {
    this.router.navigate(['/admin/proveedores/crear']);
  }

  irEditar(id: number): void {
    this.router.navigate(['/admin/proveedores/editar']);
  }

  irEliminados(): void {
    this.esVistaEliminados.set(true);
    this.first.set(0);
    this.cargarProveedores();
  }

  irActivos(): void {
    this.esVistaEliminados.set(false);
    this.first.set(0);
    this.cargarProveedores();
  }

  isRutaHija(): boolean {
    const url = this.currentUrl();
    return url.includes('crear') || url.includes('editar') || url.includes('ver-detalle');
  }

  getLast(): number {
    return Math.min(this.first() + this.rows(), this.totalRecords());
  }
}
