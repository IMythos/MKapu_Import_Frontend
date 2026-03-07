import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router }          from '@angular/router';
import {
  FormBuilder, Validators,
  ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { CardModule }      from 'primeng/card';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule }  from 'primeng/checkbox';
import { ToastModule }     from 'primeng/toast';
import { TagModule }       from 'primeng/tag';
import { MessageService }  from 'primeng/api';
import { take }            from 'rxjs/operators';

import { RoleService }           from '../../../../services/role.service';
import { PermissionService }     from '../../../../services/permission.service';
import { RolePermissionService } from '../../../../services/role-permission.service';
import { PermissionInRoleDto }   from '../../../../interfaces/role-permission.interface';
import { RouterModule } from '@angular/router';

type Step = 1 | 2;

@Component({
  selector: 'app-agregar-roles-permisos',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, ToastModule, TagModule,
    RouterModule
  ],
  templateUrl: './agregar-roles-permisos.component.html',
  styleUrl: './agregar-roles-permisos.component.css',
})
export class AgregarRolesPermisosComponent implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly msg         = inject(MessageService);
  readonly rolSvc              = inject(RoleService);
  readonly permSvc             = inject(PermissionService);
  readonly rolePermSvc         = inject(RolePermissionService);

  // ── Estado de pasos ───────────────────────────────────────────────
  step             = signal<Step>(1);
  submitting       = signal(false);
  createdRolId     = signal<number | null>(null);
  createdRolNombre = signal('');

  // ── Permisos disponibles ──────────────────────────────────────────
  todosLosPermisos = signal<PermissionInRoleDto[]>([]);
  selectedPermIds  = signal<number[]>([]);

  // ── Formulario Paso 1 ─────────────────────────────────────────────
  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(45)]],
    descripcion: ['', Validators.maxLength(255)],
    activo:      [true],
  });

  ngOnInit() {
    // Precargar permisos para el paso 2
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
      },
    });
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  cancelar() { this.router.navigate(['/admin/roles-permisos']); }

  // ── Paso 1: Crear rol ─────────────────────────────────────────────
  crearRol() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const val = this.form.getRawValue();

    this.rolSvc.createRole({
      nombre:      val.nombre!,
      descripcion: val.descripcion ?? undefined,
      activo:      val.activo ?? true,
    }).pipe(take(1)).subscribe({
      next: rol => {
        this.createdRolId.set(rol.id_rol);
        this.createdRolNombre.set(rol.nombre);
        this.submitting.set(false);
        this.step.set(2);
        this.msg.add({
          severity: 'success',
          summary: 'Rol creado',
          detail: `"${rol.nombre}" fue creado. Ahora asigna sus permisos.`,
        });
      },
      error: err => {
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo crear el rol.',
        });
        this.submitting.set(false);
      },
    });
  }

  // ── Paso 2: Toggle permiso ────────────────────────────────────────
  togglePerm(id: number) {
    const cur = this.selectedPermIds();
    this.selectedPermIds.set(
      cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    );
  }

  seleccionarTodos() {
    const activos = this.todosLosPermisos()
      .filter(p => p.activo)
      .map(p => p.id_permiso);
    this.selectedPermIds.set(activos);
  }

  limpiarSeleccion() { this.selectedPermIds.set([]); }

  // ── Paso 2: Guardar permisos ──────────────────────────────────────
  guardarPermisos() {
    const rolId = this.createdRolId();
    if (!rolId) return;
    this.submitting.set(true);

    // Si no hay permisos seleccionados, ir directo al listado
    if (this.selectedPermIds().length === 0) {
      this.msg.add({
        severity: 'info',
        summary: 'Rol creado sin permisos',
        detail: `"${this.createdRolNombre()}" fue creado sin permisos asignados.`,
      });
      setTimeout(() => this.router.navigate(['/admin/roles-permisos']), 1200);
      return;
    }

    this.rolePermSvc.syncPermissions({
      roleId:        rolId,
      permissionIds: this.selectedPermIds(),
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Rol y permisos guardados',
          detail: `"${this.createdRolNombre()}" fue creado con ${this.selectedPermIds().length} permiso(s).`,
        });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos']), 1200);
      },
      error: err => {
        this.msg.add({
          severity: 'error',
          summary: 'Error al asignar permisos',
          detail: err?.error?.message ?? 'El rol fue creado pero no se pudieron asignar los permisos.',
        });
        this.submitting.set(false);
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  getPermisosLabel(count: number): string {
    if (count === 0) return 'Sin permisos';
    if (count === 1) return '1 permiso';
    return `${count} permisos`;
  }
}