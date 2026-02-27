import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, Directive, ElementRef, HostListener } from '@angular/core';
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
import { DiscountService } from '../../../../services/discount.service';
import { Observable, Subject } from 'rxjs';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';

@Directive({
  selector: '[appNoNumbers]',
  standalone: true
})
export class NoNumbersDirective {
  constructor(private el: ElementRef) {}
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    const allowed = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight'];
    if (allowed.includes(event.key)) return true;
    if (!regex.test(event.key)) { event.preventDefault(); return false; }
    return true;
  }
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): boolean {
    const text = event.clipboardData?.getData('text') || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!regex.test(text)) { event.preventDefault(); return false; }
    return true;
  }
}

@Component({
  selector: 'app-agregar-descuento',
  imports: [
    CommonModule, FormsModule, RouterModule, ButtonModule, CardModule,
    DividerModule, InputTextModule, InputNumberModule,
    ConfirmDialogModule, ToastModule, Message,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './agregar-descuento.html',
  styleUrl: './agregar-descuento.css',
})
export class AgregarDescuento implements CanComponentDeactivate {
  @ViewChild('descuentoForm') descuentoForm?: NgForm;

  private allowNavigate = false;
  submitted = false;

  descuento = {
    nombre: '',
    porcentaje: null as number | null,
  };

  readonly loading = inject(DiscountService).loading;
  readonly error = inject(DiscountService).error;
  private readonly discountService = inject(DiscountService);

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  toUpperCase(field: 'nombre'): void {
    this.descuento[field] = this.descuento[field].toUpperCase();
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }

  saveDescuento(form: NgForm): void {
    this.submitted = true;

    if (form.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Completa los campos obligatorios para registrar el descuento.',
      });
      return;
    }

    const porcentaje = this.descuento.porcentaje ?? 0;
    if (porcentaje < 0 || porcentaje > 100) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Porcentaje inválido',
        detail: 'El porcentaje debe estar entre 0 y 100.',
      });
      return;
    }

    const payload = {
      nombre: this.descuento.nombre.trim().toUpperCase(),
      porcentaje: parseFloat(porcentaje.toString()),
    };

    this.discountService.createDescuento(payload).subscribe({
      next: created => {
        this.allowNavigate = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Descuento registrado',
          detail: `Se registró el descuento ${created.nombre}.`
        });
        this.router.navigate(['/admin/descuentos']);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo registrar el descuento.'
        });
      }
    });
  }

  confirmCancel(): void {
    if (!this.descuentoForm?.dirty) {
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
    if (this.allowNavigate || !this.descuentoForm?.dirty) return true;
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
      accept: () => { this.allowNavigate = true; result.next(true); result.complete(); },
      reject: () => { result.next(false); result.complete(); },
    });
    return result.asObservable();
  }

  private navigateWithToast(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Cancelado',
      detail: 'Se canceló el registro del descuento.',
    });
    setTimeout(() => {
      this.router.navigate(['/admin/descuentos']);
    }, 1500);
  }
}