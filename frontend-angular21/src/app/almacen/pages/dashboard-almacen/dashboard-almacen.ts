import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CardModule }   from 'primeng/card';
import { ChartModule }  from 'primeng/chart';
import { TagModule }    from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FormsModule }  from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';

import { SedeService } from '../../../administracion/services/sede.service';
import { AlmacenDashboardService, MovimientoRecienteDto, ProductoCriticoDto } from '../../../administracion/services/almacen dashboard.service';

interface KpiCard {
  label:  string;
  value:  string;
  icon:   string;
  color:  string;
  trend?: string;
}

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null;

@Component({
  selector: 'app-dashboard-almacen',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TagModule, SelectModule, FormsModule],
  templateUrl: './dashboard-almacen.html',
  styleUrl: './dashboard-almacen.css',
})
export class DashboardAlmacen implements OnInit, OnDestroy {

  private readonly dashboardService = inject(AlmacenDashboardService);
  private readonly sedeService      = inject(SedeService);
  private subs = new Subscription();

  // ── Estado de carga global ────────────────────────────────────────
  isLoading = signal(true);

  // ── Usuario y sede ────────────────────────────────────────────────
  username     = '';
  idSede       = signal<string>('');
  sedesOptions = signal<any[]>([]);

  // ── KPIs ─────────────────────────────────────────────────────────
  kpis: KpiCard[] = [];

  // ── Gráfico rendimiento ───────────────────────────────────────────
  rendimientoChart        = signal<any>(null);
  rendimientoChartOptions: any;
  periodoRendimiento      = 'mes';
  periodosOptions = [
    { label: 'Semana', value: 'semana' },
    { label: 'Mes',    value: 'mes'    },
    { label: 'Año',    value: 'anio'   },
  ];

  // ── Gráfico salud stock ───────────────────────────────────────────
  saludStockChart        = signal<any>(null);
  saludStockChartOptions: any;
  anioSeleccionado       = new Date().getFullYear().toString();
  aniosOptions: { label: string; value: string }[] = [];

  // ── Movimientos recientes ─────────────────────────────────────────
  movimientosRecientes: MovimientoRecienteDto[] = [];

  // ── Productos críticos ────────────────────────────────────────────
  productosCriticos: ProductoCriticoDto[] = [];

  // ── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.username = this.getUserName();
    this.idSede.set(this.getUserSede());
    this.generarAniosOptions();
    this.configurarOpcionesCharts();
    this.cargarSedes();
    this.cargarTodo();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ── Sedes ─────────────────────────────────────────────────────────
  private cargarSedes(): void {
    const sub = this.sedeService.getSedes().subscribe({
      next:  (res) => this.sedesOptions.set(res.headquarters || []),
      error: (err) => console.error('Error cargando sedes', err),
    });
    this.subs.add(sub);
  }

  // ✅ Convierte siempre a string para mantener consistencia con id_sede VARCHAR
  onSedeGlobalChange(sedeId: number | string | null): void {
    this.idSede.set(sedeId != null ? String(sedeId) : '');
    this.cargarTodo();
  }

  // ── Helpers de sede ───────────────────────────────────────────────
  // ✅ Usa !== '' en vez de || null para no confundir '0' con vacío
  private getSedeParam(): string | null {
    return this.idSede() !== '' ? this.idSede() : null;
  }

