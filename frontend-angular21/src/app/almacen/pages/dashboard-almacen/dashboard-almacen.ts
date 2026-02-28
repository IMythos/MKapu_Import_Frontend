import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface MovimientoReciente {
  fecha: string;
  tipo: 'INGRESO' | 'SALIDA' | 'AJUSTE';
  referencia: string;
  producto: string;
  cantidad: number;
  usuario: string;
}

interface ProductoStock {
  codigo: string;
  descripcion: string;
  stock: number;
  stockMinimo: number;
  rotacion: number;
}

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null;

@Component({
  selector: 'app-dashboard-almacen',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    TableModule,
    TagModule,
    SelectModule,
    FormsModule,
  ],
  templateUrl: './dashboard-almacen.html',
  styleUrl: './dashboard-almacen.css',
})
export class DashboardAlmacen implements OnInit {
  username: string = '';

  kpis: KpiCard[] = [];

  rendimientoChart: any;
  rendimientoChartOptions: any;

  saludStockChart: any;
  saludStockChartOptions: any;

  movimientosRecientes: MovimientoReciente[] = [];
  productosCriticos: ProductoStock[] = [];

  periodoRendimiento: string = 'mes';
  periodosOptions = [
    { label: 'Semana', value: 'semana' },
    { label: 'Mes', value: 'mes' },
    { label: 'Año', value: 'anio' },
  ];

  anioSeleccionado: string = new Date().getFullYear().toString();
  aniosOptions: any[] = [];

  ngOnInit(): void {
    this.username = this.getUserName();
    this.generarAniosOptions();
    this.cargarKpis();
    this.cargarRendimientoChart();
    this.cargarSaludStockChart();
    this.cargarMovimientosRecientes();
    this.cargarProductosCriticos();
    this.configurarOpcionesCharts();
  }

  getUserName(): string {
    const userString = localStorage.getItem('user');
    if (!userString) return '';
    try {
      const user = JSON.parse(userString);
      return user.nombres || user.username || '';
    } catch {
      return '';
    }
  }

  generarAniosOptions(): void {
    const actual = new Date().getFullYear();
    this.aniosOptions = [];
    for (let i = 0; i < 4; i++) {
      const anio = actual - i;
      this.aniosOptions.push({ label: anio.toString(), value: anio.toString() });
    }
  }

