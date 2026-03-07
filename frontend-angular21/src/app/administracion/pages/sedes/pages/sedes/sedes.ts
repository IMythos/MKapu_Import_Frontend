import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { SedeService } from '../../../../services/sede.service';
import { Headquarter } from '../../../../interfaces/sedes.interface';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';

type ViewMode = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DialogModule, CardModule, ButtonModule,
    AutoCompleteModule, TableModule, TagModule,
    ToastModule, ConfirmDialogModule, MessageModule,
    SelectModule, TooltipModule,
    LoadingOverlayComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './sedes.html',
  styleUrl: './sedes.css',
})
export class Sedes implements OnInit {
  private readonly sedeService         = inject(SedeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService      = inject(MessageService);

  readonly loadingAlmacenes = this.sedeService.loadingAlmacenes;
  readonly loading          = this.sedeService.loading;
  readonly error            = this.sedeService.error;

  dialogVisible     = false;
  readonly sedeSeleccionada = signal<Headquarter | null>(null);

  readonly searchTerm = signal<string>('');
  readonly sedes      = computed(() => this.sedeService.sedes());
  readonly viewMode   = signal<ViewMode>('activas');

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos',     value: 'todas'     },
    { label: 'Activas',   value: 'activas'   },
    { label: 'Inactivas', value: 'inactivas' },
  ];

  readonly visibleSedes = computed(() => {
    const mode = this.viewMode();
    const all  = this.sedes();
    if (mode === 'activas')   return all.filter(s => s.activo === true);
    if (mode === 'inactivas') return all.filter(s => s.activo === false);
    return all;
  });

  readonly filteredSedes = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleSedes();
    if (!term) return base;
    return base.filter(s =>
      [s.codigo, s.nombre, s.ciudad].some(f =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly sedeSuggestions = computed(() => this.filteredSedes());

  ngOnInit(): void {
    this.sedeService.loadSedes('Administrador').pipe(
      switchMap((res) => {
        const sedes = res.headquarters ?? [];
        if (sedes.length === 0) return of([]);
        return forkJoin(
          sedes.map(sede =>
            this.sedeService.loadAlmacenesParaSede(sede.id_sede).pipe(catchError(() => of(null)))
          )
        );
      })
    ).subscribe();
  }

  getAlmacenesRestantes(sede: Headquarter): string {
    if (!sede.almacenes || sede.almacenes.length <= 2) return '';
    return sede.almacenes.slice(2)
      .map(a => a.codigo + (a.ciudad ? ' · ' + a.ciudad : ''))
      .join('\n');
  }

  verDetalle(sede: Headquarter): void {
    const enriquecida = this.sedeService.sedes().find(s => s.id_sede === sede.id_sede) ?? sede;
    this.sedeSeleccionada.set(enriquecida);
    this.dialogVisible = true;
  }

  onViewModeChange(mode: ViewMode): void { this.viewMode.set(mode); }
  onSearch(event: { query: string }):    void { this.searchTerm.set(event.query); }
  onSearchChange(term: unknown): void {
    if (typeof term === 'string') { this.searchTerm.set(term); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); return;
    }
    this.searchTerm.set('');
  }
  onSelectSede(event: any): void { this.searchTerm.set(String(event?.value?.nombre ?? '')); }
  clearSearch():             void { this.searchTerm.set(''); }

  confirmToggleStatus(sede: Headquarter): void {
    const nextStatus = !sede.activo;
    this.confirmationService.confirm({
      header:      'Confirmación',
      message:     `¿Deseas ${nextStatus ? 'activar' : 'desactivar'} la sede ${sede.nombre} (${sede.codigo})?`,
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: nextStatus ? 'Activar' : 'Desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: (nextStatus ? 'success' : 'danger') as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.sedeService.updateSedeStatus(sede.id_sede, nextStatus, 'Administrador').subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary:  nextStatus ? 'Sede activada' : 'Sede desactivada',
              detail:   `Se ${nextStatus ? 'activó' : 'desactivó'} la sede ${sede.nombre}.`,
            });
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error', summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado de la sede.',
            });
          },
        });
      },
    });
  }
}