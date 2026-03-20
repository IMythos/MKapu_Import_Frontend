import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { CommissionService, CommissionReport } from '../../../services/commission.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-comision-reportes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, ButtonModule,
    InputTextModule, AutoCompleteModule, TableModule, TagModule, AvatarModule, RouterModule
  ],
  templateUrl: './comisionreportes.html',
  styleUrls: ['./comisionreportes.css'],
})
export class ComisionReportes implements OnInit {
  private readonly commissionService = inject(CommissionService);

  readonly loading = this.commissionService.loading;
  readonly error   = this.commissionService.error;
  readonly report  = this.commissionService.report;

  // ── Filtros ────────────────────────────────────────────────────────────────
  filtroBusqueda   = '';
  fechaDesde       = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                       .toISOString().split('T')[0];
  fechaHasta       = new Date().toISOString().split('T')[0];

  estadoSeleccionado: any  = null;
  periodoSeleccionado: any = null;

  periodos = [
    { nombre: 'Este Mes',      desde: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),      hasta: () => new Date() },
    { nombre: 'Mes Anterior',  desde: () => new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),  hasta: () => new Date(new Date().getFullYear(), new Date().getMonth(), 0) },
    { nombre: 'Este Año',      desde: () => new Date(new Date().getFullYear(), 0, 1),                          hasta: () => new Date() },
  ];

  estados = [
    { nombre: 'Todos',      value: null },
    { nombre: 'Pendiente',  value: 'PENDIENTE' },
    { nombre: 'Liquidada',  value: 'LIQUIDADA' },
    { nombre: 'Cancelada',  value: 'CANCELADA' },
  ];

  periodosFiltrados: any[] = [];
  estadosFiltrados:  any[] = [];

  // ── Reportes filtrados ─────────────────────────────────────────────────────
  readonly reportesFiltrados = computed(() => {
    let data = this.report();

    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase();
      data = data.filter(r =>
        r.id_vendedor_ref.toLowerCase().includes(q) ||
        String(r.id_comprobante).includes(q)
      );
    }

    if (this.estadoSeleccionado?.value) {
      data = data.filter(r => r.estado === this.estadoSeleccionado.value);
    }

    return data;
  });

  // ── KPIs computed ──────────────────────────────────────────────────────────
  readonly totalPagar = computed(() =>
    this.reportesFiltrados()
      .filter(r => r.estado === 'PENDIENTE')
      .reduce((acc, r) => acc + Number(r.monto), 0)
  );

  readonly totalComisiones = computed(() =>
    this.reportesFiltrados().reduce((acc, r) => acc + Number(r.monto), 0)
  );

  readonly vendedorTop = computed(() => {
    const data = this.reportesFiltrados();
    if (!data.length) return { nombre: '—', comision: 0 };

    const grouped = data.reduce((acc, r) => {
      acc[r.id_vendedor_ref] = (acc[r.id_vendedor_ref] ?? 0) + Number(r.monto);
      return acc;
    }, {} as Record<string, number>);

    const top = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];
    return { nombre: top[0], comision: top[1] };
  });

  readonly totalVendedores = computed(() =>
    new Set(this.reportesFiltrados().map(r => r.id_vendedor_ref)).size
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.calcular();
  }

  // ── Acciones ───────────────────────────────────────────────────────────────
  calcular() {
    const desde = new Date(this.fechaDesde);
    const hasta = new Date(this.fechaHasta);
    this.commissionService.calculateCommissions(desde, hasta).subscribe();
  }

  onPeriodoSelect(event: any) {
    if (!event?.value) return;
    const p = event.value;
    this.fechaDesde = p.desde().toISOString().split('T')[0];
    this.fechaHasta = p.hasta().toISOString().split('T')[0];
    this.calcular();
  }

  filtrarPeriodos(event: any) {
    const q = event.query.toLowerCase();
    this.periodosFiltrados = this.periodos.filter(p =>
      p.nombre.toLowerCase().includes(q)
    );
  }

  filtrarEstados(event: any) {
    const q = event.query.toLowerCase();
    this.estadosFiltrados = this.estados.filter(e =>
      e.nombre.toLowerCase().includes(q)
    );
  }

  getSeverity(estado: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    const map: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
      PENDIENTE: 'warn',
      LIQUIDADA: 'success',
      CANCELADA: 'danger',
    };
    return map[estado] ?? 'info';

  }
}