import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { switchMap, take } from 'rxjs/operators';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AlmacenService } from '../../../../services/almacen.service';
import { Headquarter } from '../../../../interfaces/almacen.interface';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../../shared/components/paginador/Paginador.component';

type ViewMode = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-almacen-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DialogModule, CardModule, ButtonModule,
    AutoCompleteModule, TableModule, TagModule,
    ToastModule, ConfirmDialogModule, MessageModule,
    SelectModule,
    LoadingOverlayComponent,
    PaginadorComponent,  
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './almacen.html',
  styleUrl: './almacen.css',
})
export class AlmacenListado implements OnInit {
  private readonly almacenService      = inject(AlmacenService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService      = inject(MessageService);

  readonly loading = this.almacenService.loading;
  readonly error   = this.almacenService.error;

  dialogVisible                = false;
  readonly almacenSeleccionado = signal<Headquarter | null>(null);

  readonly searchTerm = signal<string>('');
  readonly almacenes  = computed(() => this.almacenService.sedes());
  readonly viewMode   = signal<ViewMode>('activas');

  readonly paginaActual = signal<number>(1);
  readonly limitePagina = signal<number>(5);

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos',     value: 'todas'     },
    { label: 'Activos',   value: 'activas'   },
    { label: 'Inactivos', value: 'inactivas' },
  ];

  readonly visibleAlmacenes = computed(() => {
    const mode = this.viewMode();
    const all  = this.almacenes() ?? [];
    if (mode === 'activas')   return all.filter(s => s.activo === true);
    if (mode === 'inactivas') return all.filter(s => s.activo === false);
    return all;
  });

  readonly filteredAlmacenes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleAlmacenes();
    if (!term) return base;
    return base.filter(s =>
      [s.codigo, s.nombre, s.ciudad, s.departamento, s.provincia].some(f =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly almacenesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePagina();
    return this.filteredAlmacenes().slice(inicio, inicio + this.limitePagina());
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.filteredAlmacenes().length / this.limitePagina())
  );

  readonly almacenSuggestions = computed(() => this.filteredAlmacenes());

  ngOnInit(): void {
    this.almacenService.loadAlmacen('Administrador').subscribe({
      error: (err: any) => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.message ?? 'No se pudieron cargar los almacenes.',
        });
      },
    });
  }

  verDetalle(almacen: Headquarter): void {
    this.almacenSeleccionado.set(almacen);
    this.dialogVisible = true;
  }

  onViewModeChange(mode: ViewMode): void { this.viewMode.set(mode); this.paginaActual.set(1); }
  onSearch(event: { query: string }): void { this.searchTerm.set(event.query); this.paginaActual.set(1); }

  onSearchChange(term: unknown): void {
    if (typeof term === 'string') { this.searchTerm.set(term); this.paginaActual.set(1); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); this.paginaActual.set(1); return;
    }
    this.searchTerm.set('');
  }

  onSelectAlmacen(event: any): void { this.searchTerm.set(String(event?.value?.nombre ?? '')); this.paginaActual.set(1); }
  clearSearch(): void { this.searchTerm.set(''); this.paginaActual.set(1); }

  onPageChange(page: number): void   { this.paginaActual.set(page); }
  onLimitChange(limit: number): void { this.limitePagina.set(limit); this.paginaActual.set(1); }

  confirmToggleStatus(almacen: Headquarter): void {
    const nextStatus = !almacen.activo;
    this.confirmationService.confirm({
      header:      'Confirmación',
      message:     `¿Deseas ${nextStatus ? 'activar' : 'desactivar'} el almacén ${almacen.nombre} (${almacen.codigo})?`,
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: nextStatus ? 'Activar' : 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: (nextStatus ? 'success' : 'danger') as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const id = almacen.id_almacen ?? almacen.id ?? 0;
        this.almacenService.updateAlmacenStatus(id, nextStatus, 'Administrador').pipe(
          switchMap(() => this.almacenService.loadAlmacen('Administrador')),
          take(1)
        ).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary:  nextStatus ? 'Almacén activado' : 'Almacén desactivado',
              detail:   nextStatus
                ? `Se activó el almacén ${almacen.nombre}.`
                : `Se desactivó el almacén ${almacen.nombre}.`,
            });
          },
          error: (err: any) => {
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado del almacén.',
            });
          },
        });
      },
    });
  }
}