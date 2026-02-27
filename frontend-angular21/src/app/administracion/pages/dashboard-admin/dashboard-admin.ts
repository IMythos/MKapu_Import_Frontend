import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../../core/services/ventas.service';
import { ProductosService } from '../../../core/services/productos.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { PosService } from '../../../core/services/pos.service';
import { PromocionesService } from '../../../core/services/promociones.service';
import { ReclamosService } from '../../../core/services/reclamo.service';
import { SedeService } from '../../../core/services/sede.service';
import { EmpleadosService } from '../../../core/services/empleados.service';

interface TopProducto {
  nombre: string;
  ventas: number;
  ingresos: string;
}

interface ActividadReciente {
  tipo: 'venta' | 'stock' | 'cliente' | 'pago' | 'transferencia';
  titulo: string;
  detalle: string;
  tiempo: string;
  icon: string;
  color: string;
}

interface MejorVendedor {
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
  private ventasService = inject(VentasService);
  private productosService = inject(ProductosService);
  private clientesService = inject(ClientesService);
  private posService = inject(PosService);
  private promocionesService = inject(PromocionesService);
  private reclamosService = inject(ReclamosService);
  private sedeService = inject(SedeService);
  private empleadosService = inject(EmpleadosService);

  totalVentas: number = 0;
  totalOrdenes: number = 0;
  ticketPromedio: number = 0;
  nuevosClientes: number = 0;

  variacionVentas: number = 0;
  variacionOrdenes: number = 0;
  variacionTicket: number = 0;
  variacionClientes: number = 0;

  ventasPorDiaChart: any;
  ventasPorCategoriaChart: any;
  metodosPagoChart: any;
  ventasPorSedeChart: any;
  ventasPorDistritoChart: any;

  chartOptions: any;
  barChartOptions: any;
  barChartOptionsCompact: any;
  doughnutChartOptions: any;

  topProductos: TopProducto[] = [];
  actividadReciente: ActividadReciente[] = [];
  mejoresVendedores: MejorVendedor[] = [];

  periodoVentasDia: string = 'anio';
  mesVentasDistrito: string = '';
  mesMetodosPago: string = '';
  mesVentasSede: string = '';
  mesTopProductos: string = '';
  mesMejoresVendedores: string = '';

  periodosOptions = [
    { label: 'Última Semana', value: 'semana' },
    { label: 'Último Mes', value: 'mes' },
    { label: 'Último Trimestre', value: 'trimestre' },
    { label: 'Año Actual', value: 'anio' },
  ];

  aniosOptions: any[] = [];
  username: string = '';

  ngOnInit(): void {
    this.username = this.getUserName();
    this.inicializarFechas();
    this.generarOpcionesAnios();
    this.cargarEstadisticas();
    this.cargarGraficos();
    this.cargarTopProductos();
    this.cargarActividadReciente();
    this.cargarMejoresVendedores();
    this.configurarOpcionesGraficos();
  }

  inicializarFechas(): void {
    const anioActual = this.getAnioActual();
    this.mesVentasDistrito = anioActual;
    this.mesMetodosPago = anioActual;
    this.mesVentasSede = anioActual;
    this.mesTopProductos = anioActual;
    this.mesMejoresVendedores = anioActual;
  }

  getAnioActual(): string {
    const fecha = new Date();
    return fecha.getFullYear().toString();
  }

  generarOpcionesAnios(): void {
    const anioActual = new Date().getFullYear();
    this.aniosOptions = [];
    
    for (let i = 0; i < 5; i++) {
      const anio = anioActual - i;
      this.aniosOptions.push({
        label: anio.toString(),
        value: anio.toString(),
      });
    }
  }

  getUserName(): string {
    const userString = localStorage.getItem('user');
    if (!userString) {
      return '';
    }
    try {
      const user = JSON.parse(userString);
      return user.nombres || user.username || '';
    } catch (error) {
      console.error('Error parseando usuario del localStorage', error);
      return '';
    }
  }

