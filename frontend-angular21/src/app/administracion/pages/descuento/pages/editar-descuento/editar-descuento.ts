import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject, OnInit, Directive, HostListener, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DiscountService } from '../../../../services/discount.service';
import { Discount } from '../../../../interfaces/discount.interface';
import { CanComponentDeactivate } from '../../../../../core/guards/pending-changes.guard';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { MessageModule } from 'primeng/message';

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
    if (allowedKeys.includes(event.key)) return true;
    if (!regex.test(event.key)) { event.preventDefault(); return false; }
    return true;
  }
  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): boolean {
    const pastedText = event.clipboardData?.getData('text') || '';
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
    if (!regex.test(pastedText)) { event.preventDefault(); return false; }
    return true;
  }
}

@Component({
  selector: 'app-editar-descuento',
  standalone: true,
  imports: [
    CommonModule,
    MessageModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    DividerModule,
    InputTextModule,
    InputNumberModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './editar-descuento.html',
  styleUrl: './editar-descuento.css',
})
export class EditarDescuento implements OnInit, CanComponentDeactivate {
  @ViewChild('descuentoForm') descuentoForm?: NgForm;

  private allowNavigate = false;
  submitted = false;
  descuentoId: number | null = null;

  descuento: Discount = {
    idDescuento: 0,
    nombre: '',
    porcentaje: 0,
    activo: false,
  };

  private readonly discountService = inject(DiscountService);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly loading = this.discountService.loading;
  readonly error = this.discountService.error;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const idFromParam = this.route.snapshot.paramMap.get('id');
    const idFromQuery = this.route.snapshot.queryParamMap.get('id');
    const idStr = idFromParam ?? idFromQuery;
    if (idStr) {
      this.descuentoId = parseInt(idStr, 10);
      this.loadDescuento();
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se recibió el ID del descuento.' });
    }
  }

  loadDescuento(): void {
    if (!this.descuentoId) return;
    this.discountService.getDescuentoById(this.descuentoId).subscribe({
      next: (desc) => {
        this.descuento = { ...desc };
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el descuento.',
        });
      },
    });
  }

  toUpperCase(field: 'nombre'): void {
    this.descuento[field] = this.descuento[field].toUpperCase();
  }

  onlyLetters(event: KeyboardEvent): boolean {
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/;
    return regex.test(event.key) || event.key === 'Backspace' || event.key === 'Tab';
  }

  updateDescuento(): void {
    this.submitted = true;

    if (!this.descuentoId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró el ID del descuento.',
      });
      return;
    }

    if (!(this.descuento.nombre && this.descuento.nombre.trim().length > 0)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nombre inválido',
        detail: 'El nombre no puede estar vacío.',
      });
      return;
    }

    if (
      typeof this.descuento.porcentaje !== 'number' ||
      this.descuento.porcentaje < 0 ||
      this.descuento.porcentaje > 100
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Porcentaje inválido',
        detail: 'El porcentaje debe estar entre 0 y 100.',
      });
      return;
    }

    const payload = {
      nombre: this.descuento.nombre.trim(),
      porcentaje: this.descuento.porcentaje,
      activo: this.descuento.activo,
    };

    this.discountService.updateDescuento(this.descuentoId, payload).subscribe({
      next: () => {
        // 🔥 Recarga los descuentos después de actualizar:
        this.discountService.loadDescuentos().subscribe();

        this.allowNavigate = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Descuento actualizado',
          detail: 'El descuento se actualizó correctamente.',
        });
        setTimeout(() => this.router.navigate(['/admin/descuentos']), 1500);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el descuento.',
        });
      },
    });
  }

  confirmCancel(): void {
    if (!this.descuentoForm?.dirty) {
      this.navigateWithToast();
      return;
    }

    this.confirmDiscardChanges().subscribe((confirmed: boolean) => {
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
      detail: 'Se canceló la edición del descuento.',
    });

    setTimeout(() => {
      this.router.navigate(['/admin/descuentos']);
    }, 1500);
  }
}