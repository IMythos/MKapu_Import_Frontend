import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ApproveTransferDto,
  ConfirmReceiptTransferDto,
  RejectTransferDto,
  TransferByIdResponseDto,
  TransferStatus,
  TransferenciaItemResponse,
  TransferenciaProductoCategoriaResponse,
  TransferenciaProductoResponse,
  TransferenciaUserResponse,
} from '../../../../interfaces/transferencia.interface';
import { TransferStore } from '../../../../services/transfer.store';
import { TransferUserContextService } from '../../../../services/transfer-user-context.service';

interface TransferenciaDetalle {
  codigo: string;
  producto: string;
  productoCodigo: string;
  productoDescripcion: string;
  productoCategoria: string;
  origen: string;
  destino: string;
  almacenOrigen: string;
  almacenDestino: string;
  cantidad: number;
  responsable: string;
  estado: TransferStatus;
  fechaEnvio: string;
  fechaLlegada: string;
  observacion?: string;
}

interface TransferenciaDetalleItem {
  producto: string;
  codigo: string;
  categoria: string;
  cantidad: number;
  series: string;
  seriesList: string[];
}

@Component({
  selector: 'app-detalle-transferencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './detalle-transferencia.html',
  styleUrl: './detalle-transferencia.css',
  providers: [MessageService, ConfirmationService],
})
export class DetalleTransferencia {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transferStore = inject(TransferStore);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transferUserContext = inject(TransferUserContextService);

  private readonly codigoSig = signal('');
  private readonly submittingDecisionSig = signal(false);
  private readonly lastErrorShownSig = signal<string | null>(null);
  private readonly expandedSeriesItemKeysSig = signal<Set<string>>(new Set());

  private readonly transferenciaActualSig = computed<TransferByIdResponseDto | null>(
    () => this.transferStore.selected(),
  );

  private readonly transferenciaSig = computed<TransferenciaDetalle | null>(() => {
    const transfer = this.transferenciaActualSig();
    if (!transfer) return null;
    return this.mapTransferencia(transfer);
  });

  private readonly detalleItemsSig = computed<TransferenciaDetalleItem[]>(() => {
    const transfer = this.transferenciaActualSig();
    return this.mapDetalleItems(transfer?.items ?? []);
  });

  private readonly canResolverSolicitudSig = computed(() => {
    const transferencia = this.transferenciaSig();
    if (!transferencia) return false;
    return (
      transferencia.estado === 'SOLICITADA' &&
      this.isAdminUser() &&
      this.isUserFromTransferOrigin() &&
      !this.isUserFromTransferDestination()
    );
  });

  private readonly canCompletarSolicitudSig = computed(() => {
    const transferencia = this.transferenciaSig();
    const currentUserId = this.transferUserContext.getCurrentUserId();
    if (!transferencia) return false;
    return (
      transferencia.estado === 'APROBADA' &&
      this.isAdminUser() &&
      this.isUserFromTransferDestination() &&
      currentUserId !== this.getApproverUserId()
    );
  });

  constructor() {
    effect(() => {
      const error = this.transferStore.error();
      if (!error || this.lastErrorShownSig() === error) {
        return;
      }

      this.lastErrorShownSig.set(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    });
  }

  ngOnInit(): void {
    const rawCodigo =
      this.route.snapshot.queryParamMap.get('codigo') ??
      this.route.snapshot.queryParamMap.get('id') ??
      this.route.snapshot.paramMap.get('id') ??
      '';

    const codigo = this.normalizarCodigo(rawCodigo);
    this.codigoSig.set(codigo);

    if (!codigo) {
      return;
    }

    this.transferStore.loadById(codigo);
  }

  get transferencia(): TransferenciaDetalle | null {
    return this.transferenciaSig();
  }

  get detalleItems(): TransferenciaDetalleItem[] {
    return this.detalleItemsSig();
  }

  get loading(): boolean {
    return this.transferStore.loading();
  }

  get submittingDecision(): boolean {
    return this.submittingDecisionSig();
  }

  get errorMensaje(): string {
    return this.transferStore.error() ?? '';
  }

  get canResolverSolicitud(): boolean {
    return this.canResolverSolicitudSig();
  }

  get canCompletarSolicitud(): boolean {
    return this.canCompletarSolicitudSig();
  }

  volver(): void {
    this.router.navigate(['/admin/transferencia']);
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'info' | 'secondary' | 'danger' {
    switch (estado.toLowerCase()) {
      case 'completada':
        return 'success';
      case 'solicitada':
        return 'warn';
      case 'aprobada':
        return 'info';
      case 'rechazada':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  aprobarSolicitud(): void {
    const userId = this.transferUserContext.getCurrentUserId();
    const transferId = this.transferenciaActualSig()?.id;

    if (
      !this.isAdminUser() ||
      !this.isUserFromTransferOrigin() ||
      this.isUserFromTransferDestination()
    ) {
      this.showWarn(
        'Acción no permitida',
        'Solo un administrador de la sede origen (y no de destino) puede aprobar esta solicitud.',
      );
      return;
    }

    if (!transferId || !userId) {
      this.showWarn('Acción no permitida', 'No se pudo identificar usuario o transferencia');
      return;
    }

    const dto: ApproveTransferDto = { userId };
    this.submittingDecisionSig.set(true);
    this.transferStore
      .approve(transferId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.submittingDecisionSig.set(false);

        if (!response) return;

        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud actualizada',
          detail: 'La solicitud fue aprobada correctamente',
        });
      });
  }

  rechazarSolicitud(): void {
    const userId = this.transferUserContext.getCurrentUserId();
    const transferId = this.transferenciaActualSig()?.id;

    if (
      !this.isAdminUser() ||
      !this.isUserFromTransferOrigin() ||
      this.isUserFromTransferDestination()
    ) {
      this.showWarn(
        'Acción no permitida',
        'Solo un administrador de la sede origen (y no de destino) puede rechazar esta solicitud.',
      );
      return;
    }

    if (!transferId || !userId) {
      this.showWarn('Acción no permitida', 'No se pudo identificar usuario o transferencia');
      return;
    }

    this.confirmationService.confirm({
      header: 'Rechazar transferencia',
      message: '¿Estás seguro de rechazar esta transferencia?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, rechazar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const dto: RejectTransferDto = { userId, reason: 'Rechazada por administrador' };
        this.submittingDecisionSig.set(true);
        this.transferStore
          .reject(transferId, dto)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((response) => {
            this.submittingDecisionSig.set(false);

            if (!response) return;

            this.messageService.add({
              severity: 'success',
              summary: 'Solicitud actualizada',
              detail: 'La solicitud fue rechazada correctamente',
            });
          });
      },
    });
  }

