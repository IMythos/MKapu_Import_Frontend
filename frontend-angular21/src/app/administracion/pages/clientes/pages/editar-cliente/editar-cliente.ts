import { Component, inject, signal, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

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

import { ClienteService, CreateCustomerRequest, Customer } from '../../../../services/cliente.service';

interface TipoDocumento {
  documentTypeId: number;
  sunatCode:      string;
  description:    string;
}

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, DividerModule,
    InputTextModule, InputNumberModule, SelectModule,
    ConfirmDialogModule, ToastModule, MessageModule,
  ],
  templateUrl: './editar-cliente.html',
  styleUrl: './editar-cliente.css',
  providers: [ConfirmationService, MessageService],
})
export class EditarCliente implements OnInit {

  @ViewChild('clienteForm') clienteForm?: NgForm;

  private readonly clienteService      = inject(ClienteService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  readonly loading   = this.clienteService.loading;
  allowNavigate      = signal(false);
  submitted          = signal(false);
  tiposDocumento     = signal<TipoDocumento[]>([]);

  cliente = {
    nro_documento:         '',
    razon_social:          '',
    nombre_completo:       '',
    direccion:             '',
    email:                 '',
    telefono:              null as number | null,
    customerId:            '',
    documentTypeSunatCode: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/admin/clientes']); return; }

    this.clienteService.obtenerTiposDocumento().subscribe({
      next: tipos => {
        this.tiposDocumento.set(tipos);
        this.loadCliente(id);
      },
      error: () => {
        console.warn('No se pudieron cargar tipos de documento');
        this.loadCliente(id);
      },
    });
  }

  loadCliente(id: string): void {
    this.clienteService.getCustomerById(id).subscribe({
      next: (data: Customer) => {
        const esRuc = data.documentTypeSunatCode === '06';
        this.cliente = {
          nro_documento:         data.documentValue                              ?? '',
          razon_social:          esRuc ? (data.businessName ?? data.name ?? '') : '',
          nombre_completo:       !esRuc ? (data.name ?? '')                     : '',
          direccion:             data.address                                    ?? '',
          email:                 data.email                                      ?? '',
          telefono:              data.phone ? Number(data.phone)                : null,
          customerId:            data.customerId,
          documentTypeSunatCode: data.documentTypeSunatCode                      ?? '',
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'No se pudo cargar la información del cliente',
        });
        this.router.navigate(['/admin/clientes']);
      },
    });
  }

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

  onTipoDocumentoChange(): void {
    this.cliente.nro_documento   = '';
    this.cliente.nombre_completo = '';
    this.cliente.razon_social    = '';
    this.cliente.direccion       = '';
  }

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

  sanitizarNombreCompleto(): void {
    this.cliente.nombre_completo = this.cliente.nombre_completo
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/^\s+/, '')
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  sanitizarRazonSocial(): void {
    this.cliente.razon_social = this.cliente.razon_social
      .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
      .replace(/^\s+/, '')
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  sanitizarTexto(): void {
    this.cliente.direccion = this.cliente.direccion
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.,#-]/g, '')
      .replace(/^\s+/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  sanitizarDocumento(): void {
    let val = String(this.cliente.nro_documento ?? '');
    val = (this.esDNI || this.esRUC)
      ? val.replace(/\D/g, '')
      : val.replace(/[^a-zA-Z0-9]/g, '');
    this.cliente.nro_documento = val.slice(0, this.maxLengthDocumento).toUpperCase();
  }

  sanitizarEmail(): void {
    this.cliente.email = String(this.cliente.email ?? '')
      .replace(/\s/g, '')
      .toLowerCase();
  }

  get documentoValido(): boolean {
    const doc = this.cliente.nro_documento.trim();
    if (!doc) return false;
    if (this.esDNI) return /^\d{8}$/.test(doc);
    if (this.esRUC) return /^\d{11}$/.test(doc);
    return doc.length >= 3;
  }

  get emailValido(): boolean {
    const email = this.cliente.email.trim();
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get nombreCompletoValido(): boolean {
    return this.esRUC || this.cliente.nombre_completo.trim().length >= 2;
  }

  get razonSocialValida(): boolean {
    return !this.esRUC || this.cliente.razon_social.trim().length >= 3;
  }

  get formularioValido(): boolean {
    return (
      this.documentoValido &&
      this.emailValido &&
      this.telefonoValido &&
      this.nombreCompletoValido &&
      this.razonSocialValida &&
      this.cliente.direccion.trim().length >= 3
    );
  }

  editar(): void {
    this.submitted.set(true);
    this.sanitizarDocumento();
    this.sanitizarNombreCompleto();
    this.sanitizarRazonSocial();
    this.sanitizarTexto();
    this.sanitizarEmail();

    if (!this.formularioValido) {
      this.messageService.add({
        severity: 'warn', summary: 'Formulario incompleto',
        detail: 'Revisa los campos con errores antes de continuar.',
      });
      return;
    }

    const payload: Partial<CreateCustomerRequest> = {
      documentTypeId: this.getDocumentTypeId(this.cliente.documentTypeSunatCode),
      documentValue:  this.cliente.nro_documento.trim(),
      name:           this.esRUC
                        ? this.cliente.razon_social.trim()
                        : this.cliente.nombre_completo.trim(),
      businessName:   this.esRUC ? this.cliente.razon_social.trim() : undefined,
      address:        this.cliente.direccion.trim(),
      email:          this.cliente.email.trim() || undefined,
      phone:          this.cliente.telefono ? String(this.cliente.telefono) : undefined,
    };

    this.clienteService.updateCustomer(this.cliente.customerId, payload).subscribe({
      next: () => {
        this.allowNavigate.set(true);
        this.messageService.add({
          severity: 'success', summary: 'Edición Exitosa',
          detail: 'Los datos se actualizaron correctamente', life: 3000,
        });
        setTimeout(() => this.router.navigate(['/admin/clientes']), 1500);
      },
      error: () => {
        this.messageService.add({
          severity: 'error', summary: 'Error',
          detail: 'Ocurrió un problema al actualizar',
        });
      },
    });
  }

  confirmCancel(): void {
    if (!this.clienteForm?.dirty) { this.router.navigate(['/admin/clientes']); return; }
    this.confirmationService.confirm({
      header:       'Cambios sin guardar',
      message:      '¿Deseas descartar los cambios realizados?',
      icon:         'pi pi-exclamation-triangle',
      acceptLabel:  'Sí, salir',
      rejectLabel:  'Continuar editando',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.allowNavigate.set(true);
        this.router.navigate(['/admin/clientes']);
      },
    });
  }
}