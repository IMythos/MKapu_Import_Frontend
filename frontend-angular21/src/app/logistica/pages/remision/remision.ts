import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { RemissionService } from '../../services/remission.service';
import {
  RemissionResponse,
  RemissionSummaryResponse,
  RemisionPaginatedResponse
} from '../../interfaces/remision.interface';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../shared/components/paginador/paginador.components';

@Component({
  selector: 'app-remision',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Tag,
    TableModule,
    Card,
    DatePicker,
    Select,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    LoadingOverlayComponent,
    PaginadorComponent,  
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './remision.html',
  styleUrl: './remision.css',
})
export class Remision implements OnInit {
  private readonly router = inject(Router);
  private readonly remissionService = inject(RemissionService);

  opcionesEstado = [
    { label: 'Todos',     value: null        },
    { label: 'Emitido',   value: 'EMITIDO'   },
    { label: 'Procesado', value: 'PROCESADO' },
    { label: 'Anulado',   value: 'ANULADO'   },
  ];

  remisiones   = signal<RemissionResponse[]>([]);
  totalRecords = signal<number>(0);
  loading      = signal<boolean>(false);

  paginaActual = signal<number>(1);
  limitePagina = signal<number>(10);
  totalPaginas = computed(() => Math.ceil(this.totalRecords() / this.limitePagina()));

  filtroTexto  = signal<string>('');
  filtroEstado = signal<string | null>(null);
  filtroFechas = signal<Date[] | null>(null);

  resumen = signal<RemissionSummaryResponse>({
    totalMes: 0, enTransito: 0, entregadas: 0, observadas: 0,
  });

  ngOnInit() {
    this.cargarDatos();
    this.cargarResumen();
  }

  cargarDatos(): void {
    this.loading.set(true);

    let startDate = '';
    let endDate   = '';
    const fechas  = this.filtroFechas();

    if (fechas && fechas[0] && fechas[1]) {
      startDate = fechas[0].toISOString();
      const fin = new Date(fechas[1]);
      fin.setHours(23, 59, 59, 999);
      endDate = fin.toISOString();
    }

    this.remissionService
      .getRemisiones(
        this.paginaActual(),
        this.limitePagina(),
        this.filtroTexto()  || undefined,
        this.filtroEstado() as any,
        startDate || undefined,
        endDate   || undefined,
      )
      .subscribe({
        next: (res: RemisionPaginatedResponse) => {
          this.remisiones.set(res.data);
          this.totalRecords.set(Number(res.total));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar remisiones:', err);
          this.loading.set(false);
        },
      });
  }

  onPageChange(page: number) {
    this.paginaActual.set(page);
    this.cargarDatos();
  }

  onLimitChange(limit: number) {
    this.limitePagina.set(limit);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  aplicarFiltros() {
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  limpiarFiltros() {
    this.filtroTexto.set('');
    this.filtroEstado.set(null);
    this.filtroFechas.set(null);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  cargarResumen() {
    this.remissionService.getRemissionSummary().subscribe({
      next:  (data: RemissionSummaryResponse) => this.resumen.set(data),
      error: (err) => console.error('Error cargando el resumen', err),
    });
  }

  onSearch(term: string) {
    this.filtroTexto.set(term);
    this.paginaActual.set(1);
    this.cargarDatos();
  }

  abrirFormulario(): void { this.router.navigate(['/logistica/remision/nueva']); }

  verDetalles(idGuia: string) {
    this.router.navigate(['/logistica/remision/detalle', idGuia]);
  }
}