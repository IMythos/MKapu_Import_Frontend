import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
import { forkJoin }        from 'rxjs';
import { take }            from 'rxjs/operators';

import { RoleService }           from '../../../../services/role.service';
import { PermissionService }     from '../../../../services/permission.service';
import { RolePermissionService } from '../../../../services/role-permission.service';
import { PermissionInRoleDto }   from '../../../../interfaces/role-permission.interface';

type Step = 1 | 2;

@Component({
  selector: 'app-editar-rol',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, ToastModule, TagModule,
  ],
  templateUrl: './editar-rol.component.html',
  styleUrl: './editar-rol.component.css',
})
export class EditarRolComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);
  private readonly msg     = inject(MessageService);
  readonly rolSvc          = inject(RoleService);
  readonly permSvc         = inject(PermissionService);
  readonly rolePermSvc     = inject(RolePermissionService);

  step       = signal<Step>(1);
  submitting = signal(false);
  rolId      = signal<number | null>(null);
  rolNombre  = signal('');

  todosLosPermisos = signal<PermissionInRoleDto[]>([]);
  selectedPermIds  = signal<number[]>([]);

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(45)]],
    descripcion: ['', Validators.maxLength(255)],
    activo:      [true],
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/roles-permisos']); return; }
    this.rolId.set(id);

    forkJoin({
      rol:         this.rolSvc.getRoleById(id).pipe(take(1)),
      permisos:    this.permSvc.loadPermissions().pipe(take(1)),
      rolPermisos: this.rolePermSvc.loadPermissionsByRole(id).pipe(take(1)),
    }).subscribe({
      next: ({ rol, permisos, rolPermisos }) => {
        this.form.patchValue({
          nombre:      rol.nombre,
          descripcion: rol.descripcion ?? '',
          activo:      rol.activo,
        });
        this.rolNombre.set(rol.nombre);

        this.todosLosPermisos.set(
          permisos.map(p => ({
            id_permiso:  p.id_permiso,
            nombre:      p.nombre,
            descripcion: p.descripcion,
            activo:      p.activo,
          }))
        );

        this.selectedPermIds.set(
          rolPermisos.permisos.map(p => p.id_permiso)
        );
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el rol.' });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos']), 1500);
      },
    });
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  cancelar() { this.router.navigate(['/admin/roles-permisos']); }

  // Paso 1 → actualiza datos y avanza
  guardarDatos() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const val = this.form.getRawValue();

    this.rolSvc.updateRole(this.rolId()!, {
      nombre:      val.nombre!,
      descripcion: val.descripcion ?? undefined,
      activo:      val.activo ?? true,
    }).pipe(take(1)).subscribe({
      next: rol => {
        this.rolNombre.set(rol.nombre);
        this.submitting.set(false);
        this.step.set(2);
        this.msg.add({
          severity: 'success',
          summary: 'Datos actualizados',
          detail: `"${rol.nombre}" actualizado. Ahora edita sus permisos.`,
        });
      },
      error: err => {
        this.msg.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo actualizar el rol.',
        });
        this.submitting.set(false);
      },
    });
  }

  togglePerm(id: number) {
    const cur = this.selectedPermIds();
    this.selectedPermIds.set(
      cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
    );
  }

  seleccionarTodos() {
    this.selectedPermIds.set(
      this.todosLosPermisos().filter(p => p.activo).map(p => p.id_permiso)
    );
  }

  limpiarSeleccion() { this.selectedPermIds.set([]); }

  // Paso 2 → sync permisos y redirige
  guardarPermisos() {
    const rolId = this.rolId();
    if (!rolId) return;
    this.submitting.set(true);

    this.rolePermSvc.syncPermissions({
      roleId:        rolId,
      permissionIds: this.selectedPermIds(),
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Permisos actualizados',
          detail: `"${this.rolNombre()}" actualizado con ${this.selectedPermIds().length} permiso(s).`,
        });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos']), 1200);
      },
      error: err => {
        this.msg.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo actualizar los permisos.',
        });
        this.submitting.set(false);
      },
    });
  }

  getPermisosLabel(count: number): string {
    if (count === 0) return 'Sin permisos';
    if (count === 1) return '1 permiso';
    return `${count} permisos`;
  }
}