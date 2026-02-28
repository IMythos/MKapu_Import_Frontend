// agregar-sede.ts
import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, Directive, HostListener, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Message } from 'primeng/message';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { SedeService } from '../../../../services/sede.service';
import { DEPARTAMENTOS_PROVINCIAS } from '../../../../shared/data/departamentos-provincias';

// Directiva para bloquear números en autocomplete
@Directive({
  selector: '[appNoNumbers]',
  standalone: true
})
export class NoNumbersDirective {
  constructor(private el: ElementRef) {}

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(event.key)) {
      return true;
    }
    
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): boolean {
    const pastedText = event.clipboardData?.getData('text') || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    
    if (!regex.test(pastedText)) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }
}

@Component({
  selector: 'app-agregar-sede',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule,
    Message,
    AutoCompleteModule,
    NoNumbersDirective, 
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './agregar-sede.html',
  styleUrl: './agregar-sede.css',
})
export class AgregarSede implements CanComponentDeactivate {
  @ViewChild('sedeForm') sedeForm?: NgForm;

  private allowNavigate = false;
  submitted = false;

  sede = {
    codigo: '',
    nombre: '',
    departamento: '',
    provincia: '',
    ciudad: '',
    telefono: null as number | null,
    direccion: '',
  };

  departamentos = Object.keys(DEPARTAMENTOS_PROVINCIAS);
  filteredDepartamentos: string[] = [];

  provincias: string[] = [];
  filteredProvincias: string[] = [];

  distritos: string[] = [];
  filteredDistritos: string[] = [];

  private readonly sedeService = inject(SedeService);

  readonly loading = this.sedeService.loading;
  readonly error = this.sedeService.error;

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  toUpperCase(field: 'codigo' | 'nombre' | 'direccion'): void {
    this.sede[field] = this.sede[field].toUpperCase();
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }
  
  onlyNumbers(event: KeyboardEvent): boolean {
    const regex = /^[0-9]$/;
    const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    
    if (allowedKeys.includes(event.key)) {
      return true;
    }
    
    if (!regex.test(event.key)) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }
  filterDepartamentos(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredDepartamentos = this.departamentos.filter(dept =>
      dept.toLowerCase().includes(query)
    );
  }

  filterProvincias(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredProvincias = this.provincias.filter(prov =>
      prov.toLowerCase().includes(query)
    );
  }

  filterDistritos(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredDistritos = this.distritos.filter(dist =>
      dist.toLowerCase().includes(query)
    );
  }

  onDepartamentoSelect(): void {
    const dept = this.sede.departamento;
    const provinciasData = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    this.provincias = provinciasData.map(p => p.nombre);
    this.sede.provincia = '';
    this.sede.ciudad = '';
    this.distritos = [];
    this.filteredProvincias = [];
    this.filteredDistritos = [];
  }

  onProvinciaSelect(): void {
    const dept = this.sede.departamento;
    const prov = this.sede.provincia;
    const provinciasData = DEPARTAMENTOS_PROVINCIAS[dept] || [];
    const provinciaSeleccionada = provinciasData.find(p => p.nombre === prov);
    this.distritos = provinciaSeleccionada?.distritos || [];
    this.sede.ciudad = '';
    this.filteredDistritos = [];
  }

