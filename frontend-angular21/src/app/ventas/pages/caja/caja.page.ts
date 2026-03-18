import {
  Component, OnInit, OnDestroy,
  inject, signal, computed, effect, NgZone
} from '@angular/core';
import { CajaService }          from '../../services/caja.service';
import { RoleService }          from '../../../core/services/role.service';
import { CashboxSocketService } from '../../services/cashbox-socket.service';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { CardModule }           from 'primeng/card';
import { ButtonModule }         from 'primeng/button';
import { InputNumberModule }    from 'primeng/inputnumber';
import { ConfirmDialogModule }  from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule }          from '@angular/forms';
import { RouterModule }         from '@angular/router';
import { LoadingOverlayComponent } from '../../../shared/components/loading-overlay/loading-overlay.component';
import { ToastModule }          from 'primeng/toast';
import { DialogModule }         from 'primeng/dialog';
import { TableModule }          from 'primeng/table';
import { TagModule }            from 'primeng/tag';
import { TooltipModule }        from 'primeng/tooltip';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.css'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, DecimalPipe, FormsModule,
    CardModule, ButtonModule, InputNumberModule,
    ConfirmDialogModule, RouterModule,
    LoadingOverlayComponent, ToastModule, DialogModule,
    TableModule, TagModule, TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
})
export class CajaPage implements OnInit, OnDestroy {
  private roleService     = inject(RoleService);
  private cashboxService  = inject(CajaService);
  private confirmService  = inject(ConfirmationService);
  private messageService  = inject(MessageService);
  private ngZone          = inject(NgZone);
  protected cashboxSocket = inject(CashboxSocketService);

  readonly caja         = this.cashboxSocket.caja;
  readonly cajaDetalle  = signal<any>(null);
  readonly loading      = signal<boolean>(false);
  readonly resumen      = signal<any>(null);
  readonly montoInicial = signal<number | null>(null);
  readonly historial        = signal<any[]>([]);
  readonly historialVisible = signal<boolean>(false);
  readonly historialLoading = signal<boolean>(false);
  isLoading = signal<boolean>(true);

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

  // ── Socket listener: corre dentro de NgZone para que Angular detecte cambios ──
  private cajaListener = () => {
    this.ngZone.run(() => {
      if (this.cashboxSocket.caja()) {
        this.cargarCajaDesdeDB();
      } else {
        this.cajaDetalle.set(null);
        this.chartInstance?.destroy();
        this.chartInstance = null;
        this.isLoading.set(false);
      }
      if (this.idSede) this.cargarResumen();
      this.loading.set(false);
    });
  };

  constructor() {
    this.idSede = this.roleService.getCurrentUser()?.idSede;

    effect(() => {
      const r     = this.resumen();
      const horas = r?.ventasPorHora ?? this.generarHorasVacias();
      if (this.caja()) {
        setTimeout(() => this.renderChart(horas), 50);
      }
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
      next:     (data) => this.cajaDetalle.set(data),
      error:    ()     => { this.cajaDetalle.set(null); this.isLoading.set(false); },
      complete: ()     => this.isLoading.set(false),
    });
  }

  cargarResumen(): void {
    if (!this.idSede) return;
    this.cashboxService.getResumenDia(this.idSede).subscribe({
      next:  (data) => this.resumen.set(data),
      error: ()     => this.resumen.set(null),
    });
  }

  // ── ABRIR: espera next() del backend ANTES de verificar sesión ──
  abrirCaja(): void {
    if (!this.idSede) return;
    this.loading.set(true);

    this.cashboxService.openCashbox(this.idSede, this.montoInicial() ?? undefined).subscribe({
      next: () => {
        this.montoInicial.set(null);
        // ✅ checkActiveSession DENTRO del next() — secuencial, no paralelo
        this.cashboxSocket.checkActiveSession(this.idSede!).then(() => {
          if (this.cashboxSocket.caja()) {
            this.cargarCajaDesdeDB();
          }
          this.cargarResumen();
          this.loading.set(false);
        }).catch(() => this.loading.set(false));
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al abrir caja',
          detail: err?.error?.message ?? 'No se pudo abrir la caja.',
          life: 4000,
        });
      },
    });
  }

  confirmarCierre(): void {
    this.confirmService.confirm({
      message:    '¿Estás seguro de cerrar la caja? Se generará el reporte del día.',
      header:     'Cerrar Caja',
      icon:       'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cerrarCaja(),
    });
  }

  // ── CERRAR: espera next() del backend ANTES de limpiar estado ──
  private cerrarCaja(): void {
    const detalle = this.cajaDetalle() ?? this.caja();
    if (!detalle) return;
    this.loading.set(true);

    this.cashboxService.closeCashbox(detalle.id_caja).subscribe({
      next: () => {
        // ✅ Limpieza DENTRO del next() — solo cuando el backend confirma
        this.cajaDetalle.set(null);
        this.chartInstance?.destroy();
        this.chartInstance = null;

        this.cashboxSocket.checkActiveSession(this.idSede!).then(() => {
          this.cargarResumen();
          this.loading.set(false);
        }).catch(() => this.loading.set(false));
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error', summary: 'Error al cerrar caja',
          detail: err?.error?.message ?? 'No se pudo cerrar la caja.',
          life: 4000,
        });
      },
    });
  }

  imprimirResumenActual(): void {
    if (!this.idSede) return;
    this.cashboxService.printResumenThermal(this.idSede).subscribe({
      error: () => console.warn('No se pudo imprimir el resumen'),
    });
  }

  verHistorial(): void {
    if (!this.idSede) return;
    this.historialVisible.set(true);
    this.historialLoading.set(true);
    this.cashboxService.getHistorial(this.idSede).subscribe({
      next:  (data) => { this.historial.set(data); this.historialLoading.set(false); },
      error: ()     => this.historialLoading.set(false),
    });
  }

  imprimirCajaHistorial(idCaja: string): void {
    this.cashboxService.printResumenThermalById(idCaja).subscribe();
  }

  private generarHorasVacias(): { hora: string; total: number }[] {
    const horas = [];
    for (let h = 8; h <= 20; h++) {
      horas.push({ hora: `${h.toString().padStart(2, '0')}:00`, total: 0 });
    }
    return horas;
  }

  private renderChart(ventasPorHora: { hora: string; total: number }[]): void {
    const canvas = document.getElementById('ventasHoraChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chartInstance?.destroy();

    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      const labels = ventasPorHora.map(v => v.hora);
      const data   = ventasPorHora.map(v => v.total);
      const maxVal = Math.max(...data);

      const barColors    = data.map(v => v === maxVal && v > 0 ? '#4f9cf9' : 'rgba(255,255,255,0.08)');
      const borderColors = data.map(v => v === maxVal && v > 0 ? '#4f9cf9' : 'rgba(255,255,255,0.15)');

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
      console.warn('Chart.js no está disponible.');
    });
  }
}