  // ── Carga con forkJoin ────────────────────────────────────────────
  private cargarTodo(): void {
    this.isLoading.set(true);
    const sede = this.getSedeParam();

    const sub = forkJoin({
      kpis:        this.dashboardService.getKpis(this.periodoRendimiento, sede),
      rendimiento: this.dashboardService.getRendimientoChart(this.periodoRendimiento, sede),
      salud:       this.dashboardService.getSaludStock(this.anioSeleccionado, sede),
      movimientos: this.dashboardService.getMovimientosRecientes(sede),
      criticos:    this.dashboardService.getProductosCriticos(sede),
    }).subscribe({
      next: ({ kpis, rendimiento, salud, movimientos, criticos }) => {

        this.kpis = [
          {
            label: 'Valor Inventario',
            value: `S/ ${kpis.valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
            icon:  'pi pi-box',        color: '#42A5F5',
            trend: kpis.tendencias.valorInventario,
          },
          {
            label: 'Ítems Bajo Stock Mínimo',
            value: kpis.itemsBajoStock.toString(),
            icon:  'pi pi-exclamation-triangle', color: '#FFA726',
            trend: kpis.tendencias.itemsBajoStock,
          },
          {
            label: 'Exactitud de Inventario',
            value: `${kpis.exactitudInventario.toFixed(1)}%`,
            icon:  'pi pi-check-circle', color: '#66BB6A',
            trend: kpis.tendencias.exactitudInventario,
          },
          {
            label: 'Rotación Promedio',
            value: kpis.rotacionPromedio.toFixed(1),
            icon:  'pi pi-refresh',    color: '#AB47BC',
            trend: kpis.tendencias.rotacionPromedio,
          },
        ];

        this.movimientosRecientes = movimientos;
        this.productosCriticos    = criticos;

        setTimeout(() => {
          this.rendimientoChart.set({
            labels: rendimiento.labels,
            datasets: [{
              label:           'Movimientos procesados',
              data:            rendimiento.datos,
              borderColor:     '#42A5F5',
              backgroundColor: 'rgba(66,165,245,0.15)',
              fill:            true,
              tension:         0.35,
              pointRadius:     3,
            }],
          });

          this.saludStockChart.set({
            labels: ['Stock Óptimo', 'Bajo Stock', 'Sobre-stock'],
            datasets: [{
              data:                 [salud.optimo, salud.bajoStock, salud.sobreStock],
              backgroundColor:      ['#66BB6A', '#FFA726', '#EF5350'],
              hoverBackgroundColor: ['#81C784', '#FFB74D', '#E57373'],
            }],
          });

          this.isLoading.set(false);
        }, 150);
      },
      error: () => this.isLoading.set(false),
    });

    this.subs.add(sub);
  }

  // ── Cambio de periodo ─────────────────────────────────────────────
  onPeriodoRendimientoChange(): void {
    const sede = this.getSedeParam();

    const sub = forkJoin({
      kpis:        this.dashboardService.getKpis(this.periodoRendimiento, sede),
      rendimiento: this.dashboardService.getRendimientoChart(this.periodoRendimiento, sede),
    }).subscribe({
      next: ({ kpis, rendimiento }) => {
        this.kpis = [
          { label: 'Valor Inventario',        value: `S/ ${kpis.valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`, icon: 'pi pi-box',                  color: '#42A5F5', trend: kpis.tendencias.valorInventario      },
          { label: 'Ítems Bajo Stock Mínimo', value: kpis.itemsBajoStock.toString(),                                                      icon: 'pi pi-exclamation-triangle', color: '#FFA726', trend: kpis.tendencias.itemsBajoStock       },
          { label: 'Exactitud de Inventario', value: `${kpis.exactitudInventario.toFixed(1)}%`,                                           icon: 'pi pi-check-circle',         color: '#66BB6A', trend: kpis.tendencias.exactitudInventario  },
          { label: 'Rotación Promedio',       value: kpis.rotacionPromedio.toFixed(1),                                                    icon: 'pi pi-refresh',              color: '#AB47BC', trend: kpis.tendencias.rotacionPromedio     },
        ];

        setTimeout(() => {
          this.rendimientoChart.set({
            labels: rendimiento.labels,
            datasets: [{
              label: 'Movimientos procesados', data: rendimiento.datos,
              borderColor: '#42A5F5', backgroundColor: 'rgba(66,165,245,0.15)',
              fill: true, tension: 0.35, pointRadius: 3,
            }],
          });
        }, 50);
      },
    });
    this.subs.add(sub);
  }

  // ── Cambio de año ─────────────────────────────────────────────────
  onAnioChange(): void {
    const sub = this.dashboardService.getSaludStock(this.anioSeleccionado, this.getSedeParam()).subscribe({
      next: (salud) => {
        setTimeout(() => {
          this.saludStockChart.set({
            labels: ['Stock Óptimo', 'Bajo Stock', 'Sobre-stock'],
            datasets: [{
              data: [salud.optimo, salud.bajoStock, salud.sobreStock],
              backgroundColor:      ['#66BB6A', '#FFA726', '#EF5350'],
              hoverBackgroundColor: ['#81C784', '#FFB74D', '#E57373'],
            }],
          });
        }, 50);
      },
    });
    this.subs.add(sub);
  }

  // ── Helpers localStorage ──────────────────────────────────────────
  private getUserName(): string {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      return user.nombres || user.username || '';
    } catch { return ''; }
  }

  private getUserSede(): string {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? '{}');
      const sede = user.id_sede ?? user.idSede ?? user.sede_id ?? user.sedeId ?? null;
      return sede ? String(sede) : '';
    } catch { return ''; }
  }

  generarAniosOptions(): void {
    const actual = new Date().getFullYear();
    this.aniosOptions = Array.from({ length: 4 }, (_, i) => {
      const anio = actual - i;
      return { label: anio.toString(), value: anio.toString() };
    });
  }

  configurarOpcionesCharts(): void {
    const doc     = getComputedStyle(document.documentElement);
    const text    = doc.getPropertyValue('--text-color')           || '#e5e7eb';
    const textSec = doc.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const border  = doc.getPropertyValue('--surface-border')       || '#374151';
    const overlay = doc.getPropertyValue('--surface-overlay')      || '#111827';

    this.rendimientoChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend:  { display: false },
        tooltip: { backgroundColor: overlay, titleColor: text, bodyColor: text, borderColor: border, borderWidth: 1 },
      },
      scales: {
        x: { ticks: { color: textSec }, grid: { color: 'transparent' } },
        y: { ticks: { color: textSec }, grid: { color: border, drawBorder: false } },
      },
    };

    this.saludStockChartOptions = {
      cutout: '60%',
      maintainAspectRatio: false,
      plugins: {
        legend:  { position: 'bottom', labels: { color: text, usePointStyle: true } },
        tooltip: { backgroundColor: overlay, titleColor: text, bodyColor: text, borderColor: border, borderWidth: 1 },
      },
    };
  }

  // ── Helpers de stock ──────────────────────────────────────────────
  getSeveridadStock(prod: ProductoCriticoDto): TagSeverity {
    if (prod.stock <= prod.stockMinimo / 2) return 'danger';
    if (prod.stock <= prod.stockMinimo)     return 'warn';
    return 'success';
  }

  getEstadoStockTexto(prod: ProductoCriticoDto): string {
    if (prod.stock <= prod.stockMinimo / 2) return 'Crítico';
    if (prod.stock <= prod.stockMinimo)     return 'Bajo';
    return 'OK';
  }

  getStockPct(prod: ProductoCriticoDto): number {
    if (!prod.stockMinimo) return 0;
    return Math.max(0, Math.min(100, (prod.stock / prod.stockMinimo) * 100));
  }

  getBarColor(prod: ProductoCriticoDto): string {
    const sev = this.getSeveridadStock(prod);
    if (sev === 'danger') return '#EF5350';
    if (sev === 'warn')   return '#FFA726';
    return '#66BB6A';
  }

  getStockLabel(prod: ProductoCriticoDto): string {
    return `${prod.stock}`;
  }
}