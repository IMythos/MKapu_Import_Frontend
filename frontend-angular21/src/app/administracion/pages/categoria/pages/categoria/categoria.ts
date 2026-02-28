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
import { switchMap, take } from 'rxjs/operators';

import { ConfirmationService, MessageService } from 'primeng/api';

import { CategoriaService } from '../../../../services/categoria.service';
import { Categoria } from '../../../../interfaces/categoria.interface';

type ViewMode = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-categorias',
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
  templateUrl: './categoria.html',
  styleUrl: './categoria.css',
})
export class CategoriaListado implements OnInit {
  private readonly categoriaService = inject(CategoriaService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly loading = this.categoriaService.loading;
  readonly error = this.categoriaService.error;

  dialogVisible = false;
  readonly categoriaSeleccionada = signal<Categoria | null>(null);

  readonly searchTerm = signal<string>('');
  readonly categorias = computed(() => this.categoriaService.categorias());
  readonly viewMode = signal<ViewMode>('activas');

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos', value: 'todas' },
    { label: 'Activos', value: 'activas' },
    { label: 'Inactivos', value: 'inactivas' },
  ];

  readonly visibleCategorias = computed(() => {
    const mode = this.viewMode();
    const all = this.categorias();
    if (mode === 'activas') return all.filter((c) => c.activo === true);
    if (mode === 'inactivas') return all.filter((c) => c.activo === false);
    return all;
  });

  readonly filteredCategorias = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleCategorias();
    if (!term) return base;
    return base.filter((c) =>
      [c.nombre, c.descripcion].some((f) =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly categoriaSuggestions = computed(() => this.filteredCategorias());

  ngOnInit(): void {
    this.categoriaService.loadCategorias('Administrador').subscribe();
  }

  verDetalle(cat: Categoria): void {
    this.categoriaSeleccionada.set(cat);
    this.dialogVisible = true;
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onSearch(event: { query: string }): void {
    this.searchTerm.set(event.query);
  }

  onSearchChange(term: unknown): void {
    if (typeof term === 'string') { this.searchTerm.set(term); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); return;
    }
    this.searchTerm.set('');
  }

  onSelectCategoria(event: any): void {
    this.searchTerm.set(String(event?.value?.nombre ?? ''));
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  confirmToggleStatus(cat: Categoria): void {
    const nextStatus = !cat.activo;
    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';
    const acceptSeverity = nextStatus ? 'success' : 'danger';

    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} la categoría "${cat.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: acceptSeverity as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.categoriaService
          .updateCategoriaStatus(cat.id_categoria, nextStatus, 'Administrador')
          .pipe(take(1))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: nextStatus ? 'Categoría activada' : 'Categoría desactivada',
                detail: nextStatus
                  ? `Se activó "${cat.nombre}".`
                  : `Se desactivó "${cat.nombre}".`,
              });
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: err?.error?.message ?? 'No se pudo cambiar el estado.',
              });
            },
          });
      },
    });
  }
}