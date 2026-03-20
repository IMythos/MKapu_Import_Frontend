import { Component, OnInit, inject, signal } from '@angular/core';
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

interface TipoDocumento {
  documentTypeId: number;
  sunatCode:      string;
  description:    string;
}

@Component({
  selector: 'app-agregar-cliente',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, DividerModule,
    InputTextModule, InputNumberModule, SelectModule,
    ConfirmDialogModule, ToastModule, MessageModule,
  ],
  templateUrl: './agregar-cliente.html',
  styleUrl: './agregar-cliente.css',
  providers: [ConfirmationService, MessageService],
})
export class AgregarCliente implements OnInit {

  private readonly clienteService      = inject(ClienteService);
  private readonly router              = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService      = inject(MessageService);

  submitted        = signal(false);
  tiposDocumento   = signal<TipoDocumento[]>([]);
  reniecLoading    = signal(false);
  nombreDesdeApi   = signal(false);

  readonly loading = this.clienteService.loading;

  cliente = {
    documentTypeSunatCode: '',
    nro_documento:  '',
    razon_social:   '',
    nombres:        '',
    apellidos:      '',
    direccion:      '',
    email:          '',
    telefono:       null as number | null,
  };

  // ── Lifecycle ─────────────────────────────────────────────────────
  ngOnInit(): void {
    this.clienteService.obtenerTiposDocumento().subscribe({
      next: tipos => {
        this.tiposDocumento.set(tipos);
        const dni = tipos.find(t => t.sunatCode === '01');
        this.cliente.documentTypeSunatCode = dni?.sunatCode ?? tipos[0]?.sunatCode ?? '';
      },
      error: () => console.warn('No se pudieron cargar tipos de documento'),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────
  private getDocumentTypeId(sunatCode: string): number {
    const tipo = this.tiposDocumento().find(t => t.sunatCode === sunatCode);
    return tipo?.documentTypeId ?? 2;
  }

  get esRUC(): boolean { return this.cliente.documentTypeSunatCode === '06'; }
  get esDNI(): boolean { return this.cliente.documentTypeSunatCode === '01'; }

  get maxLengthDocumento(): number {
    switch (this.cliente.documentTypeSunatCode) {
      case '01': return 8;
      case '06': return 11;
      case '04': return 12;
      case '07': return 12;
      default:   return 15;
    }
  }

  // ── RENIEC / SUNAT ────────────────────────────────────────────────
  consultarDocumento(): void {
    const doc = this.cliente.nro_documento.trim();
    const esDniCompleto = this.esDNI && doc.length === 8;
    const esRucCompleto = this.esRUC && doc.length === 11;

    if (!esDniCompleto && !esRucCompleto) return;

    this.reniecLoading.set(true);
    this.nombreDesdeApi.set(false);

    this.clienteService.consultarDocumentoIdentidad(doc).subscribe({
      next: (res) => {
        this.reniecLoading.set(false);
        if (res?.nombreCompleto) {
          if (this.esRUC) {
            this.cliente.razon_social = res.nombreCompleto;
            if (res.direccion) this.cliente.direccion = res.direccion;
          } else {
            this.cliente.nombres   = res.nombres ?? '';
            this.cliente.apellidos = `${res.apellidoPaterno ?? ''} ${res.apellidoMaterno ?? ''}`.trim();
          }
          this.nombreDesdeApi.set(true);
          this.messageService.add({
            severity: 'success',
            summary: this.esRUC ? 'SUNAT' : 'RENIEC',
            detail: res.nombreCompleto,
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail: 'Ingrese el nombre manualmente.',
            life: 3000,
          });
        }
      },
      error: () => {
        this.reniecLoading.set(false);
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin conexión',
          detail: 'No se pudo consultar. Ingrese el nombre manualmente.',
          life: 3000,
        });
      },
    });
  }

  // ── Teléfono ──────────────────────────────────────────────────────
  get telefonoDigitos(): number {
    return this.cliente.telefono ? String(this.cliente.telefono).length : 0;
  }

  get telefonoValido(): boolean {
    if (this.cliente.telefono === null || this.cliente.telefono === undefined) return true;
    return String(this.cliente.telefono).replace(/\D/g, '').length === 9;
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
    if ((input.value?.replace(/\D/g, '') ?? '').length >= 9) event.preventDefault();
  }

  // ── Keyboards / Sanitizers ────────────────────────────────────────
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

  private cleanStringInput(s: string): string {
    if (!s) return '';
    return s.replace(/[\u200B\uFEFF]/g, '').replace(/^\s+/, '');
  }

  sanitizarSoloLetras(field: 'nombres' | 'apellidos' | 'razon_social'): void {
    let val = String((this.cliente as any)[field] ?? '');
    val = this.cleanStringInput(val)
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    (this.cliente as any)[field] = val;
  }

  sanitizarTexto(field: 'direccion'): void {
    let v = String((this.cliente as any)[field] ?? '');
    v = this.cleanStringInput(v)
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,#-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    (this.cliente as any)[field] = v;
  }

  sanitizarDocumento(): void {
    let val = this.cleanStringInput(String(this.cliente.nro_documento ?? ''));
    val = (this.esDNI || this.esRUC)
      ? val.replace(/\D/g, '')
      : val.replace(/[^a-zA-Z0-9]/g, '');
    this.cliente.nro_documento = val.slice(0, this.maxLengthDocumento).toUpperCase();
    this.nombreDesdeApi.set(false);
    this.consultarDocumento();
  }

  sanitizarEmail(): void {
    this.cliente.email = this.cleanStringInput(String(this.cliente.email ?? ''))
      .replace(/\s/g, '')
      .toLowerCase();
  }

  // ── Detección de concatenaciones ──────────────────────────────────
  private hasEmailLike(s: string): boolean {
    return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(s);
  }

  private hasPhoneLike(s: string): boolean {
    return /(\d[ \-]?){6,}/.test(s);
  }

  private looksTooConcatenated(s: string): boolean {
    const cleaned = String(s ?? '').trim();
    if (!cleaned) return false;
    return cleaned.replace(/\s+/g, '').length > 20 && cleaned.split(/\s+/).length <= 1;
  }

  private detectConcatenationIssues(): string[] {
    const issues: string[] = [];
    const c = this.cliente;
    if (this.looksTooConcatenated(c.nombres))   issues.push('El campo "NOMBRES" parece contener texto pegado sin separadores.');
    if (this.looksTooConcatenated(c.apellidos)) issues.push('El campo "APELLIDOS" parece contener texto pegado sin separadores.');
    if (this.looksTooConcatenated(c.direccion)) issues.push('La "DIRECCIÓN" parece contener texto pegado sin separadores.');
    if (this.hasEmailLike(c.nombres)  || this.hasPhoneLike(c.nombres))   issues.push('El campo "NOMBRES" contiene un email o teléfono.');
    if (this.hasEmailLike(c.apellidos) || this.hasPhoneLike(c.apellidos)) issues.push('El campo "APELLIDOS" contiene un email o teléfono.');
    if (!this.hasEmailLike(c.email) && c.email.trim().length > 0 && c.email.includes(' ')) {
      issues.push('El campo "EMAIL" contiene espacios o texto extraño.');
    }
    return issues;
  }

  // ── Validaciones ──────────────────────────────────────────────────
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

  get nombresValido():     boolean { return this.esRUC || String(this.cliente.nombres   ?? '').trim().length >= 2; }
  get apellidosValido():   boolean { return this.esRUC || String(this.cliente.apellidos ?? '').trim().length >= 2; }
  get razonSocialValida(): boolean { return !this.esRUC || String(this.cliente.razon_social ?? '').trim().length >= 3; }

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

  // ── Tipo documento change ─────────────────────────────────────────
  onTipoDocumentoChange(): void {
    this.cliente.nro_documento = '';
    this.cliente.nombres       = '';
    this.cliente.apellidos     = '';
    this.cliente.razon_social  = '';
    this.cliente.direccion     = '';
    this.nombreDesdeApi.set(false);
  }

  // ── Cancelar ──────────────────────────────────────────────────────
  confirmCancel(form?: NgForm): void {
    if (!form?.dirty) { this.router.navigate(['/admin/clientes']); return; }
    this.confirmationService.confirm({
      header:  'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. ¿Deseas salir?',
      icon:    'pi pi-exclamation-triangle',
      accept:  () => this.router.navigate(['/admin/clientes']),
      reject:  () => {},
    });
  }

  // ── Registrar ─────────────────────────────────────────────────────
  registrar(form?: NgForm): void {
    this.submitted.set(true);
    this.sanitizarDocumento();
    this.sanitizarSoloLetras('nombres');
    this.sanitizarSoloLetras('apellidos');
    this.sanitizarSoloLetras('razon_social');
    this.sanitizarTexto('direccion');
    this.sanitizarEmail();

    const issues = this.detectConcatenationIssues();
    if (issues.length > 0) {
      this.messageService.add({ severity: 'warn', summary: 'Revisa los campos', detail: issues[0], life: 6000 });
      return;
    }

    if (!this.formularioValido) {
      this.messageService.add({ severity: 'warn', summary: 'Formulario incompleto', detail: 'Revisa los campos obligatorios.' });
      return;
    }

    const payload: CreateCustomerRequest = {
      documentTypeId: this.getDocumentTypeId(this.cliente.documentTypeSunatCode),
      documentValue:  this.cliente.nro_documento.trim(),
      name:           this.cliente.nombres?.trim() || (this.esRUC ? this.cliente.razon_social?.trim() : '') || '',
      lastName:       !this.esRUC ? (this.cliente.apellidos?.trim() || null) : null,
      businessName:   this.esRUC  ? (this.cliente.razon_social?.trim() || null) : null,
      address:        this.cliente.direccion?.trim().toUpperCase() || null,
      email:          this.cliente.email?.trim() || null,
      phone:          this.cliente.telefono ? String(this.cliente.telefono) : null,
    };

    this.clienteService.createCustomer(payload).subscribe({
      next: (created) => {
        this.messageService.add({
          severity: 'success', summary: 'Registrado',
          detail: `Cliente ${created.displayName ?? created.documentValue} creado.`, life: 3000,
        });
        setTimeout(() => this.router.navigate(['/admin/clientes']), 600);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: err?.error?.message ?? 'No se pudo crear el cliente.',
        });
      },
    });
  }
}