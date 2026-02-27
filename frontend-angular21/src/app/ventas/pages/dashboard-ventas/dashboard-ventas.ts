import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';

interface KpiVenta {
  label: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
}

interface ProductoVenta {
  codigo: string;
  descripcion: string;
  unidades: number;
  monto: number;
}

interface Reclamo {
  fecha: Date;
  cliente: string;
  motivo: string;
  estado: 'ABIERTO' | 'EN PROCESO' | 'CERRADO';
}

interface ClienteAtendido {
  fecha: Date;
  cliente: string;
  vendedor: string;
  total: number;
}

@Component({
  selector: 'app-dashboard-ventas',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TagModule, SelectModule, FormsModule],
  templateUrl: './dashboard-ventas.html',
  styleUrl: './dashboard-ventas.css',
})
export class DashboardVentas implements OnInit {
  username: string = '';
  sedeActualId: string = 'SEDE001';

  kpis: KpiVenta[] = [];

  rendimientoVendedoresChart: any;
  rendimientoVendedoresOptions: any;

  productosTopTabla: ProductoVenta[] = [];

  reclamosRecientes: Reclamo[] = [];
  clientesAtendidos: ClienteAtendido[] = [];

  anioSeleccionado: string = new Date().getFullYear().toString();
  aniosOptions: Array<{ label: string; value: string }> = [];

  ngOnInit(): void {
    this.username = this.getUserName();
    this.sedeActualId = this.getSedeActualId();

    this.generarAniosOptions();
    this.configurarOpcionesCharts();

    this.cargarTodo();
  }

  onAnioChange(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {
    this.cargarKpis();
    this.cargarRendimientoVendedores();
    this.cargarProductosTop();
    this.cargarReclamosRecientes();
    this.cargarClientesAtendidos();
  }

  private getUserName(): string {
    const userString = localStorage.getItem('user');
    if (!userString) return '';
    try {
      const user = JSON.parse(userString);
      return user.nombres || user.username || '';
    } catch {
      return '';
    }
  }

  private getSedeActualId(): string {
    const empSesionStr = localStorage.getItem('empleado_sesion');
    if (empSesionStr) {
      try {
        const emp = JSON.parse(empSesionStr);
        if (emp?.id_sede) return emp.id_sede;
      } catch {}
    }

    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        return user?.id_sede || user?.idSede || user?.sede || 'SEDE001';
      } catch {
        return 'SEDE001';
      }
    }

