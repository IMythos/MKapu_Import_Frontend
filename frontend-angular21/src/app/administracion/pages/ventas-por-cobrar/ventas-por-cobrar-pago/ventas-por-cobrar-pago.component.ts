import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators,
  ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule }         from 'primeng/toast';
import { ButtonModule }        from 'primeng/button';
import { CardModule }          from 'primeng/card';
import { InputTextModule }     from 'primeng/inputtext';
import { InputNumberModule }   from 'primeng/inputnumber';
import { TagModule }           from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { firstValueFrom }      from 'rxjs';

import {
  AccountReceivableService,
  AccountReceivableResponse,
  AccountReceivableStatus,
} from '../../../services/account-receivable.service';
import { VentasAdminService } from '../../../services/ventas.service';

@Component({
  selector: 'app-ventas-por-cobrar-pago',
  standalone: true,
  providers: [MessageService, ConfirmationService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ToastModule, ButtonModule, CardModule,
    InputTextModule, InputNumberModule,
    TagModule, ConfirmDialogModule,
  ],
  templateUrl: './ventas-por-cobrar-pago.component.html',
  styleUrl:    './ventas-por-cobrar-pago.component.css',
})
export class VentasPorCobrarPagoComponent implements OnInit {

  private fb                  = inject(FormBuilder);
  private router              = inject(Router);
  private route               = inject(ActivatedRoute);
  private messageService      = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private ventasService       = inject(VentasAdminService); 
  readonly arService          = inject(AccountReceivableService);

  isSubmitting = signal(false);
  pasoActual    = signal<string | null>(null); 
  cuenta       = computed(() => this.arService.selected());

  porcentajePagado = computed(() => {
    const c = this.cuenta();
    if (!c || !c.totalAmount) return 0;
    return Math.min(100, (c.paidAmount / c.totalAmount) * 100);
  });

  nuevoSaldo = computed(() => {
    const pendiente = this.cuenta()?.pendingBalance ?? 0;
    const monto     = this.form?.get('amount')?.value ?? 0;
    return Math.max(0, pendiente - monto);
  });

  form: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
  });

  async ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/admin/ventas-por-cobrar']); return; }

    await this.arService.getById(id);

    if (!this.cuenta()) {
      this.messageService.add({
        severity: 'error', summary: 'No encontrada',
        detail: `No se encontró la cuenta #${id}.`,
      });
      setTimeout(() => this.router.navigate(['/admin/ventas-por-cobrar']), 1500);
      return;
    }

    this._setMaxValidator();
  }

  pagarSaldoCompleto() {
    this.form.patchValue({ amount: this.cuenta()?.pendingBalance ?? 0 });
    this.form.get('amount')?.markAsTouched();
  }

  async guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    if (this.nuevoSaldo() <= 0) {
      this.confirmationService.confirm({
        message:
          'El comprobante pasará a <strong>EMITIDO</strong> y se descontará el stock. ¿Confirmas?',
        header:      'Confirmar Pago Final',
        icon:        'pi pi-check-circle',
        acceptLabel: 'Sí, confirmar',
        rejectLabel: 'Revisar',
        accept: () => void this._ejecutarPago(),
      });
    } else {
      await this._ejecutarPago();
    }
  }

  cancelar() { this.router.navigate(['/admin/ventas-por-cobrar']); }

    private async _ejecutarPago() {
    this.isSubmitting.set(true);
    const { amount }  = this.form.getRawValue();
    const cuenta      = this.cuenta()!;
    const esPagoFinal = amount >= cuenta.pendingBalance;

    try {
        this.pasoActual.set('Registrando pago...');
        const res = await this.arService.applyPayment({
        accountReceivableId: cuenta.id,
        amount,
        currencyCode: cuenta.currencyCode,
        });
        if (!res) throw new Error(this.arService.error() ?? 'Error al aplicar pago');

        if (esPagoFinal) {
        this.pasoActual.set('Emitiendo comprobante y descontando stock...');
        await firstValueFrom(
            this.ventasService.emitirComprobante(cuenta.salesReceiptId)
        );
        }

        this.pasoActual.set(null);
        this.messageService.add({
        severity: 'success',
        summary:  esPagoFinal ? '¡Cuenta saldada!' : 'Abono registrado',
        detail:   esPagoFinal
            ? 'Pago completado. Comprobante EMITIDO y stock descontado.'
            : `Abono de ${cuenta.currencyCode} ${amount.toFixed(2)} aplicado.`,
        });

        await this.arService.getById(cuenta.id);
        this.form.reset();
        this._setMaxValidator();

        if (esPagoFinal) {
        setTimeout(() => this.router.navigate(['/admin/ventas-por-cobrar']), 1800);
        }

    } catch (err: any) {
        this.pasoActual.set(null);
        this.messageService.add({
        severity: 'error',
        summary:  'Error al registrar pago',
        detail:   err?.message ?? 'No se pudo procesar el pago.',
        });
    } finally {
        this.isSubmitting.set(false);
    }
    }

    private _setMaxValidator() {
        const max = this.cuenta()?.pendingBalance ?? 0;
        this.form.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(max),
        ]);
        this.form.get('amount')?.updateValueAndValidity();
    }

  // ── Helpers visuales ─────────────────────────────────────────────

  getTagClass(status: AccountReceivableStatus): string {
    switch (status) {
      case 'PENDIENTE': return 'cotizaciones-tag-amarillo';
      case 'PARCIAL':   return 'cotizaciones-tag-parcial';
      case 'PAGADO':    return 'cotizaciones-tag-aprobada';
      case 'VENCIDO':   return 'cotizaciones-tag-vencido';
      case 'CANCELADO': return 'cotizaciones-tag-rechazada';
      default:          return 'cotizaciones-tag-amarillo';
    }
  }

  getDiasBadgeClass(dueDate: string): string {
    const d = this._calcDias(dueDate);
    if (d < 0)   return 'dias-badge dias-badge--vencido';
    if (d === 0) return 'dias-badge dias-badge--hoy';
    if (d <= 3)  return 'dias-badge dias-badge--urgente';
    if (d <= 7)  return 'dias-badge dias-badge--proximo';
    return 'dias-badge dias-badge--ok';
  }

  getDiasBadgeLabel(dueDate: string): string {
    const d = this._calcDias(dueDate);
    if (d < 0)   return `Vencido ${Math.abs(d)}d`;
    if (d === 0) return 'Hoy';
    return `${d}d`;
  }

  formatDate(iso: string | Date): string {
    return new Date(iso).toLocaleDateString('es-PE');
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  private _calcDias(dueDate: string | Date): number {
    const hoy  = new Date(); hoy.setHours(0, 0, 0, 0);
    const venc = new Date(dueDate); venc.setHours(0, 0, 0, 0);
    return Math.round((venc.getTime() - hoy.getTime()) / 86_400_000);
  }
}