  saveSede(form: NgForm): void {
    this.submitted = true;

    if (form.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Completa los campos obligatorios para registrar la sede.',
      });
      return;
    }

    if (!this.departamentos.includes(this.sede.departamento)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Departamento inválido',
        detail: 'Seleccione un departamento de la lista.',
      });
      return;
    }

    if (!this.provincias.includes(this.sede.provincia)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Provincia inválida',
        detail: 'Seleccione una provincia de la lista.',
      });
      return;
    }

    if (!this.distritos.includes(this.sede.ciudad)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Distrito inválido',
        detail: 'Seleccione un distrito de la lista.',
      });
      return;
    }

    const telefonoStr = String(this.sede.telefono ?? '');
    if (telefonoStr.length !== 9) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Teléfono inválido',
        detail: 'El teléfono debe tener exactamente 9 dígitos.',
      });
      return;
    }

    const payload = {
      codigo: this.sede.codigo.trim().toUpperCase(),
      nombre: this.sede.nombre.trim().toUpperCase(),
      ciudad: this.sede.ciudad.trim(),
      departamento: this.sede.departamento.trim(),
      direccion: this.sede.direccion.trim().toUpperCase(),
      telefono: telefonoStr,
    };

    this.sedeService.createSede(payload, 'Administrador').subscribe({
      next: (created) => {
        this.allowNavigate = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Sede registrada',
          detail: `Se registró la sede ${created.nombre} (${created.codigo}).`,
        });
        this.router.navigate(['/admin/sedes']);
      },
      error: (error: unknown) => {
        const normalizedMessage = this.normalizeMessage(
          this.extractServerMessage(error),
        );
        const isDuplicateCode = this.isDuplicateCodeError(normalizedMessage);

        this.messageService.add({
          severity: isDuplicateCode ? 'warn' : 'error',
          summary: isDuplicateCode ? 'Validacion' : 'Error',
          detail: this.resolveCreateSedeErrorMessage(error),
          styleClass: isDuplicateCode ? 'duplicate-entity-toast' : undefined,
        });
      },
    });
  }

  confirmCancel(): void {
    if (!this.sedeForm?.dirty) {
      this.navigateWithToast();
      return;
    }

    this.confirmDiscardChanges().subscribe((confirmed) => {
      if (confirmed) {
        this.allowNavigate = true;
        this.navigateWithToast();
      }
    });
  }



  canDeactivate(): boolean | Observable<boolean> {
    if (this.allowNavigate || !this.sedeForm?.dirty) return true;
    return this.confirmDiscardChanges();
  }

  private confirmDiscardChanges(): Observable<boolean> {
    const result = new Subject<boolean>();

    this.confirmationService.confirm({
      header: 'Cambios sin guardar',
      message: 'Tienes cambios sin guardar. ¿Deseas salir?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Salir',
      rejectLabel: 'Continuar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        this.allowNavigate = true;
        result.next(true);
        result.complete();
      },
      reject: () => {
        result.next(false);
        result.complete();
      },
    });

    return result.asObservable();
  }

  private navigateWithToast(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Se canceló el registro de la sede.',
    });

    setTimeout(() => {
      this.router.navigate(['/admin/sedes']);
    }, 1500);
  }

  private resolveCreateSedeErrorMessage(error: unknown): string {
    const rawMessage = this.extractServerMessage(error);
    const normalized = this.normalizeMessage(rawMessage);

    if (this.isDuplicateCodeError(normalized)) {
      return 'Ya existe una sede con ese codigo.';
    }

    return 'No se pudo registrar la sede.';
  }

  private extractServerMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return '';
    }

    const candidate = error as {
      message?: unknown;
      error?:
        | {
            message?: unknown;
            error?: unknown;
          }
        | string;
    };

    if (typeof candidate.error === 'string') {
      return candidate.error;
    }

    if (candidate.error && typeof candidate.error === 'object') {
      const nestedMessage = candidate.error.message;
      if (Array.isArray(nestedMessage)) {
        return nestedMessage.filter(Boolean).join(' | ');
      }
      if (typeof nestedMessage === 'string') {
        return nestedMessage;
      }

      if (typeof candidate.error.error === 'string') {
        return candidate.error.error;
      }
    }

    if (typeof candidate.message === 'string') {
      return candidate.message;
    }

    return '';
  }

  private normalizeMessage(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private isDuplicateCodeError(message: string): boolean {
    const duplicateContext =
      message.includes('ya existe') ||
      message.includes('duplicate') ||
      message.includes('already exists') ||
      message.includes('duplicado');

    const codeField =
      message.includes('codigo') ||
      message.includes('code') ||
      message.includes('sede.codigo');

    return duplicateContext && codeField;
  }
}
