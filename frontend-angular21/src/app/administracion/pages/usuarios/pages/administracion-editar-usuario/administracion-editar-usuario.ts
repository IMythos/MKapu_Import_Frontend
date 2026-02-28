import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

import { UsuarioService } from '../../../../services/usuario.service';
import { SedeService } from '../../../../services/sede.service';
import { UsuarioInterfaceResponse, UsuarioStatusUpdateRequest, UsuarioUpdateRequest } from '../../../../interfaces/usuario.interface';

@Component({
  selector: 'app-administracion-editar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    SelectModule,
    MessageModule,
    DividerModule

  ],
  providers: [MessageService],
  templateUrl: './administracion-editar-usuario.html',
  styleUrls: ['./administracion-editar-usuario.css'],
})
export class AdministracionEditarUsuario implements OnInit {
  // Estado reactivo con signals:
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Formulario editable reactivo
  form = signal<any>({
    id: null,
    usu_nom: '',
    ape_pat: '',
    ape_mat: '',
    celular: '',
    email: '',
    direccion: '',
    fec_nac: '',
    id_sede: null,
    sedeNombre: '',
    rolNombre: '',
    activo: true
  });

  sedesOptions = signal<{ label: string; value: any }[]>([]);
  rolesOptions = signal<{ label: string; value: any }[]>([
    { label: 'ADMINISTRADOR', value: 'ADMINISTRADOR' },
    { label: 'ALMACEN', value: 'ALMACEN' },
    { label: 'VENTAS', value: 'VENTAS' }
  ]);



  constructor(
    private usuarioService: UsuarioService,
    private sedeService: SedeService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  setFormField(field: keyof ReturnType<typeof this.form>, value: any) {
    this.form.update(formData => ({ ...formData, [field]: value }));
  }

  ngOnInit(): void {
    // 1. Cargar SEDES dinamicamente
    this.sedeService.getSedes().subscribe({
      next: (res: any) => {
        this.sedesOptions.set(
          (res.headquarters || []).map((s: any) => ({
            label: s.nombre,
            value: s.id_sede
          }))
        );
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de sedes');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la lista de sedes',
          life: 2200
        });
      }
    });

    // 2. Traer datos del usuario por ID usando signal
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;
    if (!id || Number.isNaN(id)) return;
    this.loading.set(true);
    this.form.update(f => ({ ...f, id }));

    this.usuarioService.getUsuarioById(id).subscribe({
      next: (usuario: UsuarioInterfaceResponse) => {
        this.form.set({
          ...this.form(),
          ...usuario,
          id: usuario.id_usuario ?? id
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el usuario');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el usuario',
          life: 2200
        });
      }
    });
  }

  actualizarUsuarioCompleto(): void {
    const value = this.form();
    if (!value.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'ID requerido',
        detail: 'No se encontró el ID del usuario',
        life: 1800
      });
      return;
    }

    const payloadDatos: UsuarioUpdateRequest = {
      usu_nom: value.usu_nom,
      ape_pat: value.ape_pat,
      ape_mat: value.ape_mat,
      celular: value.celular,
      email: value.email,
      direccion: value.direccion,
      fec_nac: value.fec_nac,
      id_sede: value.id_sede,
      rolNombre: value.rolNombre
    };
    const payloadEstado: UsuarioStatusUpdateRequest = { activo: value.activo };

    this.loading.set(true);

    this.usuarioService.updateUsuario(value.id, payloadDatos).subscribe({
      next: () => {
        this.usuarioService.updateUsuarioStatus(value.id, payloadEstado).subscribe({
          next: () => {
            this.loading.set(false);
            this.messageService.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Usuario actualizado correctamente',
              life: 2000
            });
            setTimeout(() => this.router.navigate(['/admin/usuarios']), 1200);
          },
          error: () => {
            this.loading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Se actualizó los datos, pero falló el estado',
              life: 2200
            });
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el usuario',
          life: 2200
        });
      }
    });
  }

    
  toUpperCase(field: keyof ReturnType<typeof this.form>): void {
    const value = this.form();
    if (typeof value[field] === 'string') {
      this.form.update(f => ({ ...f, [field]: (value[field] as string).toUpperCase() }));
    }
  }
    goBack(): void {
      this.router.navigate(['/admin/usuarios']);
    }
  }
  function goBack() {
    throw new Error('Function not implemented.');
}

