import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';

import { ConfirmationService, MessageService } from 'primeng/api';

import { ClienteService, CreateCustomerRequest } from '../../../../services/cliente.service';

const TIPOS_DOCUMENTO = [
  { cod_sunat: '00', descripcion: 'OTROS TIPOS DE DOCUMENTOS' },
  { cod_sunat: '01', descripcion: 'DOCUMENTO NACIONAL DE IDENTIDAD (DNI)' },
  { cod_sunat: '04', descripcion: 'CARNET DE EXTRANJERIA' },
  { cod_sunat: '06', descripcion: 'REGISTRO UNICO DE CONTRIBUYENTES' },
  { cod_sunat: '07', descripcion: 'PASAPORTE' },
];

@Component({
  selector: 'app-agregar-cliente',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ConfirmDialogModule,
    ToastModule,
    MessageModule,
  ],
  templateUrl: './agregar-cliente.html',
  styleUrl: './agregar-cliente.css',
  providers: [ConfirmationService, MessageService],
})
export class AgregarCliente {
  private readonly clienteService = inject(ClienteService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  submitted = signal(false);
  readonly loading = this.clienteService.loading;

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  cliente = {
    documentTypeSunatCode: '01',
    nro_documento: '',
    razon_social: '',
    nombres: '',
    apellidos: '',
    direccion: '',
    email: '',
    telefono: null as number | null,
  };

  // helpers
  private getDocumentTypeId(codSunat: string): number {
    const map: Record<string, number> = { '00': 1, '01': 2, '04': 3, '06': 4, '07': 5 };
    return map[codSunat] ?? 2;
  }

  get esRUC(): boolean { return this.cliente.documentTypeSunatCode === '06'; }
  get esDNI(): boolean { return this.cliente.documentTypeSunatCode === '01'; }

  get maxLengthDocumento(): number {
    switch (this.cliente.documentTypeSunatCode) {
      case '01': return 8;
      case '06': return 11;
      case '04': return 12;
      case '07': return 12;
      default: return 15;
    }
  }

  // teléfono helpers
  get telefonoDigitos(): number { return this.cliente.telefono ? String(this.cliente.telefono).length : 0; }
  get telefonoValido(): boolean {
    if (this.cliente.telefono === null || this.cliente.telefono === undefined) return true;
    const digits = String(this.cliente.telefono).replace(/\D/g, '');
    return digits.length === 9;
  }
  onTelefonoChange(value: number | null): void {
    if (value === null) { this.cliente.telefono = null; return; }
    const digits = String(value).replace(/\D/g, '');
    this.cliente.telefono = digits.length > 9 ? Number(digits.slice(0, 9)) : Number(digits);
  }
  onTelefonoKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    const current = input.value?.replace(/\D/g, '') ?? '';
    if (current.length >= 9) event.preventDefault();
  }

  // keyboards / sanitizers
  soloLetras(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    if (!regex.test(event.key) && event.key.length === 1) { event.preventDefault(); return false; }
    return true;
  }

  soloDocumento(event: KeyboardEvent): boolean {
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return true;
    if (this.esDNI || this.esRUC) {
      if (!/^\d$/.test(event.key)) { event.preventDefault(); return false; }
    } else {
      if (!/^[a-zA-Z0-9]$/.test(event.key)) { event.preventDefault(); return false; }
    }
    const input = event.target as HTMLInputElement;
    if (input.value.length >= this.maxLengthDocumento) { event.preventDefault(); return false; }
    return true;
  }

  // Remove invisible characters (zero-width, BOM) and trim leading spaces
  private cleanStringInput(s: string): string {
    if (!s) return '';
    return s.replace(/[\u200B\uFEFF]/g, '').replace(/^\s+/, '');
  }

  sanitizarSoloLetras(field: 'nombres' | 'apellidos' | 'razon_social') {
    let val = String((this.cliente as any)[field] ?? '');
    val = this.cleanStringInput(val);
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    val = val.replace(/\s+/g, ' ');
    val = val.trim();
    val = val.toUpperCase();
    (this.cliente as any)[field] = val;
  }

  sanitizarTexto(field: 'direccion') {
    let v = String((this.cliente as any)[field] ?? '');
    v = this.cleanStringInput(v);
    v = v.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,#-]/g, '');
    v = v.replace(/\s+/g, ' ');
    v = v.trim();
    (this.cliente as any)[field] = v.toUpperCase(); // <- convertir a MAYÚSCULAS
  }

  sanitizarDocumento(): void {
    let val = String(this.cliente.nro_documento ?? '');
    val = this.cleanStringInput(val);
    if (this.esDNI || this.esRUC) val = val.replace(/\D/g, '');
    else val = val.replace(/[^a-zA-Z0-9]/g, '');
    val = val.slice(0, this.maxLengthDocumento);
    this.cliente.nro_documento = val.toUpperCase();
  }

  sanitizarEmail(): void {
    let v = String(this.cliente.email ?? '');
    v = this.cleanStringInput(v);
    v = v.replace(/\s/g, '').toLowerCase();
    this.cliente.email = v;
  }