  cargarEstadisticas(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    this.totalVentas = comprobantes.reduce((sum, c) => sum + c.total, 0);
    this.totalOrdenes = comprobantes.length;
    this.ticketPromedio =
      this.totalOrdenes > 0 ? this.totalVentas / this.totalOrdenes : 0;
    this.nuevosClientes = this.clientesService.getTotalClientes();
    this.variacionVentas = 12.5;
    this.variacionOrdenes = 8.3;
    this.variacionTicket = 5.2;
    this.variacionClientes = 15.7;
  }

  cargarGraficos(): void {
    this.cargarGraficoVentasPorDia();
    this.cargarGraficoVentasPorCategoria();
    this.cargarGraficoMetodosPago();
    this.cargarGraficoVentasPorSede();
    this.cargarGraficoVentasPorDistrito();
  }

  onPeriodoVentasDiaChange(): void {
    this.cargarGraficoVentasPorDia();
  }

  onMesVentasDistritoChange(): void {
    this.cargarGraficoVentasPorDistrito();
  }

  onMesMetodosPagoChange(): void {
    this.cargarGraficoMetodosPago();
  }

  onMesVentasSedeChange(): void {
    this.cargarGraficoVentasPorSede();
  }

  onMesTopProductosChange(): void {
    this.cargarTopProductos();
  }

  onMesMejoresVendedoresChange(): void {
    this.cargarMejoresVendedores();
  }

  extraerDistrito(direccion: string | null): string {
    if (!direccion) return 'Sin Distrito';
    const partes = direccion.split(',');
    if (partes.length > 1) {
      return partes[partes.length - 1].trim();
    }
    return 'Sin Distrito';
  }

  cargarGraficoVentasPorDia(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    const fechaActual = new Date();
    let fechaInicio = new Date();

    switch (this.periodoVentasDia) {
      case 'semana':
        fechaInicio.setDate(fechaActual.getDate() - 7);
        break;
      case 'mes':
        fechaInicio.setMonth(fechaActual.getMonth() - 1);
        break;
      case 'trimestre':
        fechaInicio.setMonth(fechaActual.getMonth() - 3);
        break;
      case 'anio':
        fechaInicio = new Date(fechaActual.getFullYear(), 0, 1);
        break;
    }

    const comprobantesFiltrados = comprobantes.filter(
      (c) => new Date(c.fec_emision) >= fechaInicio,
    );

    const ventasPorDia = new Map<string, number>();
    comprobantesFiltrados.forEach((c) => {
      const fecha = new Date(c.fec_emision);
      const dia = `${String(fecha.getDate()).padStart(2, '0')} ${fecha.toLocaleDateString('es-PE', { month: 'short' })}`;
      ventasPorDia.set(dia, (ventasPorDia.get(dia) || 0) + c.total);
    });

    const labels = Array.from(ventasPorDia.keys());
    const data = Array.from(ventasPorDia.values());

    this.ventasPorDiaChart = {
      labels: labels,
      datasets: [
        {
          label: 'Ventas',
          data: data,
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
    };
  }

  cargarGraficoVentasPorCategoria(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    const ventasPorFamilia = new Map<string, number>();

    comprobantes.forEach((c) => {
      c.detalles.forEach((d) => {
        const productos = this.productosService.getProductosPorCodigo(d.cod_prod);
        if (productos.length > 0) {
          const familia = productos[0].familia;
          const total = d.cantidad * d.pre_uni;
          ventasPorFamilia.set(familia, (ventasPorFamilia.get(familia) || 0) + total);
        }
      });
    });

    const sortedFamilias = Array.from(ventasPorFamilia.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.ventasPorCategoriaChart = {
      labels: sortedFamilias.map((f) => f[0]),
      datasets: [
        {
          data: sortedFamilias.map((f) => f[1]),
          backgroundColor: [
            '#42A5F5',
            '#66BB6A',
            '#FFA726',
            '#AB47BC',
            '#26A69A',
          ],
          hoverBackgroundColor: [
            '#64B5F6',
            '#81C784',
            '#FFB74D',
            '#BA68C8',
            '#4DB6AC',
          ],
        },
      ],
    };
  }

  cargarGraficoMetodosPago(): void {
    const anio = parseInt(this.mesMetodosPago);
    const pagos = this.posService.getPagos();

    const pagosFiltrados = pagos.filter((p) => {
      const comprobante = this.ventasService
        .getComprobantes()
        .find((c) => c.id_comprobante === p.id_comprobante);
      if (comprobante) {
        const fecha = new Date(comprobante.fec_emision);
        return fecha.getFullYear() === anio;
      }
      return false;
    });

    const metodosPago = new Map<string, number>();
    pagosFiltrados.forEach((p) => {
      metodosPago.set(p.med_pago, (metodosPago.get(p.med_pago) || 0) + p.monto);
    });

    const labels = Array.from(metodosPago.keys());
    const data = Array.from(metodosPago.values());

    this.metodosPagoChart = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: ['#66BB6A', '#42A5F5', '#AB47BC', '#FFA726'],
          borderWidth: 0,
        },
      ],
    };
  }

