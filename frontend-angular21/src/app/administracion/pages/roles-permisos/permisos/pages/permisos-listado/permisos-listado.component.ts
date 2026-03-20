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

import { PermissionService } from '../../../../../services/permission.service';
import { Permission }        from '../../../../../interfaces/role-permission.interface';
import { TooltipModule } from 'primeng/tooltip';
import { SharedTableContainerComponent } from '../../../../../../shared/components/table.componente/shared-table-container.component';

type ViewMode = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-permisos-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DialogModule, CardModule, ButtonModule,
    AutoCompleteModule, TableModule, TagModule,
    ToastModule, ConfirmDialogModule, MessageModule, SelectModule,
    TooltipModule,               
    SharedTableContainerComponent,             
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './permisos-listado.component.html',
    styleUrl: './permisos-listado.component.css',
})
export class PermisosListadoComponent implements OnInit {

  private readonly confirmSvc = inject(ConfirmationService);
  private readonly msgService = inject(MessageService);
  readonly svc                = inject(PermissionService);

  readonly loading = this.svc.loading;
  readonly error   = this.svc.error;

  dialogVisible       = false;
  permisoSeleccionado = signal<Permission | null>(null);

  readonly searchTerm = signal('');
  readonly viewMode   = signal<ViewMode>('activos');

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos',     value: 'todos'     },
    { label: 'Activos',   value: 'activos'   },
    { label: 'Inactivos', value: 'inactivos' },
  ];

  readonly visiblePermisos = computed(() => {
    const mode = this.viewMode();
    const all  = this.svc.permissions();
    if (mode === 'activos')   return all.filter(p => p.activo === true);
    if (mode === 'inactivos') return all.filter(p => p.activo === false);
    return all;
  });

  readonly filteredPermisos = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const base = this.visiblePermisos();
    if (!term) return base;
    return base.filter(p =>
      [p.nombre, p.descripcion].some(f =>
        String(f ?? '').toLowerCase().includes(term)
      )
    );
  });

  readonly suggestions = computed(() => this.filteredPermisos());

  ngOnInit() {
    this.svc.loadPermissions().subscribe({
      error: err => console.error('[Permisos] Error:', err),
    });
  }

  onSearch(event: { query: string })  { this.searchTerm.set(event.query); }
  onViewModeChange(mode: ViewMode)    { this.viewMode.set(mode); }
  clearSearch()                       { this.searchTerm.set(''); }

  onSearchChange(term: unknown) {
    if (typeof term === 'string') { this.searchTerm.set(term); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); return;
    }
    this.searchTerm.set('');
  }

  onSelectPermiso(event: any) {
    this.searchTerm.set(String(event?.value?.nombre ?? ''));
  }

  verDetalle(perm: Permission) {
    this.permisoSeleccionado.set(perm);
    this.dialogVisible = true;
  }

  confirmToggleStatus(perm: Permission) {
    const next        = !perm.activo;
    const verb        = next ? 'activar' : 'desactivar';
    const acceptLabel = next ? 'Activar' : 'Desactivar';

    this.confirmSvc.confirm({
      header:  'Confirmación',
      message: `¿Deseas ${verb} el permiso "${perm.nombre}"?`,
      icon:    'pi pi-exclamation-triangle',
      acceptLabel,
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: next ? 'success' : 'danger' } as any,
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.svc.changeStatus(perm.id_permiso, next).pipe(take(1)).subscribe({
          next: () => this.msgService.add({
            severity: next ? 'success' : 'warn',
            summary:  next ? 'Permiso activado' : 'Permiso desactivado',
            detail:   `"${perm.nombre}" fue ${next ? 'activado' : 'desactivado'}.`,
          }),
          error: err => this.msgService.add({
            severity: 'error', summary: 'Error',
            detail: err?.error?.message ?? 'No se pudo cambiar el estado.',
          }),
        });
      },
    });
  }

  confirmDelete(perm: Permission) {
    this.confirmSvc.confirm({
      header:  'Eliminar Permiso',
      message: `¿Eliminar permanentemente "${perm.nombre}"?`,
      icon:    'pi pi-trash',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' } as any,
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.svc.deletePermission(perm.id_permiso).pipe(take(1)).subscribe({
          next: () => {
            this.msgService.add({
              severity: 'info', summary: 'Permiso eliminado',
              detail: `"${perm.nombre}" fue eliminado.`,
            });
            if (this.permisoSeleccionado()?.id_permiso === perm.id_permiso) {
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