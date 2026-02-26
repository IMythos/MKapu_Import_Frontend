import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';
import { Card } from 'primeng/card';
import { DatePicker } from 'primeng/datepicker';
import { NuevaRemision } from './nueva-remision/nueva-remision';
import { InputTextModule } from 'primeng/inputtext';
import { RemissionService } from '../../services/remission.service';
import { RemissionResponse, RemissionSummaryResponse } from '../../interfaces/remision.interface';
import { DialogModule } from 'primeng/dialog';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Badge } from 'primeng/badge';

@Component({
  selector: 'app-remision',
  imports: [
    CommonModule,
    FormsModule,
    Button,
    Tag,
    TableModule,
    Card,
    DatePicker,
    Select,
    NuevaRemision,
    InputTextModule,
    DialogModule,
  ],
  templateUrl: './remision.html',
  styleUrl: './remision.css',
})
export class Remision implements OnInit {
  private readonly router = inject(Router);
  private readonly remissionService = inject(RemissionService);
  opcionesEstado = [
    { label: 'Todos', value: null },
    { label: 'Emitido', value: 1 },
    { label: 'Anulado', value: 2 },
    { label: 'Procesado', value: 3 }
  ];
  remisiones = signal<RemissionResponse[]>([]);
  totalRecords = signal<number>(0);
  loading = signal<boolean>(false);

  filtroTexto = signal<string>('');
  filtroEstado = signal<number | null>(null);
  filtroFechas = signal<Date[] | null>(null);
  resumen = signal<RemissionSummaryResponse>({
    totalMes: 0,
    enTransito: 0,
    entregadas: 0,
    observadas: 0,
  });
  protected sidebarVisible = signal<boolean>(false);

  ngOnInit() {
    this.cargarDatos();
    this.cargarResumen();
  }

  cargarDatos(page: number = 1, limit: number = 10, search: string = ''): void {
    this.loading.set(true);

    let startDate = '';
    let endDate = '';

    const fechas = this.filtroFechas();

    if (fechas && fechas[0] && fechas[1]) {
      startDate = fechas[0].toISOString();
      const fin = new Date(fechas[1]);
      fin.setHours(23, 59, 59, 999);
      endDate = fin.toISOString();
    }
    this.remissionService
      .getRemisiones(
        page,
        limit,
        this.filtroTexto(),
        this.filtroEstado() ?? undefined,
        startDate,
        endDate,
      )
      .subscribe({
        next: (res) => {
          this.remisiones.set(res.data);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar remisiones:', err);
          this.loading.set(false);
        },
      });
  }

  onPageChange(event: any) {
    const page = event.first / event.rows + 1;
    this.cargarDatos(page, event.rows);
  }

  aplicarFiltros() {
    this.cargarDatos(1, 10);
  }

  limpiarFiltros() {
    this.filtroTexto.set('');
    this.filtroEstado.set(null);
    this.filtroFechas.set(null);
    this.cargarDatos(1, 10);
  }
  cargarResumen() {
    this.remissionService.getRemissionSummary().subscribe({
      next: (data) => this.resumen.set(data),
      error: (err) => console.error('Error cargando el resumen', err),
    });
  }
  onSearch(term: string) {
    this.cargarDatos(1, 10, term);
  }

  abrirFormulario(): void {
    this.sidebarVisible.set(true);
  }

  cerrarFormulario(): void {
    this.sidebarVisible.set(false);
    this.cargarDatos();
  }

  verDetalles(idGuia: string) {
    this.router.navigate(['/logistica/remision/detalle', idGuia]);
  }
}