  cargarGraficoVentasPorSede(): void {
    const anio = parseInt(this.mesVentasSede);
    const sedes = ['LAS FLORES', 'LURIN', 'VES'];

    const ventasPorSede = sedes.map((sede) => {
      const comprobantes = this.ventasService.getComprobantesPorSede(
        `SEDE00${sedes.indexOf(sede) + 1}`,
      );
      const comprobantesFiltrados = comprobantes.filter((c) => {
        const fecha = new Date(c.fec_emision);
        return c.estado && fecha.getFullYear() === anio;
      });
      return comprobantesFiltrados.reduce((sum, c) => sum + c.total, 0);
    });

    this.ventasPorSedeChart = {
      labels: sedes,
      datasets: [
        {
          data: ventasPorSede,
          backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
          borderWidth: 0,
        },
      ],
    };
  }

  cargarGraficoVentasPorDistrito(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    const anio = parseInt(this.mesVentasDistrito);

    const comprobantesFiltrados = comprobantes.filter((c) => {
      const fecha = new Date(c.fec_emision);
      return fecha.getFullYear() === anio;
    });

    const ventasPorDistrito = new Map<string, number>();
    comprobantesFiltrados.forEach((c) => {
      const cliente = this.clientesService.getClientePorId(c.id_cliente);
      if (cliente) {
        const distrito = this.extraerDistrito(cliente.direccion);
        ventasPorDistrito.set(
          distrito,
          (ventasPorDistrito.get(distrito) || 0) + c.total,
        );
      }
    });

    const sortedDistritos = Array.from(ventasPorDistrito.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.ventasPorDistritoChart = {
      labels: sortedDistritos.map((d) => d[0]),
      datasets: [
        {
          label: 'Ventas por Distrito',
          data: sortedDistritos.map((d) => d[1]),
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          borderWidth: 1,
        },
      ],
    };
  }

  cargarTopProductos(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    const anio = parseInt(this.mesTopProductos);

    const comprobantesFiltrados = comprobantes.filter((c) => {
      const fecha = new Date(c.fec_emision);
      return fecha.getFullYear() === anio;
    });

    const ventasPorProducto = new Map<
      string,
      { cantidad: number; ingresos: number; nombre: string }
    >();

    comprobantesFiltrados.forEach((c) => {
      c.detalles.forEach((d) => {
        const key = d.cod_prod;
        const actual = ventasPorProducto.get(key) || {
          cantidad: 0,
          ingresos: 0,
          nombre: d.descripcion,
        };
        actual.cantidad += d.cantidad;
        actual.ingresos += d.cantidad * d.pre_uni;
        ventasPorProducto.set(key, actual);
      });
    });

    const sortedProductos = Array.from(ventasPorProducto.entries())
      .sort((a, b) => b[1].ingresos - a[1].ingresos)
      .slice(0, 5);

    this.topProductos = sortedProductos.map(([codigo, datos]) => ({
      nombre: datos.nombre,
      ventas: datos.cantidad,
      ingresos: `S/ ${datos.ingresos.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    }));
  }

  cargarMejoresVendedores(): void {
    const comprobantes = this.ventasService.getComprobantesPorEstado(true);
    const anio = parseInt(this.mesMejoresVendedores);

    const comprobantesFiltrados = comprobantes.filter((c) => {
      const fecha = new Date(c.fec_emision);
      return fecha.getFullYear() === anio;
    });

    const ventasPorVendedor = new Map<
      string,
      {
        nombre: string;
        totalVentas: number;
        montoTotal: number;
        sede: string;
      }
    >();

    comprobantesFiltrados.forEach((c) => {
      const key = c.id_empleado || c.id_sede || 'SIN-VENDEDOR';
      
      const actual = ventasPorVendedor.get(key) || {
        nombre: 'Vendedor General',
        totalVentas: 0,
        montoTotal: 0,
        sede: c.id_sede,
      };

      actual.totalVentas += 1;
      actual.montoTotal += c.total;
      ventasPorVendedor.set(key, actual);
    });

    const sedesMap: { [key: string]: string } = {
      'SEDE001': 'Las Flores',
      'SEDE002': 'Lurín',
      'SEDE003': 'VES',
    };

    this.mejoresVendedores = Array.from(ventasPorVendedor.values())
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 5)
      .map((v) => ({
        nombre: v.nombre,
        totalVentas: v.totalVentas,
        montoTotal: `S/ ${v.montoTotal.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
        ticketPromedio: `S/ ${(v.montoTotal / v.totalVentas).toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
        sede: sedesMap[v.sede] || v.sede,
      }));
  }

  cargarActividadReciente(): void {
    const comprobantes = this.ventasService
      .getComprobantes()
      .sort(
        (a, b) =>
          new Date(b.fec_emision).getTime() - new Date(a.fec_emision).getTime(),
      )
      .slice(0, 5);

    this.actividadReciente = comprobantes.map((c) => {
      const minutos = Math.floor(
        (Date.now() - new Date(c.fec_emision).getTime()) / 60000,
      );
      const tiempo =
        minutos < 60
          ? `Hace ${minutos} minutos`
          : minutos < 1440
            ? `Hace ${Math.floor(minutos / 60)} horas`
            : `Hace ${Math.floor(minutos / 1440)} días`;

      return {
        tipo: 'venta' as const,
        titulo: 'Nueva venta registrada',
        detalle: `${c.serie}-${String(c.numero).padStart(8, '0')} - ${c.cliente_nombre}`,
        tiempo: tiempo,
        icon: 'pi pi-shopping-cart',
        color: '#FFA726',
      };
    });

    this.actividadReciente.splice(1, 0, {
      tipo: 'stock',
      titulo: 'Stock actualizado',
      detalle: 'Cable HDMI 2m - 50 unidades agregadas',
      tiempo: 'Hace 15 minutos',
      icon: 'pi pi-box',
      color: '#42A5F5',
    });

    this.actividadReciente.splice(3, 0, {
      tipo: 'cliente',
      titulo: 'Nuevo cliente registrado',
      detalle: 'Maria Gonzalez - DNI 11000000',
      tiempo: 'Hace 1 hora',
      icon: 'pi pi-user-plus',
      color: '#AB47BC',
    });
  }

  configurarOpcionesGraficos(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor =
      documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary =
      documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder =
      documentStyle.getPropertyValue('--surface-border') || '#dee2e6';

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor:
            documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              return `S/ ${context.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              size: 11,
            },
          },
          grid: {
            color: 'transparent',
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
            callback: function (value: any) {
              return 'S/ ' + (value / 1000).toFixed(0) + 'k';
            },
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };

    this.barChartOptions = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor:
            documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              return `S/ ${context.parsed.x.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            callback: function (value: any) {
              return 'S/ ' + (value / 1000).toFixed(0) + 'k';
            },
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false,
          },
        },
      },
    };

    this.barChartOptionsCompact = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor:
            documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              return `S/ ${context.parsed.x.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              size: 10,
            },
            callback: function (value: any) {
              return 'S/ ' + (value / 1000).toFixed(0) + 'k';
            },
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
            font: {
              size: 11,
            },
          },
          grid: {
            display: false,
          },
        },
      },
    };

    this.doughnutChartOptions = {
      cutout: '60%',
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: textColor,
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          backgroundColor:
            documentStyle.getPropertyValue('--surface-overlay') || '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: surfaceBorder,
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`;
            },
          },
        },
      },
    };
  }
}
