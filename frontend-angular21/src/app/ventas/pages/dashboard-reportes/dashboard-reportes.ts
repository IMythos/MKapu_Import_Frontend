import { Component, Injectable, inject, signal } from '@angular/core';
import { SalesReportRow } from '../../interfaces/reportes.interface';
import { ReportesVentasService } from '../../services/reportes.service';
import { Button, ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { Tag, TagModule } from "primeng/tag";
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

DatePipe
@Component({
  selector: 'app-dashboard-reportes',
  imports: [DecimalPipe,Button, TableModule, Tag, DatePipe,FormsModule,ButtonModule,TagModule],
  templateUrl: './dashboard-reportes.html',
  styleUrl: './dashboard-reportes.css',
})
export class DashboardReportes {
  private reportesService = inject(ReportesVentasService);

  // Signals para el estado de la tabla
  salesReportData = signal<SalesReportRow[]>([]);
  loading = signal<boolean>(false);

  // Signals para los filtros
  rangoFechas = signal<Date[]>([]);
  sedeSeleccionada = signal<number | null>(null);
  vendedorSeleccionado = signal<number | null>(null);

  cargarReporte() {
    const fechas = this.rangoFechas();
    
    // Validar que el usuario seleccionó un rango completo (inicio y fin)
    if (!fechas || fechas.length !== 2 || !fechas[1]) {
      return; 
    }

    this.loading.set(true);

    const startDateStr = fechas[0].toISOString().split('T')[0];
    const endDateStr = fechas[1].toISOString().split('T')[0];

    this.reportesService.getSalesDashboard({
      startDate: startDateStr,
      endDate: endDateStr,
      sedeId: this.sedeSeleccionada() ?? undefined,
      vendedorId: this.vendedorSeleccionado() ?? undefined
    }).subscribe({
      next: (data) => {
        this.salesReportData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al obtener reporte de ventas', err);
        this.loading.set(false);
      }
    });
  }
}
