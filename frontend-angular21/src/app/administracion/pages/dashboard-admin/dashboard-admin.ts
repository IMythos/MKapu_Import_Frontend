  import { CommonModule } from '@angular/common';
  import { Component, OnInit, inject, signal } from '@angular/core';
  import { FormsModule } from '@angular/forms';
  import { CardModule } from 'primeng/card';
  import { ChartModule } from 'primeng/chart';
  import { TableModule } from 'primeng/table';
  import { TagModule } from 'primeng/tag';
  import { ButtonModule } from 'primeng/button';
  import { SelectModule } from 'primeng/select';
  import { DashboardService } from '../../services/dashboard.service';
  import { SedeService } from '../../services/sede.service';
  import { forkJoin } from 'rxjs';
  import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

  export interface TopProducto {
    nombre: string;
    ventas: number;
    ingresos: string;
  }

  export interface ActividadReciente {
    tipo: 'venta' | 'stock' | 'cliente' | 'pago' | 'transferencia';
    titulo: string;
    detalle: string;
    tiempo: string;
    icon: string;
    color: string;
    sede?: string; 
  }

  export interface MejorVendedor {
    nombre: string;
    totalVentas: number;
    montoTotal: string;
    ticketPromedio: string;
    sede: string;
  }

  // Paleta corporativa centralizada — naranja Mkapu
    const PALETA = {
      // Paleta cálida: naranja → amarillo → rojo coral → teal → lima
      colores: ['#FFA726', '#FFCA28', '#EF5350', '#26A69A', '#D4E157'],
      hovers:  ['#FFB74D', '#FFD54F', '#EF9A9A', '#4DB6AC', '#DCE775'],
      primario: '#FFA726',
      oscuro:   '#FF8F00',
      claro:    '#FFD54F',
      linea:    'rgba(255, 167, 38, 0.2)',
    };

  @Component({
    selector: 'app-dashboard',
    imports: [
      CommonModule,
      CardModule,
      ChartModule,
      TableModule,
      TagModule,
      ButtonModule,
      SelectModule,
      FormsModule,
      LoadingOverlayComponent
    ],
    templateUrl: './dashboard-admin.html',
    standalone: true,
    styleUrl: './dashboard-admin.css',
  })
  export class DashboardAdmin implements OnInit {
    private dashboardService = inject(DashboardService);
    private sedeService      = inject(SedeService);

    Math = Math;
    username  = signal<string>('');
    isLoading = signal<boolean>(true);

    totalVentas    = signal<number>(0);
    totalOrdenes   = signal<number>(0);
    ticketPromedio = signal<number>(0);
    nuevosClientes = signal<number>(0);

    variacionVentas   = signal<number>(0);
    variacionOrdenes  = signal<number>(0);
    variacionTicket   = signal<number>(0);
    variacionClientes = signal<number>(0);

    ventasPorDiaChart       = signal<any>(null);
    ventasPorCategoriaChart = signal<any>(null);
    metodosPagoChart        = signal<any>(null);
    ventasPorSedeChart      = signal<any>(null);
    ventasPorDistritoChart  = signal<any>(null);

    topProductos      = signal<TopProducto[]>([]);
    actividadReciente = signal<ActividadReciente[]>([]);
    mejoresVendedores = signal<MejorVendedor[]>([]);

    idSede       = signal<string>('');
    sedesOptions = signal<any[]>([]);

    periodoVentasDia     = signal<string>('anio');
    mesVentasDistrito    = signal<string>('anio');
    mesMetodosPago       = signal<string>('anio');
    mesVentasSede        = signal<string>('anio');
    mesTopProductos      = signal<string>('anio');
    mesMejoresVendedores = signal<string>('anio');

    aniosOptions = signal<any[]>([]);

    periodosOptions = [
      { label: 'Última Semana',    value: 'semana'    },
      { label: 'Último Mes',       value: 'mes'       },
      { label: 'Último Trimestre', value: 'trimestre' },
      { label: 'Año Actual',       value: 'anio'      },
    ];

    chartOptions: any;
    barChartOptions: any;
    barChartOptionsCompact: any;
    doughnutChartOptions: any;

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────

    ngOnInit(): void {
      this.username.set(this.getUserName());
      this.idSede.set(this.getUserSede());
      this.configurarOpcionesGraficos();
      this.cargarSedes();
      this.cargarTodoElDashboard();
    }

    // ─────────────────────────────────────────────
    // Sedes
    // ─────────────────────────────────────────────

    cargarSedes(): void {
      this.sedeService.getSedes().subscribe({
        next: (res) => this.sedesOptions.set(res.headquarters || []),
        error: (err) => console.error('Error cargando sedes', err),
      });
    }

    onSedeGlobalChange(sedeId: number | null): void {
      this.idSede.set(sedeId != null ? String(sedeId) : '');
      this.cargarTodoElDashboard(); // ← ya llama cargarActividadReciente() internamente
    }

    // ─────────────────────────────────────────────
    // Carga principal
    // ─────────────────────────────────────────────

    cargarTodoElDashboard(): void {
      this.isLoading.set(true);

      forkJoin({
        kpis: this.dashboardService.getKpis(
          this.periodoVentasDia(),
          this.idSede() || undefined,
        ),
        salesChart: this.dashboardService.getSalesChart(
          this.periodoVentasDia(),
          this.idSede() || undefined,
        ),
      }).subscribe({
        next: () => {
          this.cargarEstadisticas();
          this.cargarGraficos();
          this.cargarTopProductos();
          this.cargarActividadReciente();
          this.cargarMejoresVendedores();
          // Espera que Angular renderice los contenedores antes de que Chart.js mida
          setTimeout(() => this.isLoading.set(false), 150);
        },
        error: () => this.isLoading.set(false),
      });
    }

    // ─────────────────────────────────────────────
    // LocalStorage helpers
    // ─────────────────────────────────────────────

    getUserSede(): string {
      const userString = localStorage.getItem('user');
      if (!userString) return '';
      try {
        const user = JSON.parse(userString);
        const sede = user.id_sede ?? user.idSede ?? user.sede_id ?? user.sedeId ?? null;
        return sede ? String(sede) : '';
      } catch {
        return '';
      }
    }

    getUserName(): string {
      const userString = localStorage.getItem('user');
      if (!userString) return 'Administrador';
      try {
        const user = JSON.parse(userString);
        return user.nombres || user.username || 'Administrador';
      } catch {
        return 'Administrador';
      }
    }

    // ─────────────────────────────────────────────
    // Cambio de período
    // ─────────────────────────────────────────────

    onPeriodoVentasDiaChange(value: string): void {
      this.periodoVentasDia.set(value);
      this.cargarEstadisticas();
      this.cargarGraficoVentasPorDia();
    }

    onMesVentasDistritoChange(value: string): void {
      this.mesVentasDistrito.set(value);
      this.cargarGraficoVentasPorDistrito();
    }

    onMesMetodosPagoChange(value: string): void {
      this.mesMetodosPago.set(value);
      this.cargarGraficoMetodosPago();
    }

    onMesVentasSedeChange(value: string): void {
      this.mesVentasSede.set(value);
      this.cargarGraficoVentasPorSede();
    }

    onMesTopProductosChange(value: string): void {
      this.mesTopProductos.set(value);
      this.cargarTopProductos();
    }

    onMesMejoresVendedoresChange(value: string): void {
      this.mesMejoresVendedores.set(value);
      this.cargarMejoresVendedores();
    }

    // ─────────────────────────────────────────────
    // KPIs
    // ─────────────────────────────────────────────

    cargarEstadisticas(): void {
      this.dashboardService
        .getKpis(this.periodoVentasDia(), this.idSede() || undefined)
        .subscribe({
          next: (kpis) => {
            const vnt  = Number(kpis.totalVentas)    || 0;
            const ord  = Number(kpis.totalOrdenes)   || 0;
            const clie = Number(kpis.nuevosClientes) || 0;

            this.totalVentas.set(vnt);
            this.totalOrdenes.set(ord);
            this.nuevosClientes.set(clie);
            this.ticketPromedio.set(ord > 0 ? vnt / ord : 0);

            if (kpis.variaciones) {
              this.variacionVentas.set(Number(kpis.variaciones.ventas)    || 0);
              this.variacionOrdenes.set(Number(kpis.variaciones.ordenes)  || 0);
              this.variacionTicket.set(Number(kpis.variaciones.ticket)    || 0);
              this.variacionClientes.set(Number(kpis.variaciones.clientes)|| 0);
            } else {
              this.variacionVentas.set(0);
              this.variacionOrdenes.set(0);
              this.variacionTicket.set(0);
              this.variacionClientes.set(0);
            }
          },
          error: (err) => console.error('Error cargando KPIs', err),
        });
    }

    getAbs(value: number): number {
      return Math.abs(value);
    }

    // ─────────────────────────────────────────────
    // Gráficos
    // ─────────────────────────────────────────────

    cargarGraficos(): void {
      this.cargarGraficoVentasPorDia();
      this.cargarGraficoVentasPorCategoria();
      this.cargarGraficoMetodosPago();
      this.cargarGraficoVentasPorSede();
      this.cargarGraficoVentasPorDistrito();
    }

    cargarGraficoVentasPorDia(): void {
      this.dashboardService
        .getSalesChart(this.periodoVentasDia(), this.idSede() || undefined)
        .subscribe({
          next: (data) => {
            this.ventasPorDiaChart.set({
              labels: data.labels || [],
              datasets: [{
                label: 'Ventas',
                data: data.values || [],
                fill: true,
                backgroundColor: PALETA.linea,
                borderColor: PALETA.primario,
                tension: 0.4,
                pointBackgroundColor: PALETA.primario,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
              }],
            });
          },
          error: (err) => console.error('Error ventas por día', err),
        });
    }

    cargarGraficoVentasPorCategoria(): void {
      this.dashboardService
        .getSalesByCategory(this.periodoVentasDia(), this.idSede() || undefined)
        .subscribe({
          next: (data) => {
            if (!data?.labels?.length) {
              this.ventasPorCategoriaChart.set(null);
              return;
            }
            this.ventasPorCategoriaChart.set({
              labels: data.labels,
              datasets: [{
                data: data.values || [],
                backgroundColor:      PALETA.colores,
                hoverBackgroundColor: PALETA.hovers,
                borderWidth: 0,
              }],
            });
          },
          error: (err) => {
            console.error('Error categorías', err);
            this.ventasPorCategoriaChart.set(null);
          },
        });
    }

    cargarGraficoMetodosPago(): void {
      this.dashboardService
        .getPaymentMethods(this.mesMetodosPago(), this.idSede() || undefined)
        .subscribe({
          next: (data) => {
            if (!data?.labels?.length) {
              this.metodosPagoChart.set(null);
              return;
            }
            this.metodosPagoChart.set({
              labels: data.labels,
              datasets: [{
                data: data.values,
                backgroundColor:      PALETA.colores,
                hoverBackgroundColor: PALETA.hovers,
                borderWidth: 0,
              }],
            });
          },
          error: (err) => {
            console.error('Error métodos de pago', err);
            this.metodosPagoChart.set(null);
          },
        });
    }

    cargarGraficoVentasPorSede(): void {
      // Sin filtro de sede — siempre muestra todas las sedes para comparar
      this.dashboardService
        .getSalesByHeadquarter(this.mesVentasSede(), undefined)
        .subscribe({
          next: (data) => {
            if (!data?.labels?.length) {
              this.ventasPorSedeChart.set(null);
              return;
            }

            const sedes = this.sedesOptions();
            const labels = (data.labels || []).map((id: any) => {
              const sede = sedes.find((s) => String(s.id_sede) === String(id));
              return sede ? sede.nombre : `Sede ${id}`;
            });

            this.ventasPorSedeChart.set({
              labels,
              datasets: [{
                data: data.values || [],
                backgroundColor:      PALETA.colores,
                hoverBackgroundColor: PALETA.hovers,
                borderWidth: 0,
              }],
            });
          },
          error: (err) => {
            console.error('Error ventas por sede', err);
            this.ventasPorSedeChart.set(null);
          },
        });
    }

    cargarGraficoVentasPorDistrito(): void {
      this.dashboardService
        .getSalesByDistrict(this.mesVentasDistrito(), this.idSede() || undefined)
        .subscribe({
          next: (data) => {
            if (!data?.labels?.length) {
              this.ventasPorDistritoChart.set(null);
              return;
            }
            this.ventasPorDistritoChart.set({
              labels: data.labels,
              datasets: [{
                label: 'Ventas por Distrito',
                data: data.values || [],
                backgroundColor:      'rgba(255, 167, 38, 0.8)',
                hoverBackgroundColor: PALETA.primario,
                borderColor: PALETA.oscuro,
                borderWidth: 1,
              }],
            });
          },
          error: (err) => {
            console.error('Error ventas por distrito', err);
            this.ventasPorDistritoChart.set(null);
          },
        });
    }

    // ─────────────────────────────────────────────
    // Tablas / listas
    // ─────────────────────────────────────────────

    cargarTopProductos(): void {
      this.dashboardService
        .getTopProducts(this.mesTopProductos(), this.idSede() || undefined)
        .subscribe({
          next: (data) => this.topProductos.set(data || []),
          error: (err) => console.error('Error top productos', err),
        });
    }

    cargarMejoresVendedores(): void {
      this.dashboardService
        .getTopSellers(this.mesMejoresVendedores(), this.idSede() || undefined)
        .subscribe({
          next: (data) => this.mejoresVendedores.set(data || []),
          error: (err) => console.error('Error mejores vendedores', err),
        });
    }

    cargarActividadReciente(): void {
      console.log('>>> cargarActividadReciente con idSede:', this.idSede()); // ← agregar
      this.dashboardService
        .getRecentSales(this.periodoVentasDia(), this.idSede() || undefined)
        .subscribe({
          next: (data: any[]) => {
            const actividadMapeada: ActividadReciente[] = data.map((c) => {
              const minutos = Math.floor(
                (Date.now() - new Date(c.fechaEmision || c.fec_emision).getTime()) / 60000,
              );
              const tiempo =
                minutos < 60
                  ? `Hace ${minutos} min`
                  : minutos < 1440
                    ? `Hace ${Math.floor(minutos / 60)} hrs`
                    : `Hace ${Math.floor(minutos / 1440)} días`;

              return {
                tipo: 'venta',
                titulo: 'Nueva venta registrada',
                detalle: `${c.serie}-${String(c.numero).padStart(8, '0')} - ${c.clienteNombre}`,
                tiempo,
                icon: 'pi pi-shopping-cart',
                color: PALETA.primario,
                sede: c.sedeNombre || c.sede_nombre || c.sede || '', 
              };
            });
            this.actividadReciente.set(actividadMapeada);
          },
          error: (err) => console.error('Error actividad reciente', err),
        });
    }

    // ─────────────────────────────────────────────
    // Opciones de Chart.js — paleta corporativa
    // ─────────────────────────────────────────────

    configurarOpcionesGraficos(): void {
      const ds = getComputedStyle(document.documentElement);
      const textColor          = ds.getPropertyValue('--text-color')           || '#e0e0e0';
      const textColorSecondary = ds.getPropertyValue('--text-color-secondary') || '#9e9e9e';
      const surfaceBorder      = ds.getPropertyValue('--surface-border')       || '#333333';
      const surfaceOverlay     = ds.getPropertyValue('--surface-overlay')      || '#1e1e1e';

      // Tooltip base con identidad corporativa
      const tooltipBase = {
        backgroundColor: surfaceOverlay,
        titleColor:  PALETA.primario,
        bodyColor:   textColor,
        borderColor: PALETA.primario,
        borderWidth: 1,
      };

      // ── Línea — Ventas por Día ──────────────────
      this.chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              label: (ctx: any) =>
                `S/ ${ctx.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColorSecondary, font: { size: 11 } },
            grid:  { color: 'transparent' },
          },
          y: {
            ticks: {
              color: textColorSecondary,
              callback: (v: any) => 'S/ ' + (v / 1000).toFixed(0) + 'k',
            },
            grid: { color: surfaceBorder },
          },
        },
      };

      // ── Barras horizontal — Ventas por Distrito ─
      this.barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              label: (ctx: any) =>
                `S/ ${ctx.parsed.x.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColorSecondary,
              callback: (v: any) => 'S/ ' + (v / 1000).toFixed(0) + 'k',
            },
            grid: { color: surfaceBorder },
          },
          y: {
            ticks: { color: textColorSecondary, font: { size: 11 } },
            grid:  { color: 'transparent' },
          },
        },
      };

      // ── Barras vertical — Métodos de Pago ───────
      this.barChartOptionsCompact = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              label: (ctx: any) =>
                `S/ ${ctx.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
            },
          },
        },
        scales: {
          x: {
            ticks: { color: textColorSecondary, font: { size: 11 } },
            grid:  { color: 'transparent' },
          },
          y: {
            ticks: {
              color: textColorSecondary,
              callback: (v: any) => 'S/ ' + (v / 1000).toFixed(0) + 'k',
            },
            grid: { color: surfaceBorder },
          },
        },
      };

      // ── Dona — Categorías y Ventas por Sede ─────
      this.doughnutChartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              align: 'center',  // ← agregar esto
              labels: {
                color: textColor,
                font: { size: 11 }, // ← reducir un poco
                padding: 10,        // ← reducir padding
                usePointStyle: true,
                pointStyleWidth: 8,
                boxWidth: 8,        // ← agregar esto
              },
            },
          tooltip: {
            ...tooltipBase,
            callbacks: {
              label: (ctx: any) => {
                const label = ctx.label || '';
                const value = ctx.parsed || 0;
                return ` ${label}: S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
              },
            },
          },
        },
      };
    }
    
  }