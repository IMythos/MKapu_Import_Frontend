import { Component, inject, signal, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

// PrimeNG
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

const TIPOS_DOCUMENTO = [
  { cod_sunat: '00', descripcion: 'OTROS TIPOS DE DOCUMENTOS' },
  { cod_sunat: '01', descripcion: 'DOCUMENTO NACIONAL DE IDENTIDAD (DNI)' },
  { cod_sunat: '04', descripcion: 'CARNET DE EXTRANJERIA' },
  { cod_sunat: '06', descripcion: 'REGISTRO UNICO DE CONTRIBUYENTES' },
  { cod_sunat: '07', descripcion: 'PASAPORTE' },
];

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, CardModule, DividerModule,
    InputTextModule, InputNumberModule,
    SelectModule,                                         // ← añadir
    ConfirmDialogModule, ToastModule, MessageModule
  ],
  templateUrl: './editar-cliente.html',
  styleUrl: './editar-cliente.css',
  providers: [ConfirmationService, MessageService],
})
export class EditarCliente implements OnInit {
  @ViewChild('clienteForm') clienteForm?: NgForm;

  private readonly clienteService = inject(ClienteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private getDocumentTypeId(codSunat: string): number {
    const map: Record<string, number> = {
      '00': 1,
      '01': 2,
      '04': 3,
      '06': 4,
      '07': 5
    };
    return map[codSunat] ?? 2;
  }


  readonly loading = this.clienteService.loading;
  allowNavigate = signal(false);
  submitted = signal(false);

  readonly tiposDocumento = TIPOS_DOCUMENTO;

  cliente = {
    nro_documento: '',
    razon_social: '',
    nombres: '',
    apellidos: '',
    direccion: '',
    email: '',
    telefono: null as number | null,
    customerId: '',
    documentTypeSunatCode: '01'
  };

  // ── Getters ──────────────────────────────────────────────
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
    const digits = String(this.cliente.telefono).replace(/\D/g, '');
    return digits.length === 9;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCliente(id);
    } else {
      this.router.navigate(['/admin/clientes']);
    }
  }

  loadCliente(id: string): void {
    this.clienteService.getCustomerById(id).subscribe({
      next: (data: Customer) => {
        this.cliente = {
          nro_documento:         data.documentValue              ?? '',
          razon_social:          data.businessName               ?? '',
          nombres:               data.name                       ?? '',
          apellidos:             data.lastName                   ?? '',
          direccion:             data.address                    ?? '',
          email:                 data.email                      ?? '',
          telefono:              data.phone ? Number(data.phone) : null,
          customerId:            data.customerId,
          documentTypeSunatCode: data.documentTypeSunatCode
        };
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del cliente' });
        this.router.navigate(['/admin/clientes']);
      }
    });
  }

  onTipoDocumentoChange(): void {
    this.cliente.nro_documento = '';
    if (this.esRUC) {
      this.cliente.nombres = '';
      this.cliente.apellidos = '';
    } else {
      this.cliente.razon_social = '';
    }
  }

  onTelefonoChange(value: number | null): void {
    if (value === null) { this.cliente.telefono = null; return; }
    const digits = String(value).replace(/\D/g, '');
    if (digits.length > 9) {
      this.cliente.telefono = Number(digits.slice(0, 9));
    } else {
      this.cliente.telefono = value;
    }
  }

  onTelefonoKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowedKeys.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) { event.preventDefault(); return; }

    const input = event.target as HTMLInputElement;
    const current = input.value?.replace(/\D/g, '') ?? '';
    if (current.length >= 9) {
      event.preventDefault();
    }
  }

  soloLetras(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    if (!regex.test(event.key) && event.key.length === 1) {
      event.preventDefault();
      return false;
    }
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

  sanitizarTexto(campo: 'nro_documento' | 'razon_social' | 'nombres' | 'apellidos' | 'direccion'): void {
    let val = String((this.cliente as any)[campo] ?? '');
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, '');
    val = val.replace(/^\s+/, '');
    val = val.toUpperCase();
    (this.cliente as any)[campo] = val;
  }

  sanitizarSoloLetras(campo: 'nombres' | 'apellidos' | 'razon_social'): void {
    let val = String(this.cliente[campo] ?? '');
    val = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    val = val.replace(/^\s+/, '');
    val = val.toUpperCase();
    this.cliente[campo] = val;
  }

  sanitizarDocumento(): void {
    let val = this.cliente.nro_documento;
    if (this.esDNI || this.esRUC) {
      val = val.replace(/\D/g, '');
    } else {
      val = val.replace(/[^a-zA-Z0-9]/g, '');
    }
    val = val.slice(0, this.maxLengthDocumento);
    this.cliente.nro_documento = val.toUpperCase();
  }

  sanitizarEmail(): void {
    this.cliente.email = this.cliente.email.replace(/\s/g, '').toLowerCase();
  }

  get documentoValido(): boolean {
    const doc = this.cliente.nro_documento.trim();
    if (!doc) return false;
    if (this.esDNI)  return /^\d{8}$/.test(doc);
    if (this.esRUC)  return /^\d{11}$/.test(doc);
    return doc.length >= 3;
  }

  get emailValido(): boolean {
    const email = this.cliente.email.trim();
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  get nombresValido(): boolean {
    if (this.esRUC) return true;
    return this.cliente.nombres.trim().length >= 2;
  }

  get apellidosValido(): boolean {
    if (this.esRUC) return true;
    return this.cliente.apellidos.trim().length >= 2;
  }

  get razonSocialValida(): boolean {
    if (!this.esRUC) return true;
    return this.cliente.razon_social.trim().length >= 3;
  }

  get formularioValido(): boolean {
    return (
      this.documentoValido &&
      this.emailValido &&
      this.telefonoValido &&
      this.nombresValido &&
      this.apellidosValido &&
      this.razonSocialValida &&
      this.cliente.direccion.trim().length >= 3
    );
  }


  editar(): void {
    this.submitted.set(true);

    if (!this.formularioValido) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Revisa los campos con errores antes de continuar.'
      });
      return;
    }
    const tipoDoc = this.tiposDocumento.find(t => t.cod_sunat === this.cliente.documentTypeSunatCode);

    const payload: Partial<CreateCustomerRequest> = {
      documentTypeId: tipoDoc ? this.getDocumentTypeId(this.cliente.documentTypeSunatCode) : undefined,
      documentValue:  this.cliente.nro_documento.trim(),
      businessName:   this.esRUC ? this.cliente.razon_social.trim() : undefined,
      name:           !this.esRUC ? this.cliente.nombres.trim() : undefined,
      lastName:       !this.esRUC ? this.cliente.apellidos.trim() : undefined,
      address:        this.cliente.direccion.trim(),
      email:          this.cliente.email.trim() || undefined,
      phone:          this.cliente.telefono ? String(this.cliente.telefono) : undefined
    };

    this.clienteService.updateCustomer(this.cliente.customerId, payload).subscribe({
      next: () => {
        this.allowNavigate.set(true);
        this.messageService.add({ severity: 'success', summary: 'Edición Exitosa', detail: 'Los datos se actualizaron correctamente', life: 3000 });
        setTimeout(() => this.router.navigate(['/admin/clientes']), 1500);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema al actualizar' });
      }
    });
  }




  confirmCancel(): void {
    if (!this.clienteForm?.dirty) { this.router.navigate(['/admin/clientes']); return; }

    this.confirmationService.confirm({
      header: 'Cambios sin guardar',
      message: '¿Deseas descartar los cambios realizados?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Continuar editando',
      acceptButtonProps: { severity: 'danger' },
      accept: () => {
        this.allowNavigate.set(true);
        this.router.navigate(['/admin/clientes']);
      }
    });
  }
}