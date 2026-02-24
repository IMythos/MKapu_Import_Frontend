import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CajaService }          from '../../services/caja.service';
import { RoleService }          from '../../../core/services/role.service';
import { CashboxSocketService } from '../../services/cashbox-socket.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { CardModule }           from 'primeng/card';
import { ButtonModule }         from 'primeng/button';
import { InputNumberModule }    from 'primeng/inputnumber';
import { TagModule }            from 'primeng/tag';
import { DividerModule }        from 'primeng/divider';
import { SkeletonModule }       from 'primeng/skeleton';
import { ConfirmDialogModule }  from 'primeng/confirmdialog';
import { ConfirmationService }  from 'primeng/api';
import { FormsModule }          from '@angular/forms';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.css'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    CardModule, ButtonModule, InputNumberModule,
    TagModule, DividerModule, SkeletonModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
})
export class CajaPage implements OnInit, OnDestroy {
  private roleService      = inject(RoleService);
  private cashboxService   = inject(CajaService);
  private confirmService   = inject(ConfirmationService);
  protected cashboxSocket  = inject(CashboxSocketService);

  readonly caja         = this.cashboxSocket.caja;
  readonly loading      = signal<boolean>(false);
  readonly montoInicial = signal<number | null>(null);
  readonly resumen      = signal<any>(null); // ventas del día

  readonly canOpen = computed(() =>
    this.montoInicial() != null && (this.montoInicial() ?? 0) > 0
  );

  // Tiempo que lleva abierta la caja
  readonly tiempoAbierta = computed(() => {
    const c = this.caja();
    if (!c?.fec_apertura) return null;
    const diff = Date.now() - new Date(c.fec_apertura).getTime();
    const h    = Math.floor(diff / 3_600_000);
    const m    = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m`;
  });

  readonly idSede: number | undefined;
  private cajaListener = () => {
    this.loading.set(false);
    if (this.idSede) this.cargarResumen();
  };

  constructor() {
    this.idSede = this.roleService.getCurrentUser()?.idSede;
  }

  ngOnInit(): void {
    if (!this.idSede) return;
    this.loading.set(true);
    this.cashboxSocket.checkActiveSession(this.idSede)
      .finally(() => {
        this.loading.set(false);
        this.cargarResumen();
      });
    this.cashboxSocket.onCashboxEvent(this.cajaListener);
  }

  ngOnDestroy(): void {
    this.cashboxSocket.offCashboxEvent(this.cajaListener);
  }

  cargarResumen(): void {
    if (!this.idSede) return;
    // Ajusta este endpoint según tu backend
    this.cashboxService.getResumenDia(this.idSede).subscribe({
      next:  (data) => this.resumen.set(data),
      error: ()     => this.resumen.set(null),
    });
  }

  abrirCaja(): void {
    if (!this.idSede || !this.canOpen()) return;
    this.loading.set(true);
    this.cashboxService.openCashbox(this.idSede, this.montoInicial()!).subscribe({
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
      accept:  () => this.cerrarCaja(),
    });
  }

  private cerrarCaja(): void {
    if (!this.caja()) return;
    this.loading.set(true);
    this.cashboxService.closeCashbox(this.caja().id_caja).subscribe({
      error: (err) => {
        alert(err.error?.message || 'No se pudo cerrar la caja');
        this.loading.set(false);
      },
    });
  }
}