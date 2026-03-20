import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';

import { ClienteService, Customer } from '../../../../services/cliente.service';
import { SharedTableContainerComponent } from '../../../../../shared/components/table.componente/shared-table-container.component';

type ViewMode = 'todas' | 'juridica' | 'natural';
type StatusFilter = 'activos' | 'inactivos' | 'todos';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    AutoCompleteModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    SelectModule,
    TooltipModule,
    DialogModule,
    SharedTableContainerComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css',
})
export class Clientes implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly loading = this.clienteService.loading;
  readonly error = this.clienteService.error;

  readonly page = signal<number>(1);
  readonly rows = signal<number>(5);
  readonly searchTerm = signal<string>('');
  readonly autoTerm = signal<string>('');
  readonly viewMode = signal<ViewMode>('todas');
  readonly statusFilter = signal<StatusFilter>('activos');

  readonly customers = computed(() => this.clienteService.customers());
  readonly totalItems = computed(() => this.clienteService.total());
  readonly totalPaginas = computed(() => Math.ceil(this.totalItems() / this.rows()) || 1);

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos', value: 'todas' },
    { label: 'Jurídica', value: 'juridica' },
    { label: 'Natural', value: 'natural' },
  ];

  readonly statusOptions: { label: string; value: StatusFilter }[] = [
    { label: 'Activos', value: 'activos' },
    { label: 'Inactivos', value: 'inactivos' },
    { label: 'Todos', value: 'todos' },
  ];

  readonly suggestions = computed(() => {
    const q = this.autoTerm().trim().toLowerCase();
    if (!q) return [];
    return this.customers()
      .filter(
        (c) =>
          String(c.displayName ?? '')
            .toLowerCase()
            .includes(q) ||
          String(c.documentValue ?? '')
            .toLowerCase()
            .includes(q),
      )
      .slice(0, 5);
  });

  selectedClient = signal<Customer | null>(null);
  showDetails = signal<boolean>(false);

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    const status = this.statusFilter();
    this.clienteService
      .loadCustomers({
        page: this.page(),
        limit: this.rows(),
        search: this.searchTerm().trim() || undefined,
        status: status === 'activos' ? true : status === 'inactivos' ? false : undefined,
        tipo: this.viewMode() !== 'todas' ? this.viewMode() : undefined,
      })
      .subscribe();
  }

  private readonly docTypeMap: Record<string, string> = {
    '00': 'OTROS',
    '01': 'DNI',
    '04': 'C.E.',
    '06': 'RUC',
    '07': 'PASAPORTE',
  };

  getDocTypeLabel(code: string): string {
    return this.docTypeMap[code] ?? 'DOC';
  }

  isCompany(code?: string, businessName?: string | null): boolean {
    if (businessName && String(businessName).trim().length > 0) return true;
    return code === '06';
  }

  getDisplayName(c: Customer): string {
    const bn = c.businessName ?? (c as any).razonsocial ?? null;
    if (bn && String(bn).trim().length > 0) return String(bn).trim();
    const name = c.name ?? '';
    const last = c.lastName ?? '';
    return [name, last].filter(Boolean).join(' ').trim() || c.documentValue || '—';
  }

  getPhoneDisplay(c: Customer): string {
    return c.phone ?? '---';
  }

  getCustomerTypeLabel(c: Customer): string {
    return this.isCompany(c.documentTypeSunatCode, c.businessName) ? 'JURÍDICA' : 'NATURAL';
  }

  onAutoChange(value: unknown): void {
    if (typeof value === 'string') {
      this.autoTerm.set(value);
      return;
    }
    if (value && typeof value === 'object') {
      this.autoTerm.set(String((value as any).displayName ?? (value as any).documentValue ?? ''));
      return;
    }
    this.autoTerm.set('');
  }

  onAutoComplete(event: any): void {
    this.autoTerm.set(String(event?.query ?? ''));
  }

  onSelectCliente(event: any): void {
    const selected: Customer | undefined = event?.value;
    if (!selected) return;
    this.searchTerm.set(selected.documentValue ?? '');
    this.autoTerm.set('');
    this.page.set(1);
    this.cargar();
  }

  confirmAutoSearch(): void {
    this.searchTerm.set(this.autoTerm().trim());
    this.autoTerm.set('');
    this.page.set(1);
    this.cargar();
  }

  onViewModeChange(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.page.set(1);
    this.cargar();
  }

  onStatusFilterChange(s: StatusFilter): void {
    this.statusFilter.set(s);
    this.page.set(1);
    this.cargar();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.cargar();
  }

  onLimitChange(limit: number): void {
    this.rows.set(limit);
    this.page.set(1);
    this.cargar();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.autoTerm.set('');
    this.viewMode.set('todas');
    this.statusFilter.set('activos');
    this.page.set(1);
    this.cargar();
  }

  openDetails(c: Customer) {
    this.selectedClient.set(c);
    this.showDetails.set(true);
  }
  closeDetails() {
    this.selectedClient.set(null);
    this.showDetails.set(false);
  }

  confirmToggleStatus(c: Customer): void {
    const nextStatus = !c.status;
    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';

    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} al cliente ${this.getDisplayName(c)} (${c.documentValue})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: (nextStatus ? 'success' : 'danger') as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.clienteService.updateCustomerStatus(c.customerId, nextStatus).subscribe({
          next: () => {
            this.confirmationService.close();
            this.messageService.add({
              severity: nextStatus ? 'success' : 'warn',
              summary: nextStatus ? 'Cliente activado' : 'Cliente desactivado',
              detail: `${this.getDisplayName(c)} fue ${nextStatus ? 'activado' : 'desactivado'}.`,
              life: 3000,
            });
            this.cargar();
          },
          error: (err) => {
            this.confirmationService.close();
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado.',
            });
          },
        });
      },
      reject: () => this.confirmationService.close(),
    });
  }
}