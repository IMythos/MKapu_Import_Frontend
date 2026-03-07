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

import { RoleService } from '../../../../../services/role.service';

@Component({
  selector: 'app-editar-rol',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, ToastModule,
  ],
  templateUrl: './editar-rol.component.html',
  styleUrl: './editar-rol.component.css',
})
export class EditarRolComponent implements OnInit {
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly route   = inject(ActivatedRoute);
  private readonly msg     = inject(MessageService);
  readonly svc             = inject(RoleService);

  submitting = signal(false);
  rolId      = signal<number | null>(null);

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(45)]],
    descripcion: ['', Validators.maxLength(255)],
    activo:      [true],
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/roles-permisos/roles']); return; }
    this.rolId.set(id);

    this.svc.getRoleById(id).pipe(take(1)).subscribe({
      next: rol => {
        this.form.patchValue({
          nombre:      rol.nombre,
          descripcion: rol.descripcion ?? '',
          activo:      rol.activo,
        });
      },
      error: () => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'No se encontró el rol.' });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos/roles']), 1500);
      },
    });
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  cancelar() { this.router.navigate(['/admin/roles-permisos/roles']); }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const val = this.form.getRawValue();

    this.svc.updateRole(this.rolId()!, {
      nombre:      val.nombre!,
      descripcion: val.descripcion ?? undefined,
      activo:      val.activo ?? true,
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Rol actualizado',
          detail: `"${val.nombre}" fue actualizado correctamente.`,
        });
        setTimeout(() => this.router.navigate(['/admin/roles-permisos/roles']), 1200);
      },
      error: err => {
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo actualizar el rol.',
        });
        this.submitting.set(false);
      },
    });
  }
}