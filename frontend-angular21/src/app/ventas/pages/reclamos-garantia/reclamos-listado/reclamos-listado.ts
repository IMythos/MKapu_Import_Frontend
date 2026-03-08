// ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado.ts
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';

import {
  ClaimService,
  ClaimResponseDto,
  ClaimStatus,
} from '../../../../core/services/claim.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { getHoyPeru } from '../../../../shared/utils/date-peru.utils';

@Component({
  selector: 'app-reclamos-listado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Button,
    TableModule,
    Tag,
    InputText,
    Select,
    Tooltip,
    Toast,
    DatePicker,
    LoadingOverlayComponent,
  ],
  providers: [MessageService],
  templateUrl: './reclamos-listado.html',
  styleUrl:    './reclamos-listado.css',
})
export class ReclamosListado implements OnInit, OnDestroy {

  // ── Meta ────────────────────────────────────────────────────────────────────
  tituloKicker    = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'GESTIÓN DE RECLAMOS';
  iconoCabecera   = 'pi pi-shield';

  // ── DI ──────────────────────────────────────────────────────────────────────
  private readonly router         = inject(Router);
  private readonly cdr            = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  readonly         claimService   = inject(ClaimService);

  private subscriptions = new Subscription();

  // ── Filtros ─────────────────────────────────────────────────────────────────
  filtroEstado:      ClaimStatus | null = null;
  filtroBusqueda     = '';
  filtroFechaInicio: Date | null = getHoyPeru();   // inicia con hoy (hora Perú)
  filtroFechaFin:    Date | null = null;

  estadosOptions = [
    { label: 'Todos',      value: null                   },
    { label: 'Registrado', value: ClaimStatus.REGISTRADO },
    { label: 'En Proceso', value: ClaimStatus.EN_PROCESO },
    { label: 'Resuelto',   value: ClaimStatus.RESUELTO   },
    { label: 'Rechazado',  value: ClaimStatus.RECHAZADO  },
  ];

  // ── Lista filtrada ───────────────────────────────────────────────────────────
  get reclamosFiltrados(): ClaimResponseDto[] {
    const q   = this.filtroBusqueda.toLowerCase().trim();
    const est = this.filtroEstado;

    const desde = this.filtroFechaInicio
      ? new Date(this.filtroFechaInicio).setHours(0, 0, 0, 0)
      : null;
    const hasta = this.filtroFechaFin
      ? new Date(this.filtroFechaFin).setHours(23, 59, 59, 999)
      : null;

    return this.claimService.claims().filter((c) => {
      // Búsqueda texto — usa campos reales del DTO
      const matchQ =
        !q ||
        (c.saleReceiptId && c.saleReceiptId.toLowerCase().includes(q)) ||
        (c.reason        && c.reason.toLowerCase().includes(q))        ||
        (c.description   && c.description.toLowerCase().includes(q));

      // Estado
      const matchEst = !est || c.status === est;

      // Rango de fechas — campo real del DTO: registerDate
      const fechaReg   = c.registerDate ? new Date(c.registerDate).getTime() : null;
      const matchDesde = !desde || (fechaReg !== null && fechaReg >= desde);
      const matchHasta = !hasta || (fechaReg !== null && fechaReg <= hasta);

      return matchQ && matchEst && matchDesde && matchHasta;
    });
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    try {
      await this.claimService.loadClaims('2'); // TODO: quitar hardcode
    } catch {
      this.messageService.add({
        severity: 'error',
        summary:  'Error',
        detail:   'No se pudieron cargar los reclamos',
        life:     3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ── Navegación ───────────────────────────────────────────────────────────────
  nuevoReclamo(): void  { this.router.navigate([`${this.routeBase}/crear`]);         }
  verDetalle(id: string): void { this.router.navigate([`${this.routeBase}/detalle`, id]); }
  editarReclamo(id: string): void { this.router.navigate([`${this.routeBase}/editar`, id]);  }

  // ── Acciones pendientes de backend ───────────────────────────────────────────
  imprimirReclamo(_reclamo: ClaimResponseDto): void {
    this.messageService.add({
      severity: 'info',
      summary:  'Imprimir',
      detail:   'Generando PDF del reclamo...',
      life:     3000,
    });
    // TODO backend — descomentar cuando esté listo:
    // const sub = this.claimService.imprimirReclamo(_reclamo.id).subscribe({
    //   next: (blob) => { /* abrir PDF */ },
    //   error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el PDF', life: 3000 }),
    // });
    // this.subscriptions.add(sub);
  }

  enviarCorreo(_reclamo: ClaimResponseDto): void {
    this.messageService.add({
      severity: 'info',
      summary:  'Correo',
      detail:   'Enviando correo del reclamo...',
      life:     3000,
    });
    // TODO backend — descomentar cuando esté listo:
    // const sub = this.claimService.enviarCorreoReclamo(_reclamo.id).subscribe({
    //   next: () => this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'Correo enviado correctamente', life: 3000 }),
    //   error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo', life: 3000 }),
    // });
    // this.subscriptions.add(sub);
  }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  limpiarFiltros(): void {
    this.filtroEstado      = null;
    this.filtroBusqueda    = '';
    this.filtroFechaInicio = null;
    this.filtroFechaFin    = null;
  }

  // ── Helpers públicos ─────────────────────────────────────────────────────────
  getStatusLabel(status: ClaimStatus)    { return this.claimService.getStatusLabel(status);         }
  getStatusSeverity(status: ClaimStatus) { return this.claimService.getStatusSeverity(status);      }
  formatDate(iso: string)                { return this.claimService.formatDate(iso);                }
  diasDesde(iso: string)                 { return this.claimService.calcularDiasDesdeRegistro(iso); }

  // ── Privados ─────────────────────────────────────────────────────────────────
  private get routeBase(): string {
    return this.router.url.includes('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
  }
}