import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services reales
import { ClaimService } from '../../../../core/services/claim.service';
import { VentaService } from '../../../services/venta.service';
import { ClienteService } from '../../../services/cliente.service';

// Interfaces (Iguales a las de editar)
export interface ClaimResponseDto {
  claimId: number;
  receiptId: number;
  sellerId: string;
  reason: string;
  description: string;
  status: string;
  registeredAt: Date | string;
  resolvedAt: Date | string | null;
  detalles?: { tipo: string; descripcion: string; fecha?: Date | string }[];
}

export interface ReclamoResponse {
  id: number;
  status: 'REGISTRADO' | 'EN PROCESO' | 'RESUELTO' | 'RECHAZADO';
  reason: string;
  description: string;
  customerName: string;
  customerDoc?: string;
  customerPhone?: string;
  customerEmail?: string;
  productDescription: string;
  registerDate: Date | string;
  observations?: string;
}

export type ReclamoDetalle = ClaimResponseDto & Partial<ReclamoResponse>;

@Component({
  selector: 'app-reclamos-detalles',
  standalone: true,
  imports: [CommonModule, Card, Button, Tag, Toast, Divider],
  providers: [MessageService],
  templateUrl: './reclamos-detalles.html',
  styleUrl: './reclamos-detalles.css',
})
export class ReclamosDetalles implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reclamosApi = inject(ClaimService);
  private ventasService = inject(VentaService);
  private messageService = inject(MessageService);
  private clienteService = inject(ClienteService);

  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'DETALLE DEL RECLAMO';
  iconoCabecera = 'pi pi-file';

  private subscriptions = new Subscription();

  idReclamo = signal<number>(0);
  reclamo = signal<ReclamoDetalle | null>(null);
  cargando = signal<boolean>(true);

  garantiaVigente = signal<boolean>(false);
  diasRestantes = signal<number>(0);

  Math = Math;

  ngOnInit(): void {
    this.cargarReclamo();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async cargarReclamo(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID de reclamo no especificado' });
      this.volver();
      return;
    }

    const id = parseInt(idParam, 10);
    this.idReclamo.set(id);
    this.cargando.set(true);

    try {
      const crudo = await firstValueFrom<any>(this.reclamosApi.getReclamoById(id));
      if (crudo) {
        const claimData = {
          ...crudo,
          claimId: crudo.claimId || crudo.id_reclamo || crudo.id,
          receiptId: crudo.receiptId || crudo.id_comprobante,
          sellerId: crudo.sellerId || crudo.id_vendedor_ref,
          reason: crudo.reason || crudo.motivo,
          description: crudo.description || crudo.descripcion || crudo.descripcion_problema,
          status: crudo.status || crudo.estado,
          registeredAt: crudo.registeredAt || crudo.fecha_registro || new Date(),
          resolvedAt: crudo.resolvedAt || crudo.fecha_resolucion,
          observations: crudo.respuesta || crudo.observaciones,
          detalles: crudo.detalles || []
        };

        let nombreCliente = 'No disponible';
        let docCliente = 'S/N';
        let telCliente = '';
        let emailCliente = '';
        let nombreProducto = 'Revisar comprobante';

        try {
          if (claimData.receiptId) {
            // 1. OBTENER COMPROBANTE
            const reciboCrudo = await firstValueFrom<any>(this.ventasService.getComprobanteById(claimData.receiptId));
        
            const recibo = reciboCrudo.data || reciboCrudo;

            if (recibo) {
              // Extraer y mapear productos
              const items = recibo.items || recibo.detalles || recibo.details || [];
              if (items.length > 0) {
                nombreProducto = items.map((i: any) => i.descripcion || i.productName || i.name || i.product?.name || 'Producto').join(', ');
              }

              // 2. OBTENER CLIENTE USANDO EL ID DEL COMPROBANTE
              const idDelCliente = recibo.idCliente || recibo.customerId;
              
              if (idDelCliente) {
                try {
                  // Consumimos tu endpoint de cliente
                  const clienteCrudo = await firstValueFrom<any>(
                    this.clienteService.obtenerClientePorId(idDelCliente)
                  );
                  
                  const cliente = clienteCrudo.data || clienteCrudo;

                  if (cliente) {
                    nombreCliente = cliente.name || cliente.nombres || cliente.displayName || 'Cliente no identificado';
                    docCliente = cliente.documentValue || cliente.documentNumber || cliente.valor_doc || cliente.num_doc || 'S/N';
                    telCliente = cliente.phone || cliente.telefono || '';
                    emailCliente = cliente.email || cliente.correo || '';
                  }
                } catch (errCliente) {
                  console.warn('❌ ERROR - No se pudo obtener la info del cliente:', errCliente);
                  nombreCliente = 'ID: ' + idDelCliente;
                }
              }
            }
          }
        } catch (err) {
          console.warn('❌ ERROR EN LOG 2 - No se pudo cargar ventas:', err);
        }

        const reclamoFinal: ReclamoDetalle = {
          ...claimData,
          customerName: nombreCliente,
          customerDoc: docCliente,
          customerPhone: telCliente,
          customerEmail: emailCliente,
          productDescription: nombreProducto
        };

        this.reclamo.set(reclamoFinal);
      } else {
        throw new Error('El reclamo no existe');
      }
    } catch (error) {
      console.error(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reclamo' });
      this.volver();
    } finally {
      this.cargando.set(false);
    }
  }

  // Lógica directa para los colores
  getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (estado) {
      case 'RESUELTO': return 'success';
      case 'EN_PROCESO': return 'info';
      case 'REGISTRADO': return 'warn';
      case 'RECHAZADO': return 'danger';
      default: return 'info';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'RESUELTO': return 'pi pi-check-circle';
      case 'EN_PROCESO': return 'pi pi-spin pi-cog';
      case 'REGISTRADO': return 'pi pi-inbox';
      case 'RECHAZADO': return 'pi pi-times-circle';
      default: return 'pi pi-info-circle';
    }
  }
  private getRouteBase(): string {
    return this.router.url.includes('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
  }
  volver(): void {
    const base = this.getRouteBase();
    this.router.navigate([`${base}`]);
  }

  irAEditar(): void {
    const id = this.idReclamo();
    if (id) {
      this.router.navigate(['/ventas/reclamos/editar', id]);
    }
  }
}
