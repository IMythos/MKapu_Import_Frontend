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
}

export interface MejorVendedor {
  nombre: string;
  totalVentas: number;
  montoTotal: string;
  ticketPromedio: string;
  sede: string;
}

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
  ],
  templateUrl: './dashboard-admin.html',
  standalone: true,
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdmin implements OnInit {
  private dashboardService = inject(DashboardService);
  // 2. INYECTAR SERVICIO
  private sedeService = inject(SedeService);

  Math = Math;
  username = signal<string>('');
  isLoading = signal<boolean>(true);
  
  totalVentas = signal<number>(0);
  totalOrdenes = signal<number>(0);
  ticketPromedio = signal<number>(0);
  nuevosClientes = signal<number>(0);

  variacionVentas = signal<number>(0);
  variacionOrdenes = signal<number>(0);
  variacionTicket = signal<number>(0);
  variacionClientes = signal<number>(0);

  ventasPorDiaChart = signal<any>(null);
  ventasPorCategoriaChart = signal<any>(null);
  metodosPagoChart = signal<any>(null);
  ventasPorSedeChart = signal<any>(null);
  ventasPorDistritoChart = signal<any>(null);

  topProductos = signal<TopProducto[]>([]);
  actividadReciente = signal<ActividadReciente[]>([]);
  mejoresVendedores = signal<MejorVendedor[]>([]);
  
  // 3. SEÑALES PARA LA SEDE
  idSede = signal<string>('');
  sedesOptions = signal<any[]>([]);

  periodoVentasDia = signal<string>('anio');
  mesVentasDistrito = signal<string>('anio');
  mesMetodosPago = signal<string>('anio');
  mesVentasSede = signal<string>('anio');
  mesTopProductos = signal<string>('anio');
  mesMejoresVendedores = signal<string>('anio');

  aniosOptions = signal<any[]>([]);
  
  periodosOptions = [
    { label: 'Última Semana', value: 'semana' },
    { label: 'Último Mes', value: 'mes' },
    { label: 'Último Trimestre', value: 'trimestre' },
    { label: 'Año Actual', value: 'anio' },
  ];

  chartOptions: any;
  barChartOptions: any;
  barChartOptionsCompact: any;
  doughnutChartOptions: any;

  ngOnInit(): void {
    this.username.set(this.getUserName());
    this.idSede.set(this.getUserSede());
    
    this.configurarOpcionesGraficos();
    this.cargarSedes();
    this.cargarTodoElDashboard();
  }

  cargarSedes(): void {
    this.sedeService.getSedes().subscribe({
      next: (res) => {
        const sedes = res.headquarters || [];
        this.sedesOptions.set(sedes);
      },
      error: (err) => console.error('Error cargando sedes', err)
    });
  }

  onSedeGlobalChange(sedeId: string | null): void {
    this.idSede.set(sedeId || '');
    this.cargarTodoElDashboard();
  }

  cargarTodoElDashboard(): void {
    this.isLoading.set(true);
    this.cargarEstadisticas();
    this.cargarGraficos();
    this.cargarTopProductos();
    this.cargarActividadReciente();
    this.cargarMejoresVendedores();
    this.isLoading.set(false);
  }

  getUserSede(): string {
    const userString = localStorage.getItem('user');
    if (!userString) return '';
    try {
      const user = JSON.parse(userString);
      return user.id_sede ? String(user.id_sede) : ''; 
    } catch (error) {
      return '';
    }
  }

  getUserName(): string {
    const userString = localStorage.getItem('user');
    if (!userString) return 'Administrador';
    try {
      const user = JSON.parse(userString);
      return user.nombres || user.username || 'Administrador';
    } catch (error) {
      return 'Administrador';
    }
  }

  onPeriodoVentasDiaChange(value: string): void {
    this.periodoVentasDia.set(value);
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
  
  cargarEstadisticas(): void {
    this.dashboardService.getKpis(this.periodoVentasDia()).subscribe({
      next: (kpis) => {
        const vnt = Number(kpis.totalVentas) || 0;
        const ord = Number(kpis.totalOrdenes) || 0;
        const clie = Number(kpis.nuevosClientes) || 0;

        this.totalVentas.set(vnt);
        this.totalOrdenes.set(ord);
        this.nuevosClientes.set(clie);

        const ticket = ord > 0 ? vnt / ord : 0;
        this.ticketPromedio.set(ticket);

        if (kpis.variaciones) {
          this.variacionVentas.set(Number(kpis.variaciones.ventas) || 0);
          this.variacionOrdenes.set(Number(kpis.variaciones.ordenes) || 0);
          this.variacionTicket.set(Number(kpis.variaciones.ticket) || 0);
          this.variacionClientes.set(Number(kpis.variaciones.clientes) || 0);
        } else {
          this.variacionVentas.set(0);
          this.variacionOrdenes.set(0);
          this.variacionTicket.set(0);
          this.variacionClientes.set(0);
        }
      },
      error: (err) => {
        console.error('Error cargando KPIs', err);
      }
    });
  }

  getAbs(value: number): number {
    return Math.abs(value);
  }

  cargarGraficos(): void {
    this.cargarGraficoVentasPorDia();
    this.cargarGraficoVentasPorCategoria();
    this.cargarGraficoMetodosPago();
    this.cargarGraficoVentasPorSede();
    this.cargarGraficoVentasPorDistrito();
  }

  cargarGraficoVentasPorDia(): void {
    this.dashboardService.getSalesChart(this.periodoVentasDia(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.ventasPorDiaChart.set({
          labels: data.labels || [],
          datasets: [
            {
              label: 'Ventas',
              data: data.values || [],
              fill: true,
              backgroundColor: 'rgba(255, 167, 38, 0.2)',
              borderColor: '#FFA726',
              tension: 0.4,
              pointBackgroundColor: '#FFA726',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
            },
          ],
        });
      },
      error: (err) => console.error('Error ventas por día', err)
    });
  }

  cargarGraficoVentasPorCategoria(): void {
    this.dashboardService.getSalesByCategory(this.periodoVentasDia(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.ventasPorCategoriaChart.set({
          labels: data.labels || [],
          datasets: [
            {
              data: data.values || [],
              backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#26A69A'],
              hoverBackgroundColor: ['#64B5F6', '#81C784', '#FFB74D', '#BA68C8', '#4DB6AC'],
            },
          ],
        });
      }
    });
  }

  cargarGraficoMetodosPago(): void {
    this.dashboardService.getPaymentMethods(this.mesMetodosPago(), this.idSede() || undefined).subscribe({
      next: (data) => {
        if (data && data.labels) {
          this.metodosPagoChart.set({
            labels: data.labels,
            datasets: [
              {
                data: data.values,
                backgroundColor: ['#66BB6A', '#42A5F5', '#AB47BC', '#FFA726', '#26A69A'],
                borderWidth: 0,
              },
            ],
          });
        }
      }
    });
  }

  cargarGraficoVentasPorSede(): void {
    this.dashboardService.getSalesByHeadquarter(this.mesVentasSede(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.ventasPorSedeChart.set({
          labels: data.labels || [], 
          datasets: [
            {
              data: data.values || [],
              backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
              borderWidth: 0,
            },
          ],
        });
      }
    });
  }

  cargarGraficoVentasPorDistrito(): void {
    this.dashboardService.getSalesByDistrict(this.mesVentasDistrito(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.ventasPorDistritoChart.set({
          labels: data.labels || [], 
          datasets: [
            {
              label: 'Ventas por Distrito',
              data: data.values || [],
              backgroundColor: '#42A5F5',
              borderColor: '#1E88E5',
              borderWidth: 1,
            },
          ],
        });
      }
    });
  }

  cargarTopProductos(): void {
    this.dashboardService.getTopProducts(this.mesTopProductos(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.topProductos.set(data || []);
      }
    });
  }

  cargarMejoresVendedores(): void {
    this.dashboardService.getTopSellers(this.mesMejoresVendedores(), this.idSede() || undefined).subscribe({
      next: (data) => {
        this.mejoresVendedores.set(data || []);
      }
    });
  }

  cargarActividadReciente(): void {
    this.dashboardService.getRecentSales(this.periodoVentasDia(), this.idSede() || undefined).subscribe({
      next: (data: any[]) => {
        const actividadMapeada: ActividadReciente[] = data.map((c) => {
          const minutos = Math.floor((Date.now() - new Date(c.fechaEmision || c.fec_emision).getTime()) / 60000);
          const tiempo = minutos < 60 ? `Hace ${minutos} min` : minutos < 1440 ? `Hace ${Math.floor(minutos / 60)} hrs` : `Hace ${Math.floor(minutos / 1440)} días`;

          return {
            tipo: 'venta',
            titulo: 'Nueva venta registrada',
            detalle: `${c.serie}-${String(c.numero).padStart(8, '0')} - ${c.clienteNombre}`,
            tiempo: tiempo,
            icon: 'pi pi-shopping-cart',
            color: '#FFA726',
          };
        });

        this.actividadReciente.set(actividadMapeada);
      },
      error: (err) => console.error('Error cargando actividad reciente', err)
    });
  }

  configurarOpcionesGraficos(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: any) => `S/ ${context.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
          },
        },
      },
      scales: {
        x: { ticks: { color: textColorSecondary, font: { size: 11 } }, grid: { color: 'transparent' } },
        y: { ticks: { color: textColorSecondary, callback: (value: any) => 'S/ ' + (value / 1000).toFixed(0) + 'k' }, grid: { color: surfaceBorder, drawBorder: false } },
      },
    };
  }
}
