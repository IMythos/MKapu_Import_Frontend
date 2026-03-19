import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// PrimeNG
import { Card }          from 'primeng/card';
import { Button }        from 'primeng/button';
import { Select }        from 'primeng/select';
import { TableModule }   from 'primeng/table';
import { Tag }           from 'primeng/tag';
import { Toast }         from 'primeng/toast';
import { InputText }     from 'primeng/inputtext';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CreditNoteService } from '../../../services/nota-credito.service';

// import { SalesReceiptService } from '../../../ventas/services/sales-receipt.service';

// Interfaces locales para el DTO de envío (basado en el backend)
export interface RegisterCreditNoteDto {
  salesReceiptId: number;
  reasonCode: string;       // Código SUNAT (Catálogo 09)
  reasonDescription: string; // Sustento
  items: any[];             // Ítems a devolver (RegisterCreditNoteItemDto)
}

@Component({
  selector: 'app-agregar-nota-credito',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    Select,
    TableModule,
    Tag,
    Toast,
    InputText,
    ConfirmDialog
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './agregar-nota-credito.html',
  styleUrl: './agregar-nota-credito.css', // Opcional si tienes estilos locales
})
export class AgregarNotaCreditoComponent implements OnInit, OnDestroy {
  // ── Inyecciones ──────────────────────────────────────────────────
  private readonly router              = inject(Router);
  private readonly creditNoteService   = inject(CreditNoteService);
  // private readonly salesService     = inject(SalesReceiptService);
  private readonly messageService      = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  private subscriptions = new Subscription();

  // ── Paso 1: Búsqueda de Comprobante ──────────────────────────────
  readonly tiposComprobante = [
    { label: 'Factura', value: '01' },
    { label: 'Boleta',  value: '03' }
  ];

  tipoComprobanteRef: string | null = null;
  serieCorrelativoRef: string = '';
  buscandoComprobante = false;
  ventaReferencia: any = null; // Reemplazar 'any' por tu SalesReceiptDetailDto

  // ── Paso 2: Motivo y Sustento (SUNAT Catálogo 09) ────────────────
  // Códigos estándar SUNAT para Notas de Crédito Electrónicas
  readonly motivosSunat = [
    { label: 'Anulación de la operación', value: '01' },
    { label: 'Anulación por error en el RUC', value: '02' },
    { label: 'Corrección por error en la descripción', value: '03' },
    { label: 'Descuento global', value: '04' },
    { label: 'Descuento por ítem', value: '05' },
    { label: 'Devolución total', value: '06' },
    { label: 'Devolución por ítem', value: '07' },
    { label: 'Bonificación', value: '08' },
    { label: 'Disminución en el valor', value: '09' }
  ];

  motivoSunatSeleccionado: string | null = null;
  sustentoDescripcion: string = '';

  // ── Paso 3: Emisión ──────────────────────────────────────────────
  guardandoNota = false;

  ngOnInit(): void {
    // Inicialización si es requerida
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Funciones Búsqueda (Paso 1) ──────────────────────────────────

  buscarComprobante(): void {
    if (!this.tipoComprobanteRef) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione el tipo de comprobante.' });
      return;
    }

    if (!this.serieCorrelativoRef || !this.serieCorrelativoRef.includes('-')) {
      this.messageService.add({ severity: 'warn', summary: 'Formato inválido', detail: 'Debe ingresar Serie y Correlativo separados por un guion (Ej: F001-000123).' });
      return;
    }

    this.buscandoComprobante = true;

    const [serie, correlativo] = this.serieCorrelativoRef.trim().split('-');

    // Aquí llamarías a tu servicio de ventas para buscar la factura/boleta
    /*
    const sub = this.salesService.findBySerie(serie, correlativo).subscribe({
      next: (res) => {
        this.ventaReferencia = res;
        this.buscandoComprobante = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.buscandoComprobante = false;
        this.messageService.add({ severity: 'error', summary: 'No encontrado', detail: 'No se encontró el comprobante indicado.' });
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(sub);
    */

    // MOCK SIMULANDO RESPUESTA DEL BACKEND
    setTimeout(() => {
      this.ventaReferencia = {
        id: 1045,
        clienteNombre: 'INVERSIONES EL SOL S.A.C.',
        clienteDocumento: '20123456789',
        fechaEmision: new Date('2026-03-10'),
        subTotal: 1000.00,
        igvTotal: 180.00,
        total: 1180.00,
        items: [
          { id: 1, descripcion: 'Monitor Teraware 24"', cantidad: 2, precioUnitario: 500.00, igv: 180.00, total: 1180.00 }
        ]
      };

      this.buscandoComprobante = false;
      this.messageService.add({ severity: 'success', summary: 'Encontrado', detail: 'Datos del comprobante cargados correctamente.' });
      this.cdr.markForCheck();
    }, 800);
  }

  limpiarBuscador(): void {
    this.ventaReferencia = null;
    this.motivoSunatSeleccionado = null;
    this.sustentoDescripcion = '';
    // No limpiamos los inputs de búsqueda por si el usuario solo quiere corregir un dígito
  }

  // ── Validaciones y Emisión (Paso 2 y 3) ──────────────────────────

  esFormularioValido(): boolean {
    return !!(
      this.ventaReferencia &&
      this.motivoSunatSeleccionado &&
      this.sustentoDescripcion.trim().length >= 5 // Mínimo 5 caracteres de sustento
    );
  }

  confirmarEmision(): void {
    if (!this.esFormularioValido()) return;

    this.confirmationService.confirm({
      header: 'Confirmar Emisión',
      message: `¿Está seguro que desea emitir la Nota de Crédito por S/. ${this.ventaReferencia.total.toFixed(2)}? Este proceso notificará a SUNAT.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Emitir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.emitirNotaCredito();
      }
    });
  }

  private emitirNotaCredito(): void {
    this.guardandoNota = true;

    // Construcción del Payload basado en el RegisterCreditNoteDto de tu backend
    const payload: RegisterCreditNoteDto = {
      salesReceiptId: this.ventaReferencia.id,
      reasonCode: this.motivoSunatSeleccionado!,
      reasonDescription: this.sustentoDescripcion.trim(),
      // Mapeamos los ítems originales para enviarlos a la nota de crédito
      items: this.ventaReferencia.items.map((item: any) => ({
        salesReceiptItemId: item.id,
        quantity: item.cantidad,
      }))
    };

    /* Descomentar cuando conectes el endpoint real
    const sub = this.creditNoteService.registrar(payload).subscribe({
      next: (res) => {
        this.guardandoNota = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Nota de Crédito Emitida',
          detail: 'El documento fue generado y enviado correctamente a SUNAT.',
          life: 4000
        });

        // Retornar al listado tras éxito
        setTimeout(() => this.volverListado(), 1500);
      },
      error: (err) => {
        this.guardandoNota = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Emisión',
          detail: err?.error?.message || 'Ocurrió un error al intentar emitir la nota de crédito.',
          life: 5000
        });
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.add(sub);
    */

    // MOCK SIMULANDO ÉXITO DE EMISIÓN
    setTimeout(() => {
      this.guardandoNota = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Nota de Crédito Emitida',
        detail: 'El documento fue generado correctamente.'
      });
      setTimeout(() => this.volverListado(), 1500);
    }, 1200);
  }

  // ── Navegación ───────────────────────────────────────────────────

  volverListado(): void {
    this.router.navigate(['/ventas/notas-credito']);
  }
}
