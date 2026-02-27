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

type ViewMode = 'todas' | 'juridica' | 'natural';

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
    DialogModule
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

  // estados
  readonly searchTerm = signal<string>('');
  readonly page = signal<number>(1);
  readonly rows = signal<number>(5);

  readonly autoTerm = signal<string>(''); // texto del autocomplete (siempre string)
  readonly customers = computed(() => this.clienteService.customers());

  // suggestions: convierto a string por seguridad y regreso hasta 5 elementos
  readonly suggestions = computed(() => {
    const raw = this.autoTerm();
    const q = String(raw ?? '').trim().toLowerCase();
    if (!q) return [];
    const all = this.customers();
    const matches = all.filter(c =>
      (String(c.displayName ?? '')).toLowerCase().includes(q) ||
      (String(c.documentValue ?? '')).toLowerCase().includes(q)
    );
    return matches.slice(0, 5);
  });

  // filtros / vista
  readonly viewMode = signal<ViewMode>('todas');
  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos', value: 'todas' },
    { label: 'Jurídica', value: 'juridica' },
    { label: 'Natural', value: 'natural' },
  ];

  readonly visibleClients = computed(() => {
    const mode = this.viewMode();
    const all = this.customers();
    if (mode === 'juridica') return all.filter((c) => this.isCompany(c.documentTypeSunatCode, c.businessName));
    if (mode === 'natural') return all.filter((c) => !this.isCompany(c.documentTypeSunatCode, c.businessName));
    return all;
  });

  readonly filteredClients = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleClients();
    if (!term) return base;
    return base.filter((c) =>
      [c.documentValue, c.businessName ?? '', c.name ?? '', c.lastName ?? '']
        .some((f) => String(f ?? '').toLowerCase().includes(term))
    );
  });

  // displayedClients: cuando se setea, la tabla muestra únicamente estos
  displayedClients = signal<Customer[] | null>(null);

  // lista final que usa la tabla: displayedClients (si existe) o filteredClients
  readonly displayedList = computed(() => this.displayedClients() ?? this.filteredClients());

  // diálogo
  selectedClient = signal<Customer | null>(null);
  showDetails = signal<boolean>(false);

  ngOnInit(): void {
    this.clienteService.loadCustomers(undefined, 'Administrador').subscribe();
  }

  // utilidades
  private readonly docTypeMap: Record<string, string> = {
    '00': 'OTROS', '01': 'DNI', '04': 'C.E.', '06': 'RUC', '07': 'PASAPORTE'
  };
  getDocTypeLabel(code: string): string { return this.docTypeMap[code] ?? 'DOC'; }
  isCompany(code?: string, businessName?: string | null): boolean {
    if (businessName && String(businessName).trim().length > 0) return true;
    return code === '06';
  }
  getDisplayName(c: Customer): string {
    const bn = c.businessName ?? (c as any).razon_social ?? null;
    if (bn && String(bn).trim().length > 0) return String(bn).trim();
    const name = c.name ?? (c as any).nombres ?? '';
    const last = c.lastName ?? (c as any).apellidos ?? '';
    const full = [name, last].filter(Boolean).join(' ').trim();
    return full || c.documentValue || '—';
  }
  getPhoneDisplay(c: Customer): string { return c.phone ?? '---'; }
  getCustomerTypeLabel(c: Customer): string { return this.isCompany(c.documentTypeSunatCode, c.businessName) ? 'JURÍDICA' : 'NATURAL'; }

  // ---------- Autocomplete handlers ----------

  // ngModelChange: puede recibir string (typing) o objeto (selection).
  // Extraigo displayName/documentValue si es objeto, y siempre guardo string en autoTerm.
  onAutoChange(value: unknown): void {
    if (typeof value === 'string') {
      this.autoTerm.set(value);
      return;
    }
    if (value && typeof value === 'object') {
      const v = value as any;
      const text = String(v.displayName ?? v.documentValue ?? '');
      this.autoTerm.set(text);
      return;
    }
    this.autoTerm.set('');
  }

  // completeMethod: PrimeNG lo usa al tipear; mantenemos autoTerm actualizado
  onAutoComplete(event: { query: string } | any): void {
    this.autoTerm.set(String(event?.query ?? ''));
  }

  // selección de sugerencia: pedimos detalle por id y mostramos en la tabla
  onSelectCliente(event: any): void {
    const selected: Customer | undefined = event?.value;
    if (!selected) return;

    // Si el objeto tiene customerId pedimos detalle al backend y lo mostramos
    if (selected.customerId) {
      this.clienteService.getCustomerById(selected.customerId).subscribe({
        next: (full) => {
          this.displayedClients.set([full]);
          // opcional: limpiar input visual
          this.autoTerm.set('');
          this.page.set(1);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo obtener los datos del cliente.' });
          this.displayedClients.set(null);
        }
      });
      return;
    }

    // fallback (si no hay id): filtrar por display/document localmente
    const display = selected.displayName ?? selected.documentValue ?? '';
    this.searchTerm.set(display);
    this.page.set(1);
    this.autoTerm.set('');
  }

  // Enter -> confirmar búsqueda (copia autoTerm -> searchTerm)
  confirmAutoSearch(): void {
    this.searchTerm.set(String(this.autoTerm()).trim());
    this.page.set(1);
    this.displayedClients.set(null);
  }

  // ---------- Otros handlers ----------

  onViewModeChange(mode: ViewMode): void { this.viewMode.set(mode); this.page.set(1); }
  clearSearch(): void {
    this.searchTerm.set('');
    this.autoTerm.set('');
    this.viewMode.set('todas');
    this.page.set(1);
    this.displayedClients.set(null);
  }
  onPageChange(event: any): void { const newPage = (event.first / event.rows) + 1; this.rows.set(event.rows); this.page.set(newPage); }

  // acciones
  openDetails(c: Customer) { this.selectedClient.set(c); this.showDetails.set(true); }
  closeDetails() { this.selectedClient.set(null); this.showDetails.set(false); }

  // Confirmar activar/desactivar cliente (usa endpoint PUT /customers/:id/status)
  confirmToggleStatus(c: Customer): void {
    const nextStatus = !c.status;
    const verb = nextStatus ? 'activar' : 'desactivar';
    const acceptLabel = nextStatus ? 'Activar' : 'Desactivar';
    const acceptSeverity = nextStatus ? 'success' : 'danger';

    this.confirmationService.confirm({
      header: 'Confirmación',
      message: `¿Deseas ${verb} al cliente ${this.getDisplayName(c)} (${c.documentValue})?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: acceptSeverity as any },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.clienteService.updateCustomerStatus(c.customerId, nextStatus).subscribe({
          next: (updated) => {
            // Actualizar displayedClients si está mostrando el cliente seleccionado
            const current = this.displayedClients();
            if (current) {
              const idx = current.findIndex(x => x.customerId === updated.customerId);
              if (idx >= 0) {
                const copy = [...current];
                copy[idx] = updated;
                this.displayedClients.set(copy);
              }
            }
            // mensaje
            this.messageService.add({
              severity: 'success',
              summary: nextStatus ? 'Cliente activado' : 'Cliente desactivado',
              detail: nextStatus
                ? `Se activó el cliente ${this.getDisplayName(updated)}.`
                : `Se desactivó el cliente ${this.getDisplayName(updated)}.`, 
              life: 3000
            });
          },
          error: (err) => {
            console.error(err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err?.error?.message ?? 'No se pudo cambiar el estado del cliente.'
            });
          }
        });
      }
    });
  }
}