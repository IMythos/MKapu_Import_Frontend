import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { EmpresaService, UpdateEmpresaPayload } from '../../services/empresa.service';

export interface EmpresaForm {
  nombre:       string;
  razon_social: string;
  ruc:          string;
  logo_url:     string;
  logoPublicId: string;
  direccion:    string;
  ciudad:       string;
  departamento: string;
  telefono:     string;
  email:        string;
  web:          string;
}

@Component({
  selector: 'app-empresa-configuracion',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CardModule, ButtonModule, InputTextModule,
    TextareaModule, ToastModule, TagModule,
    DividerModule, TooltipModule,
    LoadingOverlayComponent,
  ],
  providers: [MessageService],
  templateUrl: './empresa-configuracion.html',
  styleUrl: './empresa-configuracion.css',
})
export class EmpresaConfiguracion implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly empresaService = inject(EmpresaService);

  loading     = signal(false);
  guardando   = signal(false);
  logoPreview = signal<string | null>(null);
  logoFile    = signal<File | null>(null);

  form: EmpresaForm = {
    nombre: '', razon_social: '', ruc: '', logo_url: '',
    logoPublicId: '', direccion: '', ciudad: '',
    departamento: '', telefono: '', email: '', web: '',
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.empresaService.getEmpresa().subscribe({
      next: (data) => {
        this.form = {
          nombre:       data.nombreComercial ?? '',
          razon_social: data.razonSocial     ?? '',
          ruc:          data.ruc             ?? '',
          logo_url:     data.logoUrl         ?? '',
          logoPublicId: '',
          direccion:    data.direccion       ?? '',
          ciudad:       data.ciudad          ?? '',
          departamento: data.departamento    ?? '',
          telefono:     data.telefono        ?? '',
          email:        data.email           ?? '',
          web:          data.sitioWeb        ?? '',
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error empresa:', err);
        this.messageService.add({
          severity: 'error',
          summary:  'Error ' + err.status,
          detail:   err?.error?.message ?? err.message ?? 'No se pudo cargar.',
          life:     6000,
        });
      },
    });
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn', summary: 'Archivo muy grande',
        detail: 'El logo no debe superar 2MB.', life: 3000,
      });
      return;
    }

    this.logoFile.set(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.logoPreview.set(null);
    this.logoFile.set(null);
    this.form.logo_url    = '';
    this.form.logoPublicId = '';
  }

  guardar(): void {
    if (!this.form.nombre.trim() || !this.form.ruc.trim()) {
      this.messageService.add({
        severity: 'warn', summary: 'Campos requeridos',
        detail: 'El nombre y RUC son obligatorios.', life: 3000,
      });
      return;
    }

    this.guardando.set(true);

    const file = this.logoFile();

    if (file) {
      this.empresaService.uploadLogo(file).subscribe({
        next: ({ url, publicId }) => {
          this.form.logo_url     = url;
          this.form.logoPublicId = publicId;
          this.enviarPayload();
        },
        error: () => {
          this.guardando.set(false);
          this.messageService.add({
            severity: 'error', summary: 'Error al subir logo',
            detail: 'No se pudo subir la imagen. Intenta de nuevo.', life: 4000,
          });
        },
      });
    } else {
      this.enviarPayload();
    }
  }

  private enviarPayload(): void {
    const payload: UpdateEmpresaPayload = {
      nombreComercial: this.form.nombre,
      razonSocial:     this.form.razon_social  || undefined,
      ruc:             this.form.ruc,
      sitioWeb:        this.form.web           || undefined,
      direccion:       this.form.direccion     || undefined,
      ciudad:          this.form.ciudad        || undefined,
      departamento:    this.form.departamento  || undefined,
      telefono:        this.form.telefono      || undefined,
      email:           this.form.email         || undefined,
      logoUrl:         this.form.logo_url      || undefined,
      logoPublicId:    this.form.logoPublicId  || undefined,
    };

    this.empresaService.updateEmpresa(payload).subscribe({
      next: (data) => {
        this.guardando.set(false);
        this.logoFile.set(null);
        this.form.logo_url     = data.logoUrl ?? '';
        this.form.logoPublicId = '';
        this.logoPreview.set(null);
        this.messageService.add({
          severity: 'success',
          summary:  'Configuración guardada',
          detail:   'Los datos fueron actualizados en tiempo real.',
          life:     3000,
        });
      },
      error: (err) => {
        this.guardando.set(false);
        this.messageService.add({
          severity: 'error',
          summary:  'Error al guardar',
          detail:   err?.error?.message ?? 'No se pudo guardar.',
          life:     5000,
        });
      },
    });
  }
}