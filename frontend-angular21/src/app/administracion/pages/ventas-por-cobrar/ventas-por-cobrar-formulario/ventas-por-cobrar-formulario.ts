// ventas-por-cobrar-formulario.ts

import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import {
  AccountReceivableService,
  CreateAccountReceivablePayload,
} from '../../../services/account-receivable.service';
import { VentaService } from '../../../../ventas/services/venta.service';
import { firstValueFrom } from 'rxjs';

// ── Interfaces locales ────────────────────────────────────────────
interface PaymentType {
  id:          number;
  codSunat:    string;
  descripcion: string;
}

interface SunatCurrency {
  codigo:      string;
  descripcion: string;
}

@Component({
  selector: 'app-ventas-por-cobrar-formulario',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ToastModule, ButtonModule, CardModule, SelectModule,
    InputTextModule, InputNumberModule, DatePickerModule,
    TextareaModule, TooltipModule, TagModule,
  ],
  templateUrl: './ventas-por-cobrar-formulario.html',
  styleUrl: './ventas-por-cobrar-formulario.css',
})
export class VentasPorCobrarFormulario implements OnInit {

  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private messageService = inject(MessageService);
  private ventaService   = inject(VentaService);
  readonly arService     = inject(AccountReceivableService);

  isSubmitting = signal(false);

  // ── Signals para catálogos ────────────────────────────────────────
  tiposPago    = signal<PaymentType[]>([]);
  monedas      = signal<SunatCurrency[]>([]);
  loadingCatalogos = signal(false);

  readonly manana: Date = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  })();

  form: FormGroup = this.fb.group({
    salesReceiptId: [null, [Validators.required, Validators.min(1)]],
    userRef:        ['',   Validators.required],
    totalAmount:    [null, [Validators.required, Validators.min(0.01)]],
    dueDate:        [null, Validators.required],
    paymentTypeId:  [null, Validators.required],
    currencyCode:   ['PEN', Validators.required],
    observation:    [''],
  });

  // ── Init: carga catálogos desde el backend ────────────────────────
  async ngOnInit() {
    this.loadingCatalogos.set(true);
    try {
      const [tiposPago, monedas] = await Promise.all([
        firstValueFrom(this.ventaService.getPaymentTypes()),
        firstValueFrom(this.ventaService.getCurrencies()),
      ]);
      this.tiposPago.set(tiposPago);
      this.monedas.set(monedas);
    } catch {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No se pudieron cargar los catálogos.',
      });
    } finally {
      this.loadingCatalogos.set(false);
    }
  }

  async guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    const payload: CreateAccountReceivablePayload = {
      salesReceiptId: raw.salesReceiptId,
      userRef:        raw.userRef,
      totalAmount:    raw.totalAmount,
      dueDate:        this._formatDate(raw.dueDate),
      paymentTypeId:  raw.paymentTypeId,
      currencyCode:   raw.currencyCode,
      observation:    raw.observation?.trim() || undefined,
    };

    const res = await this.arService.create(payload);
    this.isSubmitting.set(false);

    if (res) {
      this.messageService.add({
        severity: 'success',
        summary: '¡Registrado!',
        detail: `Venta por cobrar #${res.id} creada correctamente.`,
      });
      setTimeout(() => this.router.navigate(['/admin/ventas-por-cobrar']), 1400);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: this.arService.error() ?? 'No se pudo crear la cuenta.',
      });
    }
  }

  cancelar() { this.router.navigate(['/admin/ventas-por-cobrar']); }

  private _formatDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  }

  isInvalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }
}