  cargarKpis(): void {
    const valorInventario = 185000;
    const itemsBajoStock = 12;
    const exactitud = 97.5;
    const rotacion = 4.3;

    this.kpis = [
      {
        label: 'Valor Inventario',
        value: `S/ ${valorInventario.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
        icon: 'pi pi-box',
        color: '#42A5F5',
        trend: '+2.1% vs mes anterior',
      },
      {
        label: 'Ítems Bajo Stock Mínimo',
        value: itemsBajoStock.toString(),
        icon: 'pi pi-exclamation-triangle',
        color: '#FFA726',
        trend: 'Revisar reposición',
      },
      {
        label: 'Exactitud de Inventario',
        value: `${exactitud.toFixed(1)}%`,
        icon: 'pi pi-check-circle',
        color: '#66BB6A',
        trend: '+0.8 puntos',
      },
      {
        label: 'Rotación Promedio',
        value: rotacion.toFixed(1),
        icon: 'pi pi-refresh',
        color: '#AB47BC',
        trend: 'Veces por año',
      },
    ];
  }

  onPeriodoRendimientoChange(): void {
    this.cargarRendimientoChart();
  }

  onAnioChange(): void {
    this.cargarSaludStockChart();
  }

  cargarRendimientoChart(): void {
    let labels: string[] = [];
    let datos: number[] = [];

    if (this.periodoRendimiento === 'semana') {
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      datos = [18, 22, 19, 24, 26, 15, 10];
    } else if (this.periodoRendimiento === 'mes') {
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
      datos = [95, 110, 102, 120];
    } else {
      labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      datos = [320, 290, 310, 340, 360, 380, 400, 395, 370, 390, 410, 430];
    }

    this.rendimientoChart = {
      labels,
      datasets: [
        {
          label: 'Movimientos procesados',
          data: datos,
          borderColor: '#42A5F5',
          backgroundColor: 'rgba(66,165,245,0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  }

  cargarSaludStockChart(): void {
    const labels = ['Stock Óptimo', 'Bajo Stock', 'Sobre-stock'];
    const datos = [68, 12, 20];

    this.saludStockChart = {
      labels,
      datasets: [
        {
          data: datos,
          backgroundColor: ['#66BB6A', '#FFA726', '#EF5350'],
          hoverBackgroundColor: ['#81C784', '#FFB74D', '#E57373'],
        },
      ],
    };
  }

  cargarMovimientosRecientes(): void {
    this.movimientosRecientes = [
      {
        fecha: '14 Feb 2026 09:32',
        tipo: 'INGRESO',
        referencia: 'OC-000123',
        producto: 'Cable HDMI 2m',
        cantidad: 50,
        usuario: 'Almacenero Sistema',
      },
      {
        fecha: '14 Feb 2026 08:47',
        tipo: 'SALIDA',
        referencia: 'VEN-000987',
        producto: 'Mouse Inalámbrico',
        cantidad: 12,
        usuario: 'Vendedor Sistema',
      },
      {
        fecha: '13 Feb 2026 18:05',
        tipo: 'AJUSTE',
        referencia: 'AJ-000045',
        producto: 'Teclado Mecánico',
        cantidad: -2,
        usuario: 'Almacenero Sistema',
      },
      {
        fecha: '13 Feb 2026 16:22',
        tipo: 'INGRESO',
        referencia: 'OC-000122',
        producto: 'Monitor 24"',
        cantidad: 10,
        usuario: 'Almacenero Sistema',
      },
    ];
  }

  cargarProductosCriticos(): void {
    this.productosCriticos = [
      { codigo: 'SKU-001', descripcion: 'Cable HDMI 2m', stock: 8, stockMinimo: 20, rotacion: 7.5 },
      {
        codigo: 'SKU-015',
        descripcion: 'Mouse Inalámbrico',
        stock: 5,
        stockMinimo: 15,
        rotacion: 5.8,
      },
      {
        codigo: 'SKU-034',
        descripcion: 'Teclado Mecánico',
        stock: 3,
        stockMinimo: 10,
        rotacion: 4.2,
      },
      { codigo: 'SKU-077', descripcion: 'SSD 512GB', stock: 6, stockMinimo: 12, rotacion: 6.1 },
    ];
  }

  configurarOpcionesCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#e5e7eb';
    const textColorSecondary =
      documentStyle.getPropertyValue('--text-color-secondary') || '#9ca3af';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#374151';

    this.rendimientoChartOptions = {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: documentStyle.getPropertyValue('--surface-overlay') || '#111827',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
        },
      },
      scales: {
        x: { ticks: { color: textColorSecondary }, grid: { color: 'transparent' } },
        y: {
          ticks: { color: textColorSecondary },
          grid: { color: surfaceBorder, drawBorder: false },
        },
      },
    };

    this.saludStockChartOptions = {
      cutout: '60%',
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: documentStyle.getPropertyValue('--surface-overlay') || '#111827',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
        },
      },
    };
  }

  getSeveridadStock(prod: ProductoStock): TagSeverity {
    if (prod.stock <= prod.stockMinimo / 2) return 'danger';
    if (prod.stock <= prod.stockMinimo) return 'warn';
    return 'success';
  }

  getEstadoStockTexto(prod: ProductoStock): string {
    if (prod.stock <= prod.stockMinimo / 2) return 'Crítico';
    if (prod.stock <= prod.stockMinimo) return 'Bajo';
    return 'OK';
  }

  getStockPct(prod: ProductoStock): number {
    if (!prod.stockMinimo) return 0;
    return Math.max(0, Math.min(100, (prod.stock / prod.stockMinimo) * 100));
  }

  getBarColor(prod: ProductoStock): string {
    const sev = this.getSeveridadStock(prod);
    if (sev === 'danger') return '#EF5350';
    if (sev === 'warn') return '#FFA726';
    return '#66BB6A';
  }
  getStockLabel(prod: ProductoStock): string {
    return `${prod.stock}`;
  }
}
