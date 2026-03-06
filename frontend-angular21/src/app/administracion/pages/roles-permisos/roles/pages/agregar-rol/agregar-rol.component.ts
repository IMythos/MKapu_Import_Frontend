import { Component, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { Router }        from '@angular/router';
import {
  FormBuilder, Validators,
  ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { CardModule }     from 'primeng/card';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule }    from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { take }           from 'rxjs/operators';
import { RouterModule }    from '@angular/router';
import { RoleService } from '../../../../../services/role.service';

@Component({
  selector: 'app-agregar-rol',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    CardModule, ButtonModule, InputTextModule,
    CheckboxModule, ToastModule,RouterModule
  ],
  templateUrl: './agregar-rol.component.html',
    styleUrl: './agregar-rol.component.css',
})
export class AgregarRolComponent {
  private readonly fb      = inject(FormBuilder);
  private readonly router  = inject(Router);
  private readonly msg     = inject(MessageService);
  readonly svc             = inject(RoleService);

  submitting = signal(false);

  form = this.fb.group({
    nombre:      ['', [Validators.required, Validators.maxLength(45)]],
    descripcion: ['', Validators.maxLength(45)],
    activo:      [true],
  });

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  cancelar() { this.router.navigate(['/admin/roles']); }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    const val = this.form.getRawValue();

    this.svc.createRole({
      nombre:      val.nombre!,
      descripcion: val.descripcion ?? undefined,
      activo:      val.activo ?? true,
    }).pipe(take(1)).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Rol creado', detail: `"${val.nombre}" fue creado.` });
        setTimeout(() => this.router.navigate(['/admin/roles']), 1200);
      },
      error: err => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo crear.' });
        this.submitting.set(false);
      },
    });
  }
}