  completarSolicitud(): void {
    const userId = this.transferUserContext.getCurrentUserId();
    const transferId = this.transferenciaActualSig()?.id;

    if (
      !this.isAdminUser() ||
      !this.isUserFromTransferDestination() ||
      userId === this.getApproverUserId()
    ) {
      this.showWarn(
        'Acción no permitida',
        'Solo un administrador de la sede destino, distinto al que aprobó, puede completar esta transferencia.',
      );
      return;
    }

    if (!transferId || !userId) {
      this.showWarn('Acción no permitida', 'No se pudo identificar usuario o transferencia');
      return;
    }

    const dto: ConfirmReceiptTransferDto = { userId };
    this.submittingDecisionSig.set(true);
    this.transferStore
      .confirmReceipt(transferId, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.submittingDecisionSig.set(false);

        if (!response) return;

        this.messageService.add({
          severity: 'success',
          summary: 'Solicitud actualizada',
          detail: 'La transferencia fue completada correctamente',
        });
      });
  }

  getTotalSeriesRegistradas(): number {
    return this.detalleItems.reduce((acumulado, item) => acumulado + item.seriesList.length, 0);
  }

  getVisibleSeries(item: TransferenciaDetalleItem, idx: number): string[] {
    const key = this.buildSeriesKey(item, idx);
    const expanded = this.expandedSeriesItemKeysSig().has(key);
    if (expanded || item.seriesList.length <= 6) {
      return item.seriesList;
    }

    return item.seriesList.slice(0, 6);
  }

  hasMoreSeries(item: TransferenciaDetalleItem): boolean {
    return item.seriesList.length > 6;
  }

  isSeriesExpanded(item: TransferenciaDetalleItem, idx: number): boolean {
    return this.expandedSeriesItemKeysSig().has(this.buildSeriesKey(item, idx));
  }

  toggleSeriesVisibility(item: TransferenciaDetalleItem, idx: number): void {
    const key = this.buildSeriesKey(item, idx);
    this.expandedSeriesItemKeysSig.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  private mapTransferencia(transferencia: TransferByIdResponseDto): TransferenciaDetalle {
    const primerItem = transferencia.items?.[0];
    const primerProducto = this.getProductoFromItem(primerItem);

    return {
      codigo: String(transferencia.id),
      producto:
        primerProducto?.nomProducto ||
        primerProducto?.descripcion ||
        primerProducto?.codigo ||
        '-',
      productoCodigo: primerProducto?.codigo || '-',
      productoDescripcion: primerProducto?.descripcion || '-',
      productoCategoria: this.getCategoriaNombre(primerProducto?.categoria),
      origen: transferencia.origin?.nomSede || String(transferencia.originHeadquartersId ?? '-'),
      destino:
        transferencia.destination?.nomSede ||
        String(transferencia.destinationHeadquartersId ?? '-'),
      almacenOrigen:
        transferencia.originWarehouse?.nomAlm ||
        String(transferencia.originWarehouseId ?? '-'),
      almacenDestino:
        transferencia.destinationWarehouse?.nomAlm ||
        String(transferencia.destinationWarehouseId ?? '-'),
      cantidad:
        transferencia.totalQuantity ??
        (transferencia.items ?? []).reduce((acc, item) => acc + (item.quantity ?? 0), 0),
      responsable: this.getResponsableNombre(transferencia.creatorUser),
      estado: this.normalizeStatus(transferencia.status),
      fechaEnvio: this.formatearFecha(transferencia.requestDate),
      fechaLlegada: '-',
      observacion: transferencia.observation?.trim() || '-',
    };
  }

  private mapDetalleItems(items: TransferenciaItemResponse[]): TransferenciaDetalleItem[] {
    if (!items.length) return [];

    return items.map((item) => {
      const producto = this.getProductoFromItem(item);
      const seriesList = item.series ?? [];

      return {
        producto: producto?.nomProducto || producto?.descripcion || '-',
        codigo: producto?.codigo || '-',
        categoria: this.getCategoriaNombre(producto?.categoria),
        cantidad: item.quantity ?? seriesList.length,
        series: seriesList.length ? seriesList.join(', ') : '-',
        seriesList,
      };
    });
  }

  private getProductoFromItem(
    item: TransferenciaItemResponse | undefined,
  ): TransferenciaProductoResponse | undefined {
    if (!item?.producto) return undefined;
    return Array.isArray(item.producto) ? item.producto[0] : item.producto;
  }

  private getCategoriaNombre(
    categoria:
      | TransferenciaProductoCategoriaResponse
      | TransferenciaProductoCategoriaResponse[]
      | undefined,
  ): string {
    if (!categoria) return '-';
    if (Array.isArray(categoria)) return categoria[0]?.nombre || '-';
    return categoria.nombre || '-';
  }

  private getResponsableNombre(
    creator: TransferenciaUserResponse | TransferenciaUserResponse[] | undefined,
  ): string {
    if (!creator) return '-';

    const user = Array.isArray(creator) ? creator[0] : creator;
    const nombre = user.usuNom || user.nombres || '';
    const apellidos = user.apellidos || [user.apePat, user.apeMat].filter(Boolean).join(' ');

    const fullName = [nombre, apellidos].filter(Boolean).join(' ').trim();
    return fullName || `Usuario #${user.idUsuario ?? user.userId ?? user.id ?? '-'}`;
  }

  private normalizeStatus(value: string | TransferStatus | undefined): TransferStatus {
    const raw = String(value ?? 'SOLICITADA').toUpperCase();
    if (raw.includes('APROB')) return 'APROBADA';
    if (raw.includes('RECH')) return 'RECHAZADA';
    if (raw.includes('COMPLET')) return 'COMPLETADA';
    return 'SOLICITADA';
  }

  private formatearFecha(iso: string | null | undefined): string {
    if (!iso) return '-';

    const fecha = new Date(iso);
    if (Number.isNaN(fecha.getTime())) return '-';

    return fecha.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private normalizarCodigo(raw: string | null | undefined): string {
    if (!raw) return '';
    return String(raw).replace('#', '').trim();
  }

  private isAdminUser(): boolean {
    return this.transferUserContext.isAdmin();
  }

  private showWarn(summary: string, detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
    });
  }

  private buildSeriesKey(item: TransferenciaDetalleItem, idx: number): string {
    return `${item.codigo}-${idx}`;
  }

  private isUserFromTransferOrigin(): boolean {
    const userHqId = this.transferUserContext.getCurrentHeadquarterId();
    const transfer = this.transferenciaActualSig();
    const transferOriginHqId =
      transfer?.originHeadquartersId ?? transfer?.origin?.id_sede ?? transfer?.origin?.id;

    if (!userHqId || transferOriginHqId === undefined || transferOriginHqId === null) {
      return false;
    }

    return String(userHqId).trim() === String(transferOriginHqId).trim();
  }

  private isUserFromTransferDestination(): boolean {
    const userHqId = this.transferUserContext.getCurrentHeadquarterId();
    const transfer = this.transferenciaActualSig();
    const transferDestinationHqId =
      transfer?.destinationHeadquartersId ??
      transfer?.destination?.id_sede ??
      transfer?.destination?.id;

    if (!userHqId || transferDestinationHqId === undefined || transferDestinationHqId === null) {
      return false;
    }

    return String(userHqId).trim() === String(transferDestinationHqId).trim();
  }

  private getApproverUserId(): number {
    const transfer = this.transferenciaActualSig();
    if (!transfer) {
      return -1;
    }

    if (typeof transfer.approveUserId === 'number' && transfer.approveUserId > 0) {
      return transfer.approveUserId;
    }

    const approveUser = transfer.approveUser;
    const user = Array.isArray(approveUser) ? approveUser[0] : approveUser;
    if (!user) {
      return -1;
    }

    const candidates = [user.idUsuario, user.userId, user.id];
    for (const candidate of candidates) {
      const id = Number(candidate);
      if (Number.isFinite(id) && id > 0) {
        return id;
      }
    }

    return -1;
  }
}