  // Heuristics to detect concatenated inputs or embedded email/phone
  private hasEmailLike(s: string): boolean {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(s);
  }
  private hasPhoneLike(s: string): boolean {
    return /(\d[ \-]?){6,}/.test(s);
  }
  private looksTooConcatenated(s: string): boolean {
    const cleaned = String(s ?? '').trim();
    if (!cleaned) return false;
    const noSpaces = cleaned.replace(/\s+/g, '');
    return noSpaces.length > 20 && (cleaned.split(/\s+/).length <= 1);
  }
  private detectConcatenationIssues(): string[] {
    const issues: string[] = [];
    const c = this.cliente;
    if (this.looksTooConcatenated(c.nombres)) issues.push('El campo "NOMBRES" parece contener texto pegado sin separadores.');
    if (this.looksTooConcatenated(c.apellidos)) issues.push('El campo "APELLIDOS" parece contener texto pegado sin separadores.');
    if (this.looksTooConcatenated(c.direccion)) issues.push('La "DIRECCIÓN" parece contener texto pegado sin separadores.');
    if (this.hasEmailLike(c.nombres) || this.hasPhoneLike(c.nombres)) issues.push('El campo "NOMBRES" contiene un email o teléfono; revisa que no hayas pegado varios campos.');
    if (this.hasEmailLike(c.apellidos) || this.hasPhoneLike(c.apellidos)) issues.push('El campo "APELLIDOS" contiene un email o teléfono; revisa que no hayas pegado varios campos.');
    if (!this.hasEmailLike(c.email) && String(c.email ?? '').trim().length > 0 && c.email.indexOf(' ') >= 0) {
      issues.push('El campo "EMAIL" contiene espacios o texto extraño.');
    }
    return issues;
  }

  // validations
  get documentoValido(): boolean {
    const doc = String(this.cliente.nro_documento ?? '').trim();
    if (!doc) return false;
    if (this.esDNI) return /^\d{8}$/.test(doc);
    if (this.esRUC) return /^\d{11}$/.test(doc);
    return doc.length >= 3;
  }
  get emailValido(): boolean {
    const email = String(this.cliente.email ?? '').trim();
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  get nombresValido(): boolean { if (this.esRUC) return true; return String(this.cliente.nombres ?? '').trim().length >= 2; }
  get apellidosValido(): boolean { if (this.esRUC) return true; return String(this.cliente.apellidos ?? '').trim().length >= 2; }
  get razonSocialValida(): boolean { if (!this.esRUC) return true; return String(this.cliente.razon_social ?? '').trim().length >= 3; }
  get formularioValido(): boolean {
    return (
      this.documentoValido &&
      this.emailValido &&
      this.telefonoValido &&
      this.nombresValido &&
      this.apellidosValido &&
      this.razonSocialValida &&
      String(this.cliente.direccion ?? '').trim().length >= 3
    );
  }

  // tipo cambio
  onTipoDocumentoChange(): void {
    this.cliente.nro_documento = '';
    if (this.esRUC) {
      this.cliente.nombres = '';
      this.cliente.apellidos = '';
    } else {
      this.cliente.razon_social = '';
    }
  }

  // confirm cancel
  confirmCancel(form?: NgForm) {
    if (!form?.dirty) { this.router.navigate(['/admin/clientes']); return; }
    this.confirmationService.confirm({
      header: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. ¿Deseas salir?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.router.navigate(['/admin/clientes']),
      reject: () => {}
    });
  }

  registrar(form?: NgForm) {
    this.submitted.set(true);

    this.sanitizarDocumento();
    this.sanitizarSoloLetras('nombres');
    this.sanitizarSoloLetras('apellidos');
    this.sanitizarSoloLetras('razon_social');
    this.sanitizarTexto('direccion');
    this.sanitizarEmail();

    // detección de concatenaciones (si la tienes)
    const issues = this.detectConcatenationIssues?.() ?? [];
    if (issues.length > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Revisa los campos', detail: issues[0], life: 6000 });
      return;
    }

    if (!this.formularioValido) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Revisa los campos obligatorios.' });
      return;
    }

    const computedName = (this.cliente.nombres?.trim()) || (this.esRUC ? (this.cliente.razon_social?.trim() || '') : '');

    const payload: CreateCustomerRequest = {
      documentTypeId: this.getDocumentTypeId(this.cliente.documentTypeSunatCode),
      documentValue: this.cliente.nro_documento.trim(),

      name: computedName,

      lastName: !this.esRUC ? (this.cliente.apellidos?.trim() || null) : null,

      businessName: this.esRUC ? (this.cliente.razon_social?.trim() || null) : null,

      address: (this.cliente.direccion?.trim() || '').toUpperCase() || null,

      email: this.cliente.email?.trim() || null,
      phone: this.cliente.telefono ? String(this.cliente.telefono) : null,
    };

    this.clienteService.createCustomer(payload).subscribe({
      next: (created) => {
        this.messageService.add({ severity: 'success', summary: 'Registrado', detail: `Cliente ${created.displayName ?? created.documentValue} creado.`, life: 3000 });
        setTimeout(() => this.router.navigate(['/admin/clientes']), 600);
      },
      error: (err) => {
        console.error('Error creando cliente', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'No se pudo crear el cliente.' });
      }
    });
  }
}