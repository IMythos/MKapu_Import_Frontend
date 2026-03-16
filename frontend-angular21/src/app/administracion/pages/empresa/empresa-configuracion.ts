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

export interface EmpresaConfig {
  nombre:       string;
  razon_social: string;
  ruc:          string;
  logo_url:     string;
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

  loading  = signal(false);
  guardando = signal(false);
  logoPreview = signal<string | null>(null);

  form: EmpresaConfig = {
    nombre:       '',
    razon_social: '',
    ruc:          '',
    logo_url:     '',
    direccion:    '',
    ciudad:       '',
    departamento: '',
    telefono:     '',
    email:        '',
    web:          '',
  };

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading.set(true);
    // TODO: reemplazar con tu servicio real
    // this.empresaService.getConfig().subscribe(...)
    setTimeout(() => {
      // Simulación — reemplaza con datos reales del API
      this.form = {
        nombre:       'Mkapu Import',
        razon_social: 'Mkapu Import S.A.C.',
        ruc:          '20612345678',
        logo_url:     '',
        direccion:    'Av. Principal 123',
        ciudad:       'Lima',
        departamento: 'Lima',
        telefono:     '+51 987 654 321',
        email:        'contacto@mkapu.com',
        web:          'www.mkapu.com',
      };
      this.loading.set(false);
    }, 600);
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

    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.set(e.target?.result as string);
      this.form.logo_url = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  quitarLogo(): void {
    this.logoPreview.set(null);
    this.form.logo_url = '';
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
    // TODO: reemplazar con tu servicio real
    // this.empresaService.updateConfig(this.form).subscribe(...)
    setTimeout(() => {
      this.guardando.set(false);
      this.messageService.add({
        severity: 'success', summary: 'Configuración guardada',
        detail: 'Los datos de la empresa fueron actualizados.', life: 3000,
      });
    }, 800);
  }
}