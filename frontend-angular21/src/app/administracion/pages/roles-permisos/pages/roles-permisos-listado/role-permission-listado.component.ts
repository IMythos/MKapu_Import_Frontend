import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule }     from '@angular/forms';
import { RouterModule }    from '@angular/router';
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
import { CheckboxModule }      from 'primeng/checkbox';
import { ConfirmationService, MessageService } from 'primeng/api';
import { take } from 'rxjs/operators';
import { TooltipModule } from 'primeng/tooltip';
import { SharedTableContainerComponent } from '../../../../../shared/components/table.componente/shared-table-container.component';

import { RolePermissionService }          from '../../../../services/role-permission.service';
import { PermissionService }              from '../../../../services/permission.service';
import {
  RoleWithPermissionsResponseDto,
  PermissionInRoleDto,
}                                         from '../../../../interfaces/role-permission.interface';

type ViewMode = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-role-permission-listado',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    DialogModule, CardModule, ButtonModule,
    AutoCompleteModule, TableModule, TagModule,
    ToastModule, ConfirmDialogModule, MessageModule,
    SelectModule, CheckboxModule,
    TooltipModule,
    SharedTableContainerComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './role-permission-listado.html',
  styleUrl: './role-permission-listado.component.css',
})
export class RolePermissionListadoComponent implements OnInit {

  private readonly svc        = inject(RolePermissionService);
  private readonly permSvc    = inject(PermissionService);
  private readonly msgService = inject(MessageService);

  readonly loading = this.svc.loading;
  readonly error   = this.svc.error;

  // ── Dialog detalle ────────────────────────────────────────────────
  dialogDetalleVisible = false;
  rolSeleccionado      = signal<RoleWithPermissionsResponseDto | null>(null);

  // ── Dialog asignar permisos ───────────────────────────────────────
  dialogAsignarVisible = false;
  rolAsignando         = signal<RoleWithPermissionsResponseDto | null>(null);
  todosLosPermisos     = signal<PermissionInRoleDto[]>([]);
  selectedPermIds      = signal<number[]>([]);
  submittingAssign     = signal(false);

  // ── Filtros ───────────────────────────────────────────────────────
  readonly searchTerm = signal('');
  readonly viewMode   = signal<ViewMode>('activos');

  readonly paginaActual = signal<number>(1);
  readonly limitePagina = signal<number>(5);

  readonly viewOptions: { label: string; value: ViewMode }[] = [
    { label: 'Todos',     value: 'todos'     },
    { label: 'Activos',   value: 'activos'   },
    { label: 'Inactivos', value: 'inactivos' },
  ];

  readonly roles = computed(() => this.svc.rolesWithPermissions());

  readonly visibleRoles = computed(() => {
    const mode = this.viewMode();
    const all  = this.roles();
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

  readonly rolesPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.limitePagina();
    return this.filteredRoles().slice(inicio, inicio + this.limitePagina());
  });

  readonly totalPaginas = computed(() =>
    Math.ceil(this.filteredRoles().length / this.limitePagina())
  );

  readonly suggestions = computed(() => this.filteredRoles());

  ngOnInit() {
    this.svc.loadAllRolesWithPermissions().subscribe({
      error: err => console.error('[RolePermission] Error:', err),
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────
  onSearch(event: { query: string })  { this.searchTerm.set(event.query); this.paginaActual.set(1); }
  onViewModeChange(mode: ViewMode)    { this.viewMode.set(mode); this.paginaActual.set(1); }
  clearSearch()                       { this.searchTerm.set(''); this.paginaActual.set(1); }

  onSearchChange(term: unknown) {
    if (typeof term === 'string') { this.searchTerm.set(term); this.paginaActual.set(1); return; }
    if (term && typeof term === 'object' && 'nombre' in (term as any)) {
      this.searchTerm.set(String((term as any).nombre ?? '')); this.paginaActual.set(1); return;
    }
    this.searchTerm.set('');
  }

  onSelectRol(event: any) {
    this.searchTerm.set(String(event?.value?.nombre ?? ''));
    this.paginaActual.set(1);
  }

  onPageChange(page: number): void   { this.paginaActual.set(page); }
  onLimitChange(limit: number): void { this.limitePagina.set(limit); this.paginaActual.set(1); }

  // ── Detalle ───────────────────────────────────────────────────────
  verDetalle(rol: RoleWithPermissionsResponseDto) {
    this.rolSeleccionado.set(rol);
    this.dialogDetalleVisible = true;
  }

  // ── Asignar permisos ──────────────────────────────────────────────
  abrirAsignar(rol: RoleWithPermissionsResponseDto) {
    this.rolAsignando.set(rol);
    this.selectedPermIds.set(rol.permisos.map(p => p.id_permiso));
    this.dialogDetalleVisible = false;

    this.permSvc.loadPermissions().pipe(take(1)).subscribe({
      next: perms => {
        this.todosLosPermisos.set(
          perms.map(p => ({
            id_permiso:  p.id_permiso,
            nombre:      p.nombre,
            descripcion: p.descripcion,
            activo:      p.activo,
          }))
        );
        this.dialogAsignarVisible = true;
      },
      error: () => {
        this.msgService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar los permisos disponibles.',
        });
      },
    });
  }

  togglePerm(id: number) {
    const cur = this.selectedPermIds();
    this.selectedPermIds.set(
      cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    );
  }

  guardarPermisos() {
    const rol = this.rolAsignando();
    if (!rol) return;
    this.submittingAssign.set(true);

    this.svc.syncPermissions({
      roleId:        rol.id_rol,
      permissionIds: this.selectedPermIds(),
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msgService.add({
          severity: 'success',
          summary:  'Permisos actualizados',
          detail:   `Rol "${rol.nombre}" actualizado correctamente.`,
        });
        this.dialogAsignarVisible = false;
        this.submittingAssign.set(false);
      },
      error: err => {
        this.msgService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo actualizar los permisos.',
        });
        this.submittingAssign.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getPermisosLabel(count: number): string {
    if (count === 0) return 'Sin permisos';
    if (count === 1) return '1 permiso';
    return `${count} permisos`;
  }

  getPermisosTagSeverity(count: number): 'success' | 'warn' | 'danger' {
    if (count === 0) return 'danger';
    if (count < 5)  return 'warn';
    return 'success';
  }
}