    return 'SEDE001';
  }

  generarAniosOptions(): void {
    const actual = new Date().getFullYear();
    this.aniosOptions = [];
    for (let i = 0; i < 5; i++) {
      const anio = actual - i;
      this.aniosOptions.push({ label: anio.toString(), value: anio.toString() });
    }
  }

  cargarKpis(): void {
    const ventasTotales = 18497;
    const ordenes = 11;
    const ticketPromedio = ventasTotales / ordenes;
    const nuevosClientes = 5;

    this.kpis = [
      {
        label: 'Total Ventas',
        value: `S/ ${ventasTotales.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: 'pi pi-dollar',
        color: '#FFA726',
        trend: '↑ 12.5% vs. mes anterior',
      },
      {
        label: 'Órdenes',
        value: ordenes.toString(),
        icon: 'pi pi-file',
        color: '#42A5F5',
        trend: '↑ 8.3% vs. mes anterior',
      },
      {
        label: 'Ticket Promedio',
        value: `S/ ${ticketPromedio.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        icon: 'pi pi-wallet',
        color: '#66BB6A',
        trend: '↑ 5.2% vs. mes anterior',
      },
      {
        label: 'Nuevos Clientes',
        value: nuevosClientes.toString(),
        icon: 'pi pi-users',
        color: '#AB47BC',
        trend: '↑ 15.7% vs. mes anterior',
      },
    ];
  }

  cargarRendimientoVendedores(): void {
    const anio = Number(this.anioSeleccionado);

    const vendedores = [
      { nombre: 'Juan Pérez', sede: 'SEDE001', anio: 2026, total: 12500 },
      { nombre: 'María Rodríguez', sede: 'SEDE001', anio: 2026, total: 11200 },
      { nombre: 'Luis Ramírez', sede: 'SEDE001', anio: 2026, total: 8800 },
      { nombre: 'Carlos Sánchez', sede: 'SEDE002', anio: 2026, total: 9800 },
      { nombre: 'Ana Torres', sede: 'SEDE003', anio: 2026, total: 9050 },

      { nombre: 'Juan Pérez', sede: 'SEDE001', anio: 2025, total: 10300 },
      { nombre: 'María Rodríguez', sede: 'SEDE001', anio: 2025, total: 9600 },
      { nombre: 'Luis Ramírez', sede: 'SEDE001', anio: 2025, total: 7900 },
    ]
      .filter(v => v.sede === this.sedeActualId && v.anio === anio)
      .sort((a, b) => b.total - a.total);

    this.rendimientoVendedoresChart = {
      labels: vendedores.map(v => v.nombre),
      datasets: [
        {
          label: 'Ventas (S/)',
          data: vendedores.map(v => v.total),
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          borderWidth: 1,
        },
      ],
    };
  }

  cargarProductosTop(): void {
    const anio = Number(this.anioSeleccionado);

    if (anio === 2025) {
      this.productosTopTabla = [
        { codigo: 'SKU-101', descripcion: 'Smart TV LED 50" 4K RAF', unidades: 5, monto: 7100 },
        { codigo: 'SKU-205', descripcion: 'Refrigerador No Frost 12 pies RAF', unidades: 3, monto: 3600 },
        { codigo: 'SKU-309', descripcion: 'Horno Eléctrico 1800W RAF', unidades: 4, monto: 1800 },
        { codigo: 'SKU-412', descripcion: 'Licuadora 700W RAF', unidades: 6, monto: 1500 },
        { codigo: 'SKU-518', descripcion: 'Plancha a vapor RAF', unidades: 7, monto: 980 },
      ];
      return;
    }

    this.productosTopTabla = [
      { codigo: 'SKU-001', descripcion: 'Smart TV LED 55" 4K RAF', unidades: 4, monto: 6398 },
      { codigo: 'SKU-015', descripcion: 'Aire Acondicionado 12000 BTU RAF', unidades: 3, monto: 5400 },
      { codigo: 'SKU-034', descripcion: 'Refrigerador No Frost 12 pies RAF', unidades: 2, monto: 2400 },
      { codigo: 'SKU-077', descripcion: 'Lavadora Automática 15kg RAF', unidades: 1, monto: 1100 },
      { codigo: 'SKU-099', descripcion: 'Horno Eléctrico 1800W RAF', unidades: 2, monto: 901 },
    ];
  }

  cargarReclamosRecientes(): void {
    this.reclamosRecientes = [
      { fecha: new Date(2026, 1, 14), cliente: 'María López', motivo: 'Producto defectuoso', estado: 'EN PROCESO' },
      { fecha: new Date(2026, 1, 14), cliente: 'Empresa Ejemplo SAC', motivo: 'Retraso en entrega', estado: 'ABIERTO' },
      { fecha: new Date(2026, 1, 13), cliente: 'Carlos Ramírez', motivo: 'Error en facturación', estado: 'CERRADO' },
    ];
  }

  cargarClientesAtendidos(): void {
    this.clientesAtendidos = [
      { fecha: new Date(2026, 1, 14), cliente: 'María López', vendedor: 'Juan Pérez', total: 1450 },
      { fecha: new Date(2026, 1, 14), cliente: 'Empresa Ejemplo SAC', vendedor: 'María Rodríguez', total: 3250 },
      { fecha: new Date(2026, 1, 14), cliente: 'Carlos Ramírez', vendedor: 'Carlos Sánchez', total: 980 },
    ];
  }

  getEstadoReclamoSeverity(
    estado: Reclamo['estado']
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null {
    if (estado === 'CERRADO') return 'success';
    if (estado === 'EN PROCESO') return 'info';
    if (estado === 'ABIERTO') return 'warn';
    return null;
  }

  configurarOpcionesCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

    this.rendimientoVendedoresOptions = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (ctx: any) => `S/ ${ctx.parsed.x.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
          },
        },
      },
      scales: {
        x: { ticks: { color: textColorSecondary }, grid: { color: surfaceBorder, drawBorder: false } },
        y: { ticks: { color: textColorSecondary }, grid: { display: false } },
      },
    };
  }
}
