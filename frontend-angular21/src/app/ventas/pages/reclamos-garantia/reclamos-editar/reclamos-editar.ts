import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { EmpleadosService, Empleado } from '../../../../core/services/empleados.service';
import { ClaimService } from '../../../../core/services/claim.service';
import { VentasAdminService } from '../../../../administracion/services/ventas.service';

// 1. Tus interfaces exactas
export interface ClaimResponseDto {
  claimId: number;
  receiptId: number;
  sellerId: string;
  reason: string;
  description: string;
  status: string;
  registeredAt: Date | string;
  resolvedAt: Date | string | null;
}

export interface ReclamoResponse {
  id: number;
  status: 'REGISTRADO' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
  reason: string;
  description: string;
  customerName: string;
  productDescription: string;
  registerDate: Date | string;
}

export type ReclamoDetalle = ClaimResponseDto & Partial<ReclamoResponse>;

@Component({
  selector: 'app-reclamos-editar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    Textarea,
    Select,
    Toast,
    Tag,
    Divider,
    ConfirmDialog,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './reclamos-editar.html',
  styleUrl: './reclamos-editar.css',
})
export class ReclamosEditar implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private reclamosApi = inject(ClaimService);
  private empleadosService = inject(EmpleadosService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private ventasService = inject(VentasAdminService);
  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'SEGUIMIENTO DE RECLAMO';
  iconoCabecera = 'pi pi-file-edit';

  private subscriptions = new Subscription();

  empleadoActual = signal<Empleado | null>(null);
  idReclamo = signal<number>(0);

  reclamoOriginal = signal<ReclamoDetalle | null>(null);

  cargando = signal<boolean>(true);
  guardando = signal<boolean>(false);

  estadoSeleccionado = signal<string>('REGISTRADO');
  respuesta = signal<string>('');

  estadosOptions = signal([
    { label: 'Registrado', value: 'REGISTRADO', icon: 'pi pi-inbox', severity: 'warn' },
    { label: 'Atender (En Proceso)', value: 'EN_PROCESO', icon: 'pi pi-cog', severity: 'info' },
    { label: 'Resuelto (Aprobado)', value: 'RESUELTO', icon: 'pi pi-check-circle', severity: 'success' },
    { label: 'Rechazado (Denegado)', value: 'RECHAZADO', icon: 'pi pi-times-circle', severity: 'danger' }
  ]);

  hayCambios = computed(() => {
    const original = this.reclamoOriginal();
    if (!original) return false;

    const estadoModificado = this.estadoSeleccionado() !== original.status;
    const tieneRespuesta = this.respuesta().trim() !== '';

    return estadoModificado || tieneRespuesta;
  });

  ngOnInit(): void {
    this.cargarEmpleadoActual();
    this.cargarReclamo();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  cargarEmpleadoActual(): void {
    this.empleadoActual.set(this.empleadosService.getEmpleadoActual());
  }

  async cargarReclamo(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'ID no válido' });
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
          claimId: crudo.claimId || crudo.id_reclamo,
          receiptId: crudo.receiptId || crudo.id_comprobante,
          sellerId: crudo.sellerId || crudo.id_vendedor_ref,
          reason: crudo.reason || crudo.motivo,
          description: crudo.description || crudo.descripcion,
          status: crudo.status || crudo.estado,
          registeredAt: crudo.registeredAt || crudo.fecha_registro,
          resolvedAt: crudo.resolvedAt || crudo.fecha_resolucion,
          observations: crudo.respuesta || crudo.observaciones
        };
        let nombreCliente = 'No disponible';
        let nombreProducto = 'Revisar comprobante';
        try {
          if (claimData.receiptId) {
            const reciboCrudo = await firstValueFrom<any>(this.ventasService.getDetalleComprobante(claimData.receiptId));
            
            console.log('ESTRUCTURA REAL DEL RECIBO:', reciboCrudo);
            
            const recibo = reciboCrudo.data || reciboCrudo;

            if (recibo) {
              nombreCliente = 
                recibo.cliente.nombre ||
                'Cliente no identificado';
              
              const items = recibo.detalles || recibo.items || recibo.details || [];
              if (items.length > 0) {
                nombreProducto = items.map((i: any) => {
                  return i.descripcion || i.productName || i.name || i.product?.name || 'Producto';
                }).join(', ');
              }
            }
          }
        } catch (err) {
          console.error('Error al enriquecer data desde Ventas:', err);
        }

        const reclamoEnriquecido: ReclamoDetalle = {
          ...claimData,
          customerName: nombreCliente,
          productDescription: nombreProducto
        };

        this.reclamoOriginal.set(reclamoEnriquecido);
        this.estadoSeleccionado.set(claimData.status); 
      } else {
        throw new Error('Reclamo no encontrado');
      }
    } catch (error) {
      console.error(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el reclamo' });
      this.volver();
    } finally {
      this.cargando.set(false);
    }
  }

  onEstadoChange(nuevoEstado: any): void {
    const original = this.reclamoOriginal();
    if (original && nuevoEstado !== original.status) {
      this.messageService.add({
        severity: 'info',
        summary: 'Estado modificado',
        detail: 'Recuerde detallar la respuesta y guardar.',
        life: 2000,
      });
    }
  }

  confirmarGuardar(): void {
    if (!this.hayCambios()) {
      return;
    }

    if (this.respuesta().trim() === '') {
       this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe ingresar el detalle de la acción/respuesta.' });
       return;
    }

    const original = this.reclamoOriginal();
    let mensaje = '¿Está seguro de procesar este reclamo?';
    
    if (original && this.estadoSeleccionado() !== original.status) {
      mensaje += `\n\nCambiará el estado de ${original.status} a ${this.estadoSeleccionado()}`;
    }

    this.confirmationService.confirm({
      header: 'Confirmar Acción',
      message: mensaje,
      icon: 'pi pi-question-circle',
      accept: () => {
        console.log('🔴 PASO 3: Usuario aceptó, llamando a ejecutarPatch()');
        this.ejecutarPatch();
      },
    });
  }

  async ejecutarPatch(): Promise<void> {
    this.guardando.set(true);
    const id = this.idReclamo();
    const estado = this.estadoSeleccionado();
    const textoRespuesta = this.respuesta();

    console.log('📦 DATOS A ENVIAR:', { id, estado, textoRespuesta });

    try {
      if (estado === 'EN_PROCESO') {
        await firstValueFrom(this.reclamosApi.atenderReclamo(id, textoRespuesta));
      } 
      else if (estado === 'RESUELTO' || estado === 'RECHAZADO') {
        // podrías enviar el estado dentro del texto, o ajustar tu endpoint de NestJS a futuro.
        // Por ahora usamos tu endpoint de resolve que pide solo la respuesta.
        await firstValueFrom(this.reclamosApi.resolverReclamo(id, `[${estado}] - ${textoRespuesta}`));
      } 
      else {
         console.log('🔴 DETENIDO LOCALMENTE: Estado inválido');
         throw new Error('Debe cambiar el estado a "En Proceso", "Resuelto" o "Rechazado".');
      }

      this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Reclamo actualizado correctamente' });
      await this.cargarReclamo();
      this.respuesta.set(''); 
      this.router.navigate(['admin/reclamos-listado'])

    } catch (error) {
      console.error('❌ ERROR AL EJECUTAR PATCH:', error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo procesar el reclamo' });
    } finally {
      this.guardando.set(false);
    }
  }

  cancelarEdicion(): void {
    if (this.hayCambios()) {
      this.confirmationService.confirm({
        header: 'Descartar Cambios',
        message: '¿Seguro que desea descartar su respuesta?',
        icon: 'pi pi-exclamation-triangle',
        accept: () => this.volver(),
      });
    } else {
      this.volver();
    }
  }

  volver(): void {
    this.router.navigate(['admin/reclamos-listado']);
  }
}
