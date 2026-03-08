import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, effect
} from '@angular/core';
import { CajaService }          from '../../services/caja.service';
import { RoleService }          from '../../../core/services/role.service';
import { CashboxSocketService } from '../../services/cashbox-socket.service';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { CardModule }           from 'primeng/card';
import { ButtonModule }         from 'primeng/button';
import { InputNumberModule }    from 'primeng/inputnumber';
import { ConfirmDialogModule }  from 'primeng/confirmdialog';
import { ConfirmationService }  from 'primeng/api';
import { FormsModule }          from '@angular/forms';
import { RouterModule }         from '@angular/router';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.css'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe, FormsModule,
    CardModule, ButtonModule, InputNumberModule,
    ConfirmDialogModule, RouterModule,
    LoadingOverlayComponent,
  ],
  providers: [ConfirmationService],
})
export class CajaPage implements OnInit, OnDestroy {
  private roleService     = inject(RoleService);
  private cashboxService  = inject(CajaService);
  private confirmService  = inject(ConfirmationService);
  protected cashboxSocket = inject(CashboxSocketService);

  readonly caja         = this.cashboxSocket.caja;
  readonly cajaDetalle  = signal<any>(null);
  readonly loading      = signal<boolean>(false);
  readonly resumen      = signal<any>(null);
  readonly montoInicial = signal<number | null>(null);
  isLoading = signal<boolean>(true);

  // Referencia al chart para destruirlo al recargar
  private chartInstance: any = null;

  readonly tiempoAbierta = computed(() => {
    const c = this.cajaDetalle() ?? this.caja();
    if (!c?.fec_apertura) return null;
    const diff = Date.now() - new Date(c.fec_apertura).getTime();
    const h    = Math.floor(diff / 3_600_000);
    const m    = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  });

  readonly idSede: number | undefined;

  private cajaListener = () => {
    this.loading.set(false);
    if (this.cashboxSocket.caja()) {
      this.cargarCajaDesdeDB(); // isLoading se apaga dentro
    } else {
      this.cajaDetalle.set(null);
      this.isLoading.set(false);
    }
    if (this.idSede) this.cargarResumen();
  };

  constructor() {
    this.idSede = this.roleService.getCurrentUser()?.idSede;

    // Renderiza el gráfico cuando cambie el resumen (con o sin ventas)
    effect(() => {
      const r = this.resumen();
      // Generar horas del día 08:00–20:00 como fallback si no hay datos
      const horas = r?.ventasPorHora ?? this.generarHorasVacias();
      setTimeout(() => this.renderChart(horas), 0);
    });
  }

  ngOnInit(): void {
    if (!this.idSede) {
      this.isLoading.set(false);
      return;
    }
    this.isLoading.set(true);
    this.loading.set(true);

    this.cashboxSocket.checkActiveSession(this.idSede)
      .then(() => {
        if (this.cashboxSocket.caja()) {
          this.cargarCajaDesdeDB();
        } else {
          this.isLoading.set(false);
        }
      })
      .finally(() => {
        this.loading.set(false);
        this.cargarResumen();
      });

    this.cashboxSocket.onCashboxEvent(this.cajaListener);
  }

  ngOnDestroy(): void {
    this.cashboxSocket.offCashboxEvent(this.cajaListener);
    this.chartInstance?.destroy();
  }

  private cargarCajaDesdeDB(): void {
    if (!this.idSede) return;
    this.cashboxService.getActiveCashbox(this.idSede).subscribe({
      next:  (data) => this.cajaDetalle.set(data),
      error: ()     => { this.cajaDetalle.set(null); this.isLoading.set(false); },
      complete: ()  => this.isLoading.set(false),
    });
  }

  cargarResumen(): void {
    if (!this.idSede) return;
    this.cashboxService.getResumenDia(this.idSede).subscribe({
      next:  (data) => this.resumen.set(data),
      error: ()     => this.resumen.set(null),
    });
  }

  abrirCaja(): void {
    if (!this.idSede) return;
    this.loading.set(true);
    this.cashboxService.openCashbox(this.idSede, this.montoInicial() ?? undefined).subscribe({
      next:  () => this.montoInicial.set(null),
      error: () => this.loading.set(false),
    });
  }

  confirmarCierre(): void {
    this.confirmService.confirm({
      message: '¿Estás seguro de cerrar la caja? Se generará el reporte del día.',
      header:  'Cerrar Caja',
      icon:    'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cerrarCaja(),
    });
  }

  private cerrarCaja(): void {
    const detalle = this.cajaDetalle() ?? this.caja();
    if (!detalle) return;
    this.loading.set(true);
    this.cashboxService.closeCashbox(detalle.id_caja).subscribe({
      error: (err) => {
        alert(err.error?.message || 'No se pudo cerrar la caja');
        this.loading.set(false);
      },
    });
  }

  /** Genera array de horas vacías 08:00–20:00 para mostrar el eje aunque no haya ventas */
  private generarHorasVacias(): { hora: string; total: number }[] {
    const horas = [];
    for (let h = 8; h <= 20; h++) {
      horas.push({ hora: `${h.toString().padStart(2, '0')}:00`, total: 0 });
    }
    return horas;
  }

  /**
   * Renderiza el gráfico de barras con ventas por hora.
   * ventasPorHora: Array<{ hora: string, total: number }>
   *
   * IMPORTANTE: requiere Chart.js → npm install chart.js
   */
  private renderChart(ventasPorHora: { hora: string; total: number }[]): void {
    const canvas = document.getElementById('ventasHoraChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destruir instancia previa si existe
    this.chartInstance?.destroy();

    // Importación dinámica para no romper si Chart.js no está disponible
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      const labels = ventasPorHora.map(v => v.hora);
      const data   = ventasPorHora.map(v => v.total);

      // Encontrar el máximo para resaltarlo
      const maxVal   = Math.max(...data);
      const barColors = data.map(v =>
        v === maxVal && v > 0 ? '#4f9cf9' : 'rgba(255,255,255,0.08)'
      );
      const borderColors = data.map(v =>
        v === maxVal && v > 0 ? '#4f9cf9' : 'rgba(255,255,255,0.15)'
      );

      this.chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: barColors,
            borderColor:     borderColors,
            borderWidth: 1,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` S/ ${(ctx.parsed.y ?? 0).toFixed(2)}`,
              },
            },
          },
          scales: {
            x: {
              grid:  { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: 'rgba(255,255,255,0.45)', font: { size: 11 } },
            },
            y: {
              grid:  { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: 'rgba(255,255,255,0.45)',
                font:  { size: 11 },
                callback: (v) => `S/ ${v}`,
              },
              beginAtZero: true,
            },
          },
        },
      });
    }).catch(() => {
      // Chart.js no instalado — silencia el error
      console.warn('Chart.js no está disponible. Instálalo con: npm install chart.js');
    });
  }
}