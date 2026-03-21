import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';

import { VentasApiService } from '../../../../ventas/services/ventas-api.service';
import { CreditNoteService, RegisterCreditNoteDto } from '../../../services/nota-credito.service';
import { StockSocketService } from '../../../../ventas/services/stock-socket.service';

// 👇 Importa aquí tu nuevo servicio de Sockets

interface VentaItemUI {
  id_detalle: number;
  descripcion: string;
  cantidadOriginal: number;
  precioUnitario: number;
  cantidadADevolver: number;
  seleccionado: boolean;
}

@Component({
  selector: 'app-agregar-nota-credito',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    InputTextModule,
    ConfirmDialogModule,
    InputNumberModule,
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './agregar-nota-credito.html',
  styleUrl: './agregar-nota-credito.css',
})
export class AgregarNotaCreditoComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly creditNoteService = inject(CreditNoteService);
  private readonly ventasService = inject(VentasApiService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly cdr = inject(ChangeDetectorRef);
  
  private readonly stockSocket = inject(StockSocketService);

  private subscriptions = new Subscription();

  readonly tiposComprobante = [
    { label: 'Factura', value: '01' },
    { label: 'Boleta', value: '03' },
  ];

  tipoComprobanteRef: string | null = null;
  serieCorrelativoRef: string = '';
  buscandoComprobante = false;

  ventaReferenciaCabecera: any = null;
  itemsVenta: VentaItemUI[] = [];

  readonly motivosSunat = [
    { label: 'Anulación de la operación', value: '01' },
    { label: 'Anulación por error en el RUC', value: '02' },
    { label: 'Corrección por error en la descripción', value: '03' },
    { label: 'Descuento global', value: '04' },
    { label: 'Descuento por ítem', value: '05' },
    { label: 'Devolución total', value: '06' },
    { label: 'Devolución por ítem', value: '07' },
    { label: 'Bonificación', value: '08' },
    { label: 'Disminución en el valor', value: '09' },
  ];

  motivoSunatSeleccionado: string | null = null;
  sustentoDescripcion: string = '';

  guardandoNota = false;

  private stockListener = (data: any) => {
    this.messageService.add({
      severity: 'info',
      summary: 'Inventario Actualizado',
      detail: `Se devolvieron ${data.quantity} unidades del producto ID: ${data.productId} al almacén.`,
      life: 6000
    });
    this.cdr.markForCheck();
  };

  ngOnInit(): void {
    this.stockSocket.onStockActualizado(this.stockListener);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stockSocket.offStockActualizado(this.stockListener);
  }

  buscarComprobante(): void {
    if (!this.tipoComprobanteRef) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el tipo de comprobante.' });
      return;
    }
    if (!this.serieCorrelativoRef || !this.serieCorrelativoRef.includes('-')) {
      this.messageService.add({ severity: 'error', summary: 'Formato inválido', detail: 'Use el formato Serie-Número (Ej: F001-123).' });
      return;
    }

    this.buscandoComprobante = true;
    this.limpiarBuscadorBase();
    
    const correlativoLimpio = this.serieCorrelativoRef.trim().toUpperCase();

    const sub = this.ventasService.getSaleReceiptByCorrelative(correlativoLimpio).subscribe({
      next: (res: any) => {
        const cabecera = res;
        const listaProductos = res.detalles || [];

        const esFactura = correlativoLimpio.startsWith('F');
        if (
          (this.tipoComprobanteRef === '01' && !esFactura) ||
          (this.tipoComprobanteRef === '03' && esFactura)
        ) {
          this.buscandoComprobante = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Coherencia',
            detail: 'El tipo seleccionado no coincide con la serie buscada.',
          });
          return;
        }

        const totalComprobante = Number(cabecera.total || 0);
        const subtotalCalculado = totalComprobante / 1.18; 
        const igvCalculado = totalComprobante - subtotalCalculado;

        this.ventaReferenciaCabecera = {
          id: cabecera.id,
          clienteNombre: cabecera.nombre_cliente || 'Cliente sin nombre',
          clienteDocumento: cabecera.cliente_documento || '—',
          fechaEmision: cabecera.fec_emision,
          total: totalComprobante,
          subtotal: subtotalCalculado,
          igv: igvCalculado            
        };

        this.itemsVenta = listaProductos.map((p: any) => {
          const precio = Number(p.peso_unitario || p.precio_unitario || 0);
          
          return {
            id_detalle: p.id_producto,
            descripcion: p.descripcion || p.cod_prod || 'Producto Desconocido',
            cantidadOriginal: Number(p.cantidad || 0),
            precioUnitario: precio,
            cantidadADevolver: 0,
            seleccionado: false,
          };
        });

        this.buscandoComprobante = false;
        this.cdr.markForCheck();

        if (this.itemsVenta.length > 0) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Comprobante y productos cargados.',
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Atención',
            detail: 'El comprobante no tiene productos vinculados.',
          });
        }
      },
      error: (err) => {
        this.buscandoComprobante = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No encontrado',
          detail: 'No se pudo localizar el comprobante.',
        });
        this.cdr.markForCheck();
      },
    });
    this.subscriptions.add(sub);
  }

  limpiarBuscadorBase(): void {
    this.ventaReferenciaCabecera = null;
    this.itemsVenta = [];
    this.motivoSunatSeleccionado = null;
    this.sustentoDescripcion = '';
  }

  onMotivoChange(): void {
    if (this.motivoSunatSeleccionado === '01' || this.motivoSunatSeleccionado === '06') {
      this.itemsVenta.forEach((item) => {
        item.seleccionado = true;
        item.cantidadADevolver = item.cantidadOriginal;
      });
    } else {
      this.itemsVenta.forEach((item) => {
        item.seleccionado = false;
        item.cantidadADevolver = 0;
      });
    }
  }

  onCantidadChange(item: VentaItemUI): void {
    if (item.cantidadADevolver > item.cantidadOriginal) {
      item.cantidadADevolver = item.cantidadOriginal;
    }
    if (item.cantidadADevolver < 0) {
      item.cantidadADevolver = 0;
    }

    item.seleccionado = item.cantidadADevolver > 0;
  }

  onCheckboxChange(item: VentaItemUI): void {
    if (item.seleccionado && item.cantidadADevolver === 0) {
      item.cantidadADevolver = 1;
    } else if (!item.seleccionado) {
      item.cantidadADevolver = 0;
    }
  }


  esFormularioValido(): boolean {
    const hayItemsSeleccionados = this.itemsVenta.some(
      (i) => i.seleccionado && i.cantidadADevolver > 0,
    );
    return !!(
      this.ventaReferenciaCabecera &&
      this.motivoSunatSeleccionado &&
      this.sustentoDescripcion.trim().length >= 5 &&
      hayItemsSeleccionados
    );
  }

  confirmarEmision(): void {
    if (!this.esFormularioValido()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Verifique motivo, sustento (mín. 5 chars) y que haya productos seleccionados.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar Emisión a SUNAT',
      message: `¿Está seguro que desea emitir la Nota de Crédito? Esta acción no se puede deshacer y el documento será enviado a SUNAT de inmediato.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Emitir NC',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.emitirNotaCredito();
      },
    });
  }

  private emitirNotaCredito(): void {
    this.guardandoNota = true;

    const itemsParaDevolver = this.itemsVenta.filter(
      (i) => i.seleccionado && i.cantidadADevolver > 0,
    );

    const payload: RegisterCreditNoteDto = {
      salesReceiptId: this.ventaReferenciaCabecera.id,
      reasonCode: this.motivoSunatSeleccionado!,
      reasonDescription: this.sustentoDescripcion.trim(),
      items: itemsParaDevolver.map((item) => ({
        itemId: item.id_detalle,
        quantity: item.cantidadADevolver,
      })),
    };

    const sub = this.creditNoteService.registrar(payload).subscribe({
      next: (res) => {
        this.guardandoNota = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Nota de Crédito emitida correctamente',
          life: 4000,
        });
        setTimeout(() => this.volverListado(), 2000); 
      },
      error: (err) => {
        this.guardandoNota = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo emitir la nota de crédito',
          life: 5000,
        });
      },
    });
    this.subscriptions.add(sub);
  }

  volverListado(): void {
    this.router.navigate(['/admin/nota-credito']);
  }
}
