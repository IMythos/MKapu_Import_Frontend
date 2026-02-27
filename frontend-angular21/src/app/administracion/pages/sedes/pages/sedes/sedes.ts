import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';

import { ConfirmationService, MessageService } from 'primeng/api';

import { SedeService } from '../../../../services/sede.service';
import { Headquarter } from '../../../../interfaces/sedes.interface';

type ViewMode = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DialogModule,
    CardModule,
    ButtonModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    SelectModule, 
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sedes.html',
  styleUrl: './sedes.css',
})
export class Sedes implements OnInit {
  private readonly sedeService = inject(SedeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly loading = this.sedeService.loading;
  readonly error = this.sedeService.error;
  dialogVisible = false;
  readonly sedeSeleccionada = signal<any | null>(null);

  verDetalle(sede: any): void {
    this.sedeSeleccionada.set(sede);
    this.dialogVisible = true;
  }
  readonly searchTerm = signal<string>('');
  readonly sedes = computed(() => this.sedeService.sedes());

  readonly viewMode = signal<ViewMode>('activas');

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos', value: 'todas' },
    { label: 'Activas', value: 'activas' },
    { label: 'Inactivas', value: 'inactivas' },
  ];

  readonly visibleSedes = computed(() => {
    const mode = this.viewMode();
    const all = this.sedes();

    if (mode === 'activas') return all.filter((s) => s.activo === true);
    if (mode === 'inactivas') return all.filter((s) => s.activo === false);
    return all;
  });

  readonly filteredSedes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleSedes();

    if (!term) return base;

    return base.filter((s) =>
      [s.codigo, s.nombre, s.ciudad].some((f) =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly sedeSuggestions = computed(() => this.filteredSedes());

  ngOnInit(): void {
    this.sedeService.loadSedes('Administrador').subscribe();
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  // ... (resto igual)
  onSearch(event: { query: string }): void {
    this.searchTerm.set(event.query);
  }
  onSearchChange(term: unknown): void {
    if (typeof term === 'string') {
      this.searchTerm.set(term);
      return;
    }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? ''));
      return;
    }
    this.searchTerm.set('');
  }
  onSelectSede(event: any): void {
    const value = event?.value?.nombre ?? '';
    this.searchTerm.set(String(value));
  }
  clearSearch(): void {
    this.searchTerm.set('');
  }

  confirmToggleStatus(sede: Headquarter): void {
    const nextStatus = !sede.activo;

    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';
    const acceptSeverity = nextStatus ? 'success' : 'danger';

    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} la sede ${sede.nombre} (${sede.codigo})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: acceptSeverity as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.sedeService.updateSedeStatus(sede.id_sede, nextStatus, 'Administrador').subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: nextStatus ? 'Sede activada' : 'Sede desactivada',
              detail: nextStatus
                ? `Se activó la sede ${sede.nombre}.`
                : `Se desactivó la sede ${sede.nombre}.`,
            });
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado de la sede.',
            });
          },
        });
      },
    });
  }
}