import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
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
import { SharedTableContainerComponent } from '../../../../shared/components/table.componente/shared-table-container.component';
import {  getLunesSemanaActualPeru,
  getDomingoSemanaActualPeru,
  formatFechaPeru } from '../../../../shared/utils/date-peru.utils';
import { AuthService } from '../../../../auth/services/auth.service';

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
    SharedTableContainerComponent
  ],
  providers: [MessageService],
  templateUrl: './reclamos-listado.html',
  styleUrl: './reclamos-listado.css',
})
export class ReclamosListado implements OnInit, OnDestroy {
  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'GESTIÓN DE RECLAMOS';
  iconoCabecera = 'pi pi-shield';

  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messageService = inject(MessageService);
  readonly claimService = inject(ClaimService);
  private readonly authService = inject(AuthService);

  private subscriptions = new Subscription();

  filtroEstado: ClaimStatus | null = null;
  filtroBusqueda = '';
  filtroFechaInicio: Date | null = getLunesSemanaActualPeru();
  filtroFechaFin: Date | null = getDomingoSemanaActualPeru();

  estadosOptions = [
    { label: 'Todos', value: null },
    { label: 'Registrado', value: ClaimStatus.REGISTRADO },
    { label: 'En Proceso', value: ClaimStatus.EN_PROCESO },
    { label: 'Resuelto', value: ClaimStatus.RESUELTO },
    { label: 'Rechazado', value: ClaimStatus.RECHAZADO },
  ];

  paginaActual = signal<number>(1);
  limitePagina = signal<number>(5);

  get reclamosFiltrados(): ClaimResponseDto[] {
    const q = this.filtroBusqueda.toLowerCase().trim();
    const est = this.filtroEstado;

    const desde = this.filtroFechaInicio
      ? new Date(this.filtroFechaInicio).setHours(0, 0, 0, 0)
      : null;
    const hasta = this.filtroFechaFin
      ? new Date(this.filtroFechaFin).setHours(23, 59, 59, 999)
      : null;

    return this.claimService.claims().filter((c) => {
      const matchQ =
        !q ||
        (c.saleReceiptId && c.saleReceiptId.toLowerCase().includes(q)) ||
        (c.reason && c.reason.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchEst = !est || c.status === est;

      const fechaReg = c.registerDate ? new Date(c.registerDate).getTime() : null;
      const matchDesde = !desde || (fechaReg !== null && fechaReg >= desde);
      const matchHasta = !hasta || (fechaReg !== null && fechaReg <= hasta);

      return matchQ && matchEst && matchDesde && matchHasta;
    });
  }

  get reclamosPaginados(): ClaimResponseDto[] {
    const desde = (this.paginaActual() - 1) * this.limitePagina();
    return this.reclamosFiltrados.slice(desde, desde + this.limitePagina());
  }

  get totalFiltrados(): number {
    return this.reclamosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalFiltrados / this.limitePagina()) || 1;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    try {
      const currentUser = this.authService.getCurrentUser(); 
      
      const sedeId = currentUser?.idSede?.toString(); 
      if (sedeId) {
        await this.claimService.loadClaims(sedeId);
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se encontró la sede del usuario actual.',
          life: 3000,
        });
      }
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los reclamos',
        life: 3000,
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onPageChange(page: number): void {
    this.paginaActual.set(page);
  }

  onLimitChange(limit: number): void {
    this.limitePagina.set(limit);
    this.paginaActual.set(1);
  }

  nuevoReclamo(): void          { this.router.navigate([`${this.routeBase}/crear`]);          }
  verDetalle(id: string): void  { this.router.navigate([`${this.routeBase}/detalle`, id]);    }
  editarReclamo(id: string): void { this.router.navigate([`${this.routeBase}/editar`, id]);   }

  imprimirReclamo(_reclamo: ClaimResponseDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimir',
      detail: 'Generando PDF del reclamo...',
      life: 3000,
    });

    const sub = this.claimService.imprimirReclamo(_reclamo.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);

        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);

        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'PDF generado correctamente', 
          life: 3000 
        });
      },
      error: (err) => {
        console.error('Error al descargar PDF:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo generar el PDF', 
          life: 3000 
        });
      },
    });

    this.subscriptions.add(sub);
  }

  enviarCorreo(_reclamo: ClaimResponseDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Correo',
      detail: 'Enviando correo del reclamo...',
      life: 3000,
    });
    // TODO backend — descomentar cuando esté listo:
    // const sub = this.claimService.enviarCorreoReclamo(_reclamo.id).subscribe({
    //   next: () => this.messageService.add({ severity: 'success', summary: 'Enviado', detail: 'Correo enviado correctamente', life: 3000 }),
    //   error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo', life: 3000 }),
    // });
    // this.subscriptions.add(sub);
  }

  limpiarFiltros(): void {
    this.filtroEstado = null;
    this.filtroBusqueda = '';
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
  }

  getStatusLabel(status: ClaimStatus) {
    return this.claimService.getStatusLabel(status);
  }
  getStatusSeverity(status: ClaimStatus) {
    return this.claimService.getStatusSeverity(status);
  }
  formatDate(iso: string) {
    return this.claimService.formatDate(iso);
  }
  diasDesde(iso: string) {
    return this.claimService.calcularDiasDesdeRegistro(iso);
  }

  private get routeBase(): string {
    return this.router.url.includes('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
  }
}
