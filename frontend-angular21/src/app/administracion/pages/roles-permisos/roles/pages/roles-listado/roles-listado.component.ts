import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule }         from '@angular/forms';
import { RouterModule }        from '@angular/router';
import { DialogModule }        from 'primeng/dialog';
import { AutoCompleteModule }  from 'primeng/autocomplete';
import { ButtonModule }        from 'primeng/button';
import { CardModule }          from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule }       from 'primeng/message';
import { TableModule }         from 'primeng/table';
import { TagModule }           from 'primeng/tag';
import { ToastModule }         from 'primeng/toast';
import { SelectModule }        from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { take } from 'rxjs/operators';

import { RoleService } from '../../../../../services/role.service';
import { Role }        from '../../../../../interfaces/role-permission.interface';

type ViewMode = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-roles-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DialogModule, CardModule, ButtonModule,
    AutoCompleteModule, TableModule, TagModule,
    ToastModule, ConfirmDialogModule, MessageModule, SelectModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './roles-listado.component.html',
    styleUrl: './roles-listado.component.css',
})
export class RolesListadoComponent implements OnInit {

  private readonly confirmSvc = inject(ConfirmationService);
  private readonly msgService = inject(MessageService);
  readonly svc                = inject(RoleService);

  readonly loading = this.svc.loading;
  readonly error   = this.svc.error;

  dialogVisible   = false;
  rolSeleccionado = signal<Role | null>(null);

  readonly searchTerm = signal('');
  readonly viewMode   = signal<ViewMode>('activos');

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos',     value: 'todos'     },
    { label: 'Activos',   value: 'activos'   },
    { label: 'Inactivos', value: 'inactivos' },
  ];

  readonly visibleRoles = computed(() => {
    const mode = this.viewMode();
    const all  = this.svc.roles();
    if (mode === 'activos')   return all.filter(r => r.activo === true);
    if (mode === 'inactivos') return all.filter(r => r.activo === false);
    return all;
  });

  readonly filteredRoles = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visibleRoles();
    if (!term) return base;
    return base.filter(r =>
      [r.nombre, r.descripcion].some(f =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly suggestions = computed(() => this.filteredRoles());

  ngOnInit() {
    this.svc.loadRoles().subscribe({
      error: err => console.error('[Roles] Error:', err),
    });
  }

  onSearch(event: { query: string }) { this.searchTerm.set(event.query); }
  onViewModeChange(mode: ViewMode)   { this.viewMode.set(mode); }
  clearSearch()                      { this.searchTerm.set(''); }

  onSearchChange(term: unknown) {
    if (typeof term === 'string') { this.searchTerm.set(term); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); return;
    }
    this.searchTerm.set('');
  }

  onSelectRol(event: any) {
    this.searchTerm.set(String(event?.value?.nombre ?? ''));
  }

  verDetalle(rol: Role) {
    this.rolSeleccionado.set(rol);
    this.dialogVisible = true;
  }

  confirmToggleStatus(rol: Role) {
    const next        = !rol.activo;
    const verb        = next ? 'activar' : 'desactivar';
    const acceptLabel = next ? 'Activar' : 'Desactivar';

    this.confirmSvc.confirm({
      header:  'Confirmación',
      message: `¿Deseas ${verb} el rol "${rol.nombre}"?`,
      icon:    'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: next ? 'success' : 'danger' } as any,
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.svc.changeStatus(rol.id_rol, next).pipe(take(1)).subscribe({
          next: () => this.msgService.add({
            severity: next ? 'success' : 'warn',
            summary:  next ? 'Rol activado' : 'Rol desactivado',
            detail:   `"${rol.nombre}" fue ${next ? 'activado' : 'desactivado'}.`,
          }),
          error: err => this.msgService.add({
            severity: 'error', summary: 'Error',
            detail: err?.error?.message ?? 'No se pudo cambiar el estado.',
          }),
        });
      },
    });
  }

  confirmDelete(rol: Role) {
    this.confirmSvc.confirm({
      header:  'Eliminar Rol',
      message: `¿Eliminar permanentemente "${rol.nombre}"? Esta acción no se puede deshacer.`,
      icon:    'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' } as any,
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.svc.deleteRole(rol.id_rol).pipe(take(1)).subscribe({
          next: () => {
            this.msgService.add({
              severity: 'info', summary: 'Rol eliminado',
              detail: `"${rol.nombre}" fue eliminado.`,
            });
            if (this.rolSeleccionado()?.id_rol === rol.id_rol) {
              this.dialogVisible = false;
            }
          },
          error: err => this.msgService.add({
            severity: 'error', summary: 'Error',
            detail: err?.error?.message ?? 'No se pudo eliminar.',
          }),
        });
      },
    });
  }
}