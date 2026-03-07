import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder, Validators,
  ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { CardModule }      from 'primeng/card';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule }  from 'primeng/checkbox';
import { ToastModule }     from 'primeng/toast';
import { MessageService }  from 'primeng/api';
import { take }            from 'rxjs/operators';
import { RouterModule }    from '@angular/router';

import { PermissionService } from '../../../../../services/permission.service';

@Component({
  selector: 'app-editar-permiso',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, ToastModule,RouterModule
  ],
  
  templateUrl: './editar-permiso.component.html',
    styleUrl: './editar-permiso.component.css',
})
export class EditarPermisoComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);
  private readonly msg     = inject(MessageService);
  readonly svc             = inject(PermissionService);

  submitting   = signal(false);
  permisoId    = signal<number | null>(null);

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: ['', Validators.maxLength(50)],
    activo:      [true],
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/permisos']); return; }
    this.permisoId.set(id);

    this.svc.getPermissionById(id).pipe(take(1)).subscribe({
      next: perm => {
        this.form.patchValue({
          nombre:      perm.nombre,
          descripcion: perm.descripcion ?? '',
          activo:      perm.activo,
        });
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el permiso.' });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos/permisos']), 1500);
      },
    });
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  cancelar() { this.router.navigate(['/admin/roles-permisos/permisos']); }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const val = this.form.getRawValue();

    this.svc.updatePermission(this.permisoId()!, {
      nombre:      val.nombre!,
      descripcion: val.descripcion ?? undefined,
      activo:      val.activo ?? true,
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Permiso actualizado', detail: `"${val.nombre}" fue actualizado.` });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos/permisos']), 1200);
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo actualizar.' });
        this.submitting.set(false);
      },
    });
  }
}