import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { ConfirmationService, MessageService } from 'primeng/api';
import { DiscountService } from '../../../../services/discount.service';
import { Discount } from '../../../../interfaces/discount.interface';

type ViewMode = 'todas' | 'activas' | 'inactivas';

@Component({
  selector: 'app-descuentos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ButtonModule, AutoCompleteModule, TableModule,
    TagModule, ToastModule, ConfirmDialogModule, MessageModule, SelectModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './descuento.html',
  styleUrl: './descuento.css',
})
export class DescuentoPage implements OnInit {
  private readonly discountService = inject(DiscountService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly loading = this.discountService.loading;
  readonly error = this.discountService.error;

  // Signals para modo de vista y búsqueda
  readonly viewMode = signal<ViewMode>('activas');
  readonly searchTerm = signal<string>('');
  dialogVisible = false;
  readonly descuentoSeleccionado = signal<Discount | null>(null);

  // Computed signals
  readonly descuentos = computed(() => this.discountService.descuentos());
  readonly visibleDescuentos = computed(() => {
    const mode = this.viewMode();
    const all = this.descuentos();
    if (mode === 'activas') return all.filter(d => d.activo);
    if (mode === 'inactivas') return all.filter(d => !d.activo);
    return all;
  });
  readonly filteredDescuentos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleDescuentos();
    if (!term) return base;
    return base.filter(d => d.nombre?.toLowerCase().includes(term));
  });
  readonly descuentoSuggestions = computed(() => this.filteredDescuentos());
  readonly viewOptions = [
    { label: 'Todos', value: 'todas' },
    { label: 'Activas', value: 'activas' },
    { label: 'Inactivas', value: 'inactivas' },
  ];

  ngOnInit(): void {
    this.discountService.loadDescuentos().subscribe();
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
  onSearch(event: { query: string }): void {
    this.searchTerm.set(event.query);
  }
  onSearchChange(term: unknown): void {
    if (typeof term === 'string') this.searchTerm.set(term);
    else if (term && typeof term === 'object' && 'nombre' in (term as any)) this.searchTerm.set(String((term as any).nombre ?? ''));
    else this.searchTerm.set('');
  }
  onSelectDescuento(event: any): void {
    const value = event?.value?.nombre ?? '';
    this.searchTerm.set(String(value));
  }
  clearSearch(): void {
    this.searchTerm.set('');
  }

  verDetalle(descuento: Discount): void {
    this.descuentoSeleccionado.set(descuento);
    this.dialogVisible = true;
  }

  confirmToggleStatus(descuento: Discount): void {
    const nextStatus = !descuento.activo;
    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';
    const acceptSeverity = nextStatus ? 'success' : 'danger';

    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} el descuento ${descuento.nombre}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: acceptSeverity },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.discountService.updateDescuentoStatus(descuento.idDescuento, nextStatus).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: nextStatus ? 'Descuento activado' : 'Descuento desactivado',
              detail: nextStatus
                ? `Se activó el descuento ${descuento.nombre}.`
                : `Se desactivó el descuento ${descuento.nombre}.`,
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo cambiar el estado del descuento.',
            });
          },
        });
      },
    });
  }
}