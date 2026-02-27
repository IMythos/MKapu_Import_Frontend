import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import {
  TransferListResponseDto,
  TransferStatus,
} from '../../../../interfaces/transferencia.interface';
import { TransferStore } from '../../../../services/transfer.store';

interface NotificacionTransferenciaItem {
  id: string;
  transferId: number;
  titulo: string;
  detalle: string;
  tiempo: string;
  tipo: 'nueva' | 'estado';
}

@Component({
  selector: 'app-notificacion-transferencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './notificacion-transferencia.html',
  styleUrl: './notificacion-transferencia.css',
})
export class NotificacionTransferencia {
  private readonly transferStore = inject(TransferStore);

  private readonly userSedeIdSig = signal<string | null>(null);

  readonly notificacionesSig = computed<NotificacionTransferenciaItem[]>(() => {
    const sedeId = this.userSedeIdSig();
    if (!sedeId) {
      return [];
    }

    return this.transferStore
      .transfers()
      .filter((transferencia) => String(transferencia.destinationHeadquartersId ?? '') === sedeId)
      .map((transferencia) => this.mapNotificacion(transferencia));
  });

  ngOnInit(): void {
    const user = this.getCurrentUserFromStorage();
    const sedeId = user?.idSede !== undefined ? String(user.idSede) : null;

    this.userSedeIdSig.set(sedeId);

    if (!sedeId) {
      return;
    }

    this.transferStore.loadByHq(sedeId);
  }

  get notificaciones(): NotificacionTransferenciaItem[] {
    return this.notificacionesSig();
  }

  private mapNotificacion(transferencia: TransferListResponseDto): NotificacionTransferenciaItem {
    const origen = transferencia.origin?.nomSede || transferencia.originHeadquartersId || '-';
    const destino =
      transferencia.destination?.nomSede || transferencia.destinationHeadquartersId || '-';
    const status = this.normalizeStatus(transferencia.status);

    return {
      id: `#${transferencia.id}`,
      transferId: transferencia.id,
      titulo: status === 'SOLICITADA' ? 'Nueva Transferencia' : 'Estado actualizado',
      detalle: `Ruta: ${origen} -> ${destino} (${status})`,
      tiempo: this.formatTiempo(transferencia.requestDate),
      tipo: status === 'SOLICITADA' ? 'nueva' : 'estado',
    };
  }

  private normalizeStatus(value: string | TransferStatus | undefined): TransferStatus {
    const raw = String(value ?? 'SOLICITADA').toUpperCase();

    if (raw.includes('APROB')) return 'APROBADA';
    if (raw.includes('RECH')) return 'RECHAZADA';
    if (raw.includes('COMPLET')) return 'COMPLETADA';
    return 'SOLICITADA';
  }

  private formatTiempo(iso: string | null | undefined): string {
    if (!iso) return '-';

    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '-';

    const diffMs = Date.now() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} minutos`;

    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} horas`;

    const diffD = Math.floor(diffH / 24);
    return `Hace ${diffD} dias`;
  }

  private getCurrentUserFromStorage(): { idSede?: number | string } | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as { idSede?: number | string }) : null;
    } catch {
      return null;
    }
  }
}
