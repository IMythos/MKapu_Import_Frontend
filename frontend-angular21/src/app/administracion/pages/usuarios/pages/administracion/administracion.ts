import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UsuarioService } from '../../../../services/usuario.service';
import { SedeService } from '../../../../services/sede.service';
import { Headquarter } from '../../../../interfaces/sedes.interface';
import { UsuarioInterfaceResponse, UsuarioRequest } from '../../../../interfaces/usuario.interface';
import { ROLE_NAMES, UserRole } from '../../../../../core/constants/roles.constants';

@Component({
  selector: 'app-administracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    RadioButtonModule,
    BreadcrumbModule,
    DividerModule,
    TableModule,
    TagModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    AutoCompleteModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './administracion.html',
  styleUrls: ['./administracion.css'],
})
export class Administracion implements AfterViewInit {

  stepsUsuario = [
    'Datos personales',
    'Contacto y sede',
    'Credenciales y Rol',
    'Confirmación',
  ];

  activeStepUsuario = 0;

  roles = [
    {
      label: 'Administrador',
      value: 'ADMIN',
      icon: 'pi pi-shield',
      description: 'Acceso total al sistema y configuración.',
    },
    {
      label: 'Ventas',
      value: 'VENTAS',
      icon: 'pi pi-money-bill',
      description: 'Ventas, caja y facturación.',
    },
    {
      label: 'Almacén',
      value: 'ALMACEN',
      icon: 'pi pi-warehouse',
      description: 'Inventario y control de stock.',
    },
  ];

  rolCuentaSeleccionado: string | null = null;

  sedes: { label: string; value: number }[] = [];
  sedesRaw: Headquarter[] = [];

  generos: { label: string; value: 'M' | 'F' }[] = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
  ];

  usuarioRequestForm: UsuarioRequest = {
    usu_nom: '',
    ape_mat: '',
    ape_pat: '',
    dni: '',
    email: '',
    celular: 0,
    direccion: '',
    genero: '',
    fec_nac: '',
    activo: true,
    id_sede: 0,
    sedeNombre: '',
    nombreCompleto: '',
  };

  dniInput: number | null = null;
  celularInput: number | null = null;

  cuentaForm = {
    username: '',
    password: '',
    confirmPassword: '',
  };

  enviando = false;

  private usuarioService = inject(UsuarioService);
  private sedeService    = inject(SedeService);
  private messageService = inject(MessageService);
  private router         = inject(Router);

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cargarSedes();
    }, 0);
  }

  private cargarSedes(): void {
    this.sedeService.getSedes().subscribe({
      next: (response) => {
        const sedesResponse = Array.isArray(response)
          ? response
          : response?.headquarters ?? [];

        this.sedesRaw = sedesResponse;
        this.sedes = this.sedesRaw.map((sede) => ({
          label: sede.nombre,
          value: sede.id_sede,
        }));

        // Preselecciona la primera sede disponible
        if (this.sedes.length > 0) {
          this.usuarioRequestForm.id_sede    = this.sedes[0].value;
          this.usuarioRequestForm.sedeNombre = this.sedes[0].label;
        }
      },
      error: () => {
        this.sedes = [];
      },
    });
  }

  prevStep(): void {
    if (this.activeStepUsuario > 0) {
      this.activeStepUsuario -= 1;
    }
  }

  nextStep(): void {
    if (this.activeStepUsuario < this.stepsUsuario.length - 1) {
      this.activeStepUsuario += 1;
    }
  }

  enviarUsuarioRequestPrueba(): void {
    // Validaciones
    if (!this.cuentaForm.username.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa el nombre de usuario.' });
      return;
    }
    if (!this.cuentaForm.password) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Ingresa la contraseña.' });
      return;
    }
    if (this.cuentaForm.password !== this.cuentaForm.confirmPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Error', detail: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!this.rolCuentaSeleccionado) {
      this.messageService.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Selecciona un rol.' });
      return;
    }

    // ✅ Captura la sede ANTES de cualquier envío para evitar que se pierda
    const sedeIdCapturada     = this.usuarioRequestForm.id_sede;
    const sedeNombreCapturada = this.getSedeNombre();

    this.enviando = true;

    const payload: UsuarioRequest = {
      ...this.usuarioRequestForm,
      dni:            this.dniInput === null ? '' : String(this.dniInput),
      celular:        this.celularInput === null ? 0 : this.celularInput,
      nombreCompleto: this.buildNombreCompleto(),
      fec_nac:        this.formatFechaNac(this.usuarioRequestForm.fec_nac as unknown as string | Date),
      sedeNombre:     sedeNombreCapturada,
      id_sede:        sedeIdCapturada,
      activo:         true,
    };

    // Paso 1: crear usuario
    this.usuarioService.postUsuarios(payload).subscribe({
      next: (usuarioCreado: any) => {

        // ✅ Resuelve el roleId según el rol seleccionado
        const roleId =
          this.rolCuentaSeleccionado === 'ADMIN'  ? UserRole.ADMIN  :
          this.rolCuentaSeleccionado === 'VENTAS' ? UserRole.VENTAS :
          UserRole.ALMACEN;

        // ✅ Usa sedeIdCapturada (no id_sede: 1 hardcodeado)
        const cuentaPayload = {
          userId:   usuarioCreado.id_usuario,
          username: this.cuentaForm.username,
          password: this.cuentaForm.password,
          id_sede:  sedeIdCapturada,
          roleId,
        };

        // Paso 2: crear cuenta
        this.usuarioService.postCuentaUsuario(cuentaPayload).subscribe({
          next: () => {
            this.enviando = false;
            this.messageService.add({
              severity: 'success',
              summary:  '¡Listo!',
              detail:   'Usuario y cuenta creados correctamente.',
              life:     2000,
            });
            setTimeout(() => {
              this.router.navigate(['/admin/usuarios']);
            }, 2000);
          },
          error: () => {
            this.enviando = false;
            this.messageService.add({
              severity: 'warn',
              summary:  'Usuario creado',
              detail:   'El usuario fue creado pero hubo un error al crear la cuenta. Puedes asignarle una cuenta después.',
            });
          },
        });
      },
      error: (err) => {
        this.enviando = false;
        this.messageService.add({
          severity: 'error',
          summary:  'Error',
          detail:   err?.error?.message ?? 'No se pudo crear el usuario.',
        });
      },
    });
  }

  buildNombreCompleto(): string {
    return [
      this.usuarioRequestForm.usu_nom?.trim(),
      this.usuarioRequestForm.ape_pat?.trim(),
      this.usuarioRequestForm.ape_mat?.trim(),
    ].filter(Boolean).join(' ');
  }

  getSedeNombre(): string {
    const sede = this.sedes.find((s) => s.value === this.usuarioRequestForm.id_sede);
    return sede?.label ?? '';
  }

  private formatFechaNac(value: string | Date): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value;
  }

  private resetFormulario(): void {
    this.usuarioRequestForm = {
      usu_nom: '', ape_mat: '', ape_pat: '', dni: '', email: '',
      celular: 0, direccion: '', genero: '', fec_nac: '',
      activo: true,
      // ✅ Ya no hardcodea id_sede: 1, usa la primera sede cargada
      id_sede:        this.sedes[0]?.value ?? 0,
      sedeNombre:     this.sedes[0]?.label ?? '',
      nombreCompleto: '',
    };
    this.dniInput              = null;
    this.celularInput          = null;
    this.cuentaForm            = { username: '', password: '', confirmPassword: '' };
    this.rolCuentaSeleccionado = null;
    this.activeStepUsuario     = 0;
  }

  allowOnlyLetters(event: KeyboardEvent): void {
    if (event.key.length !== 1) return;
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]$/.test(event.key)) event.preventDefault();
  }

  sanitizeOnlyLetters(value: string): string {
    return value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
  }

  trimUsuarioField(
    key: keyof Pick<UsuarioRequest, 'usu_nom' | 'ape_pat' | 'ape_mat' | 'email' | 'direccion'>
  ): void {
    const value = this.usuarioRequestForm[key];
    if (typeof value === 'string') this.usuarioRequestForm[key] = value.trim();
  }

  removeAllSpaces(value: string): string {
    return typeof value === 'string' ? value.replace(/\s+/g, '') : '';
  }

  onCelularChange(value: number | null): void {
    if (value === null || value === undefined) { this.celularInput = null; return; }
    const digits = String(value).replace(/\D/g, '');
    if (!digits)  { this.celularInput = null; return; }
    this.celularInput = Number(digits.length > 9 ? digits.slice(0, 9) : digits);
  }

  onCelularKeyDown(event: KeyboardEvent): void {
    if (event.key.length !== 1 || !/\d/.test(event.key)) return;
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const value    = input.value?.replace(/\D/g, '') ?? '';
    const selStart = input.selectionStart ?? value.length;
    const selEnd   = input.selectionEnd   ?? value.length;
    if (selEnd <= selStart && value.length >= 9) event.preventDefault();
  }

  getEstadoSeverity(activo: boolean): 'success' | 'danger' {
    return activo ? 'success' : 'danger';
  }

  onDniChange(value: number | null): void {
    if (value === null || value === undefined) {
      this.dniInput = null;
      return;
    }
    const digits = String(value).replace(/\D/g, '');
    this.dniInput = Number(digits.length > 8 ? digits.slice(0, 8) : digits);
  }

  onDniKeyDown(event: KeyboardEvent): void {
    if (event.key.length !== 1 || !/\d/.test(event.key)) return;
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    const value      = input.value?.replace(/\D/g, '') ?? '';
    const selStart   = input.selectionStart ?? value.length;
    const selEnd     = input.selectionEnd   ?? value.length;
    const hasSelection = selEnd > selStart;
    if (!hasSelection && value.length >= 8) event.preventDefault();
  }

  getRolDisplay(usuario: UsuarioInterfaceResponse): string {
    return (
      usuario.rolNombre  ||
      usuario.rol_nombre ||
      usuario.rol        ||
      usuario.role       ||
      (typeof usuario.roleId === 'number'
        ? ROLE_NAMES[usuario.roleId as keyof typeof ROLE_NAMES]
        : '') || 'Sin rol'
    );
  }
}