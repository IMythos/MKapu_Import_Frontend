// ventas/pages/reclamos-garantia/reclamos-listado/reclamos-listado.ts
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tooltip } from 'primeng/tooltip';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  ClaimService,
  ClaimResponseDto,
  ClaimStatus,
} from '../../../../core/services/claim.service';
import { SelectButtonModule } from 'primeng/selectbutton';

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
    SelectButtonModule,
  ],
  providers: [MessageService],
  templateUrl: './reclamos-listado.html',
  styleUrl: './reclamos-listado.css',
})
export class ReclamosListado implements OnInit {
  tituloKicker = 'VENTAS - RECLAMOS Y GARANTÍAS';
  subtituloKicker = 'GESTIÓN DE RECLAMOS';
  iconoCabecera = 'pi pi-shield';

  private router = inject(Router);
  readonly claimService = inject(ClaimService);
  private messageService = inject(MessageService);

  filtroEstado: ClaimStatus | null = null;
  filtroBusqueda = '';

  estadosOptions = [
    { label: 'Todos', value: null },
    { label: 'Registrado', value: ClaimStatus.REGISTRADO },
    { label: 'En Proceso', value: ClaimStatus.EN_PROCESO },
    { label: 'Resuelto', value: ClaimStatus.RESUELTO },
    { label: 'Rechazado', value: ClaimStatus.RECHAZADO },
  ];
  get reclamosFiltrados(): ClaimResponseDto[] {
    const q = this.filtroBusqueda.toLowerCase().trim();
    const est = this.filtroEstado;

    return this.claimService.claims().filter((c) => {
      const matchQ =
        !q ||
        c.saleReceiptId.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      const matchEst = !est || c.status === est;
      return matchQ && matchEst;
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.claimService.loadClaims("2"); //HARDCODE
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los reclamos',
      });
    }
  }

  nuevoReclamo(): void {
    const base = this.getRouteBase();
    this.router.navigate([`${base}/crear`]);
  }

  verDetalle(id: string): void {
    const base = this.getRouteBase();
    this.router.navigate([`${base}/detalle`, id]);
  }

  editarReclamo(id: string): void {
    const base = this.getRouteBase();
    this.router.navigate([`${base}/editar`, id]);
  }

  limpiarFiltros(): void {
    this.filtroEstado = null;
    this.filtroBusqueda = '';
  }

  private getRouteBase(): string {
    return this.router.url.includes('/admin')
      ? '/admin/reclamos-listado'
      : '/ventas/reclamos-listado';
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
}
