import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TransferStore } from '../../../../services/transfer.store';
import {
  ApproveTransferDto,
  ConfirmReceiptTransferDto,
  TransferHeadquarterDto,
  TransferListResponseDto,
  TransferSocketEventDto,
  TransferStatus,
  TransferenciaUserResponse,
} from '../../../../interfaces/transferencia.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransferUserContextService } from '../../../../services/transfer-user-context.service';
import { SedeService } from '../../../../services/sede.service';
import { TransferSocketService } from '../../../../services/transfer-socket.service';
import { AuthService } from '../../../../../auth/services/auth.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../../shared/components/paginador/paginador.components';

interface TransferenciaRow {
  id: number;
  codigo: string;
  originHeadquartersId: string;
  destinationHeadquartersId: string;
  approveUserId: number | null;
  producto: string;
  origen: string;
  destino: string;
  cantidad: number;
  solicitud: string;
  responsable: string;
  estado: TransferStatus;
  fechaEnvio: string;
  fechaLlegada: string;
}

interface ActiveHeadquarterContext {
  id: string | null;
  code: string;
  name: string;
}

@Component({
  selector: 'app-transferencia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    AutoCompleteModule,
    SelectModule,
    TableModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    LoadingOverlayComponent,
    PaginadorComponent,
  ],
  templateUrl: './transferencia.html',
  styleUrl: './transferencia.css',
  providers: [MessageService, ConfirmationService],
})
export class Transferencia {
  private readonly transferStore       = inject(TransferStore);
  private readonly messageService      = inject(MessageService);
  private readonly destroyRef          = inject(DestroyRef);
  private readonly transferUserContext = inject(TransferUserContextService);
  private readonly sedeService = inject(SedeService);
  private readonly transferSocket = inject(TransferSocketService);
  private readonly authService = inject(AuthService, { optional: true });

  private readonly headquarterCatalogSig = computed(() => {
    const nameById = new Map<string, string>();
    const nameByCode = new Map<string, string>();
    const codeById = new Map<string, string>();

    for (const sede of this.sedeService.sedes()) {
      const normalizedId = this.normalizeId(sede.id_sede);
      const normalizedCode = String(sede.codigo ?? '').trim().toUpperCase();
      const normalizedName = String(sede.nombre ?? '').trim();

      if (normalizedId && normalizedName) {
        nameById.set(normalizedId, normalizedName);
      }

      if (normalizedCode) {
        if (normalizedName) {
          nameByCode.set(normalizedCode, normalizedName);
        }
        if (normalizedId) {
          codeById.set(normalizedId, normalizedCode);
        }
      }
    }

    return { nameById, nameByCode, codeById };
  });

  private readonly activeHeadquarterContextSig = computed<ActiveHeadquarterContext>(() => {
    const catalog = this.headquarterCatalogSig();
    const currentUser = this.authService?.getCurrentUser();
    const rawId = this.normalizeId(this.transferUserContext.getCurrentHeadquarterId());
    const rawName = String(currentUser?.sedeNombre ?? '').trim();
    const normalizedRawName = rawName.toLowerCase();

    for (const sede of this.sedeService.sedes()) {
      const sedeName = String(sede.nombre ?? '').trim();
      if (rawName && sedeName && sedeName.toLowerCase() === normalizedRawName) {
        return {
          id: this.normalizeId(sede.id_sede),
          code: String(sede.codigo ?? '').trim().toUpperCase(),
          name: sedeName,
        };
      }
    }

    return {
      id: rawId,
      code: rawId ? catalog.codeById.get(rawId) ?? '' : '',
      name: rawId ? catalog.nameById.get(rawId) ?? rawName : rawName,
    };
  });

  private readonly searchTermSig      = signal('');
  private readonly estadoFilterSig    = signal<TransferStatus | null>(null);
  private readonly solicitudFilterSig = signal<string | null>(null);
  private readonly lastErrorShown = signal<string | null>(null);
  private readonly lastSocketErrorShown = signal<string | null>(null);
  private readonly lastRealtimeEventKey = signal<string | null>(null);
  private readonly paginationSig = this.transferStore.pagination;

  readonly transferenciasSig = computed(() =>
    this.transferStore
      .transfers()
      .filter((transfer) => this.belongsToCurrentHeadquarter(transfer))
      .map((transfer) => this.mapTransferencia(transfer)),
  );

  readonly filteredTransferenciasSig = computed(() => {
    const search    = this.searchTermSig().toLowerCase();
    const estado    = this.estadoFilterSig();
    const solicitud = this.solicitudFilterSig();

    return this.transferenciasSig().filter((t) => {
      const textMatch = [t.codigo, t.producto, t.origen, t.destino, t.responsable, t.solicitud]
        .some((v) => v.toLowerCase().includes(search));
      const estadoMatch    = estado    ? t.estado === estado : true;
      const solicitudMatch = solicitud ? t.solicitud.toLowerCase().startsWith(solicitud.toLowerCase()) : true;
      return textMatch && estadoMatch && solicitudMatch;
    });
  });

  readonly solicitadasSig  = computed(() => this.transferenciasSig().filter((i) => i.estado === 'SOLICITADA').length);
  readonly aprobadasSig    = computed(() => this.transferenciasSig().filter((i) => i.estado === 'APROBADA').length);
  readonly completadasSig  = computed(() => this.transferenciasSig().filter((i) => i.estado === 'COMPLETADA').length);
  readonly rechazadasSig   = computed(() => this.transferenciasSig().filter((i) => i.estado === 'RECHAZADA').length);
  readonly displayCountSig = computed(() =>
    this.hasActiveFilters ? this.filteredTransferenciasSig().length : this.paginationSig().totalRecords,
  );

  readonly totalPagesComputed = computed(() =>
    Math.ceil(this.paginationSig().totalRecords / this.paginationSig().pageSize),
  );

  readonly estadoOptions = [
    { label: 'Todos',      value: null                   },
    { label: 'SOLICITADA', value: 'SOLICITADA' as const  },
    { label: 'APROBADA',   value: 'APROBADA'   as const  },
    { label: 'RECHAZADA',  value: 'RECHAZADA'  as const  },
    { label: 'COMPLETADA', value: 'COMPLETADA' as const  },
  ];

  readonly solicitudOptions = [
    { label: 'Todas',           value: null              },
    { label: 'Con observacion', value: 'Con observacion' },
    { label: 'Sin observacion', value: 'Sin observacion' },
  ];

  constructor() {
    effect(() => {
      const error = this.transferStore.error();
      if (!error || this.lastErrorShown() === error) {
        return;
      }

      this.lastErrorShown.set(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error,
      });
    });

    effect(() => {
      const socketError = this.transferSocket.lastError();
      if (!socketError || this.lastSocketErrorShown() === socketError) {
        return;
      }

      this.lastSocketErrorShown.set(socketError);
      this.messageService.add({
        severity: 'warn',
        summary: 'Tiempo real no disponible',
        detail: socketError,
        life: 4500,
      });
    });

    effect(() => {
      const realtimeEvent = this.transferSocket.lastNewRequest();
      if (!realtimeEvent) {
        return;
      }

      untracked(() => {
        this.handleRealtimeEvent('new_transfer_request', realtimeEvent, true);
      });
    });

    effect(() => {
      const realtimeEvent = this.transferSocket.lastStatusUpdate();
      if (!realtimeEvent) {
        return;
      }

      untracked(() => {
        this.handleRealtimeEvent('transfer_status_updated', realtimeEvent, false);
      });
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.transferSocket.disconnect('transfer-page');
    });

    const initialPagination = this.paginationSig();

    this.sedeService
      .loadSedes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.connectRealtimeForCurrentHeadquarter();
          this.loadTransfersPage(initialPagination.page, initialPagination.pageSize);
        },
        error: () => {
          // Si falla este catalogo, la tabla sigue operando con el fallback actual.
          this.connectRealtimeForCurrentHeadquarter();
          this.loadTransfersPage(initialPagination.page, initialPagination.pageSize);
        },
      });
  }

  // ── Getters / setters ─────────────────────────────────────────────────────
  get transferencias():           TransferenciaRow[]   { return this.transferenciasSig(); }
  get filteredTransferencias():   TransferenciaRow[]   { return this.filteredTransferenciasSig(); }
  get transferenciaSuggestions(): TransferenciaRow[]   { return this.filteredTransferenciasSig(); }
  get loading():        boolean                        { return this.transferStore.loading(); }
  get hasActiveFilters(): boolean                      { return !!(this.searchTermSig() || this.estadoFilterSig() || this.solicitudFilterSig()); }
  get solicitadas():    number                         { return this.solicitadasSig(); }
  get aprobadas():      number                         { return this.aprobadasSig(); }
  get completadas():    number                         { return this.completadasSig(); }
  get rechazadas():     number                         { return this.rechazadasSig(); }
  get totalRecords():   number                         { return this.displayCountSig(); }
  get rowsPerPage():    number                         { return this.paginationSig().pageSize; }
  get currentPage():    number                         { return this.paginationSig().page; }

  get searchTerm(): string                    { return this.searchTermSig(); }
  set searchTerm(v: string)                   { this.searchTermSig.set(v ?? ''); }
  get estadoFilter(): TransferStatus | null   { return this.estadoFilterSig(); }
  set estadoFilter(v: TransferStatus | null)  { this.estadoFilterSig.set(v ?? null); }
  get solicitudFilter(): string | null        { return this.solicitudFilterSig(); }
  set solicitudFilter(v: string | null)       { this.solicitudFilterSig.set(v ?? null); }

  // ── Eventos ───────────────────────────────────────────────────────────────
  trackByTransferId = (_: number, item: TransferenciaRow): number => item.id;

  onSearch(event: { query: string }): void { this.searchTerm = event.query ?? ''; }

  onSearchChange(term: string | { producto?: string } | null): void {
    this.searchTerm = this.obtenerValor(term);
  }

  onSelectTransferencia(event: { value?: string | { producto?: string } } | null): void {
    this.searchTerm = this.obtenerValor(event?.value ?? this.searchTerm);
  }

  onPaginadorPageChange(page: number): void {
    this.loadTransfersPage(page, this.paginationSig().pageSize);
  }

  onPaginadorLimitChange(limit: number): void {
    this.loadTransfersPage(1, limit);
  }

  clearSearch(): void {
    this.searchTerm      = '';
    this.estadoFilter    = null;
    this.solicitudFilter = null;
  }

  filtrar(valor: string): void { this.searchTerm = valor || ''; }

  obtenerValor(term: string | { producto?: string } | null | undefined): string {
    if (!term) return '';
    if (typeof term === 'string') return term;
    return term.producto ?? '';
  }

  getEstadoSeverity(estado: TransferStatus): 'success' | 'warn' | 'info' | 'danger' {
    switch (estado) {
      case 'COMPLETADA': return 'success';
      case 'SOLICITADA': return 'warn';
      case 'APROBADA':   return 'info';
      default:           return 'danger';
    }
  }

  canApprove(transferencia: TransferenciaRow): boolean {
    return (
      transferencia.estado === 'SOLICITADA' &&
      this.transferUserContext.isAdmin() &&
      this.isUserFromTransferOrigin(transferencia.originHeadquartersId) &&
      !this.isUserFromTransferDestination(transferencia.destinationHeadquartersId)
    );
  }

  canConfirm(transferencia: TransferenciaRow): boolean {
    const currentUserId = this.transferUserContext.getCurrentUserId();
    return (
      transferencia.estado === 'APROBADA' &&
      this.transferUserContext.isAdmin() &&
      this.isUserFromTransferDestination(transferencia.destinationHeadquartersId) &&
      currentUserId !== (transferencia.approveUserId ?? -1)
    );
  }

  aprobarTransferencia(row: TransferenciaRow): void {
    if (
      !this.transferUserContext.isAdmin() ||
      !this.isUserFromTransferOrigin(row.originHeadquartersId) ||
      this.isUserFromTransferDestination(row.destinationHeadquartersId)
    ) {
      this.messageService.add({ severity: 'warn', summary: 'Acción no permitida',
        detail: 'Solo un administrador de la sede origen (y no de destino) puede aprobar esta solicitud.' });
      return;
    }

    const dto: ApproveTransferDto = { userId: this.transferUserContext.getCurrentUserId() };
    this.transferStore.approve(row.id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
      if (!response) return;
      this.messageService.add({ severity: 'success', summary: 'Transferencia aprobada',
        detail: `Se aprobó la transferencia #${row.codigo}` });
    });
  }

  confirmarRecepcion(row: TransferenciaRow): void {
    const currentUserId = this.transferUserContext.getCurrentUserId();
    if (
      !this.transferUserContext.isAdmin() ||
      !this.isUserFromTransferDestination(row.destinationHeadquartersId) ||
      currentUserId === (row.approveUserId ?? -1)
    ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Accion no permitida',
        detail:
          'Solo un administrador de la sede destino, distinto al que aprobo, puede completar esta transferencia.',
      });
      return;
    }

    const dto: ConfirmReceiptTransferDto = {
      userId: this.transferUserContext.getCurrentUserId(),
    };

    this.transferStore
      .confirmReceipt(row.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (!response) return;

        this.messageService.add({
          severity: 'success',
          summary: 'Recepcion confirmada',
          detail: `La transferencia #${row.codigo} paso a COMPLETADA`,
        });
      });
  }

  private handleRealtimeEvent(
    eventName: 'new_transfer_request' | 'transfer_status_updated',
    event: TransferSocketEventDto,
    resetToFirstPage: boolean,
  ): void {
    const eventKey = this.buildRealtimeEventKey(eventName, event);
    if (this.lastRealtimeEventKey() === eventKey) {
      return;
    }

    this.lastRealtimeEventKey.set(eventKey);

    const status = this.normalizeStatus(event.transfer.status);
    const isNewRequest = eventName === 'new_transfer_request';

    this.messageService.add({
      severity: isNewRequest ? 'info' : this.getRealtimeSeverity(status),
      summary: isNewRequest
        ? 'Nueva transferencia'
        : `Transferencia ${this.formatRealtimeStatus(status)}`,
      detail: isNewRequest
        ? this.buildNewTransferMessage(event)
        : this.buildStatusTransferMessage(event, status),
      life: 4500,
    });

    this.refreshTransfers(resetToFirstPage);
  }

  private refreshTransfers(resetToFirstPage: boolean): void {
    const pagination = this.paginationSig();
    this.loadTransfersPage(
      resetToFirstPage ? 1 : pagination.page,
      pagination.pageSize,
    );
  }

  private buildRealtimeEventKey(
    eventName: string,
    event: TransferSocketEventDto,
  ): string {
    const transferId = Number(event.transfer.id ?? 0);
    const status = String(event.transfer.status ?? '').trim();
    const reason = String(event.transfer.reason ?? '').trim();
    const emittedAt = String(event.emittedAt ?? '').trim();
    return `${eventName}:${transferId}:${status}:${reason}:${emittedAt}`;
  }

  private buildNewTransferMessage(event: TransferSocketEventDto): string {
    const subject = String(event.transfer.nomProducto ?? '').trim();
    const route = this.buildRealtimeRoute(event.transfer);

    return [
      this.buildTransferLabel(event.transfer.id),
      subject || null,
      route ? `Ruta: ${route}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private buildStatusTransferMessage(
    event: TransferSocketEventDto,
    status: TransferStatus,
  ): string {
    const route = this.buildRealtimeRoute(event.transfer);
    const reason = String(event.transfer.reason ?? '').trim();

    return [
      `${this.buildTransferLabel(event.transfer.id)} ahora esta ${this.formatRealtimeStatus(status).toLowerCase()}`,
      route ? `Ruta: ${route}` : null,
      reason ? `Motivo: ${reason}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private buildRealtimeRoute(transfer: TransferSocketEventDto['transfer']): string {
    const origin = String(transfer.origin?.nomSede ?? '').trim();
    const destination = String(transfer.destination?.nomSede ?? '').trim();

    if (!origin || !destination) {
      return '';
    }

    return `${origin} -> ${destination}`;
  }

  private buildTransferLabel(id: unknown): string {
    const transferId = Number(id);
    return Number.isFinite(transferId) && transferId > 0
      ? `Transferencia #${transferId}`
      : 'Transferencia';
  }

  private formatRealtimeStatus(status: TransferStatus): string {
    switch (status) {
      case 'APROBADA':
        return 'Aprobada';
      case 'RECHAZADA':
        return 'Rechazada';
      case 'COMPLETADA':
        return 'Completada';
      case 'SOLICITADA':
      default:
        return 'Solicitada';
    }
  }

  private getRealtimeSeverity(
    status: TransferStatus,
  ): 'success' | 'info' | 'warn' | 'error' {
    switch (status) {
      case 'COMPLETADA':
        return 'success';
      case 'APROBADA':
        return 'info';
      case 'RECHAZADA':
        return 'error';
      case 'SOLICITADA':
      default:
        return 'warn';
    }
  }

  private mapTransferencia(transferencia: TransferListResponseDto): TransferenciaRow {
    const estado        = this.normalizeStatus(transferencia.status);
    const solicitudTipo = transferencia.observation?.trim() ? 'Con observacion' : 'Sin observacion';
    return {
      id:                        transferencia.id,
      codigo:                    String(transferencia.id),
      originHeadquartersId:      String(transferencia.originHeadquartersId ?? transferencia.origin?.id_sede ?? transferencia.origin?.id ?? ''),
      destinationHeadquartersId: String(transferencia.destinationHeadquartersId ?? transferencia.destination?.id_sede ?? transferencia.destination?.id ?? ''),
      approveUserId:             this.getApproveUserId(transferencia),
      producto:                  this.getProductName(transferencia),
      origen:                    this.resolveHeadquarterDisplayName(
        transferencia.origin,
        transferencia.originHeadquartersId,
      ),
      destino:                   this.resolveHeadquarterDisplayName(
        transferencia.destination,
        transferencia.destinationHeadquartersId,
      ),
      cantidad:                  transferencia.totalQuantity ?? this.getTotalQuantityFromItems(transferencia),
      solicitud:                 `${solicitudTipo}: ${transferencia.observation?.trim() || '-'}`,
      responsable:               this.getFullUserName(
        transferencia.creatorUser,
        transferencia.creatorUserName,
        transferencia.creatorUserLastName,
      ),
      estado,
      fechaEnvio:                this.formatDate(transferencia.requestDate),
      fechaLlegada:              '-',
    };
  }

  private getProductName(transferencia: TransferListResponseDto): string {
    const rootProductName = String(transferencia.nomProducto ?? '').trim();
    if (rootProductName) return rootProductName;
    const firstItem = transferencia.items?.[0];
    const producto  = firstItem?.producto;
    const parsed    = Array.isArray(producto) ? producto[0] : producto;
    if (parsed && typeof parsed === 'object') {
      const r = parsed as Record<string, unknown>;
      const resolvedName = String(r['nomProducto'] ?? r['nombre'] ?? r['anexo'] ?? r['descripcion'] ?? r['codigo'] ?? '').trim();
      if (resolvedName) return resolvedName;
    }
    const productId = this.extractProductId(firstItem, parsed);
    return productId !== null ? `Producto #${productId}` : '-';
  }

  private extractProductId(item: unknown, parsedProducto: unknown): number | null {
    const itemRecord   = (item ?? {}) as Record<string, unknown>;
    const parsedRecord = parsedProducto && typeof parsedProducto === 'object' ? (parsedProducto as Record<string, unknown>) : null;
    for (const candidate of [
      itemRecord['productId'], itemRecord['id_producto'], itemRecord['idProducto'], itemRecord['productoId'],
      parsedRecord?.['id_producto'], parsedRecord?.['idProducto'], parsedRecord?.['productId'], parsedRecord?.['id'],
    ]) {
      const n = Number(candidate);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }

  private getTotalQuantityFromItems(transferencia: TransferListResponseDto): number {
    return (transferencia.items ?? []).reduce((acc, item) => acc + (item.quantity ?? item.series?.length ?? 0), 0);
  }

  private getFullUserName(
    user: TransferenciaUserResponse | TransferenciaUserResponse[] | undefined,
    fallbackName?: string | null,
    fallbackLastName?: string | null,
  ): string {
    if (!user) {
      const fallbackFullName = [
        String(fallbackName ?? '').trim(),
        String(fallbackLastName ?? '').trim(),
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      return fallbackFullName || '-';
    }

    const first = Array.isArray(user) ? user[0] : user;
    const fullName = [
      first.usuNom || first.nombres || '',
      first.apellidos || [first.apePat, first.apeMat].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    const fallbackFullName = [
      String(fallbackName ?? '').trim(),
      String(fallbackLastName ?? '').trim(),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fallbackFullName || `Usuario #${first.idUsuario ?? first.userId ?? first.id ?? '-'}`;
  }

  private normalizeStatus(value: string | TransferStatus | undefined): TransferStatus {
    const raw = String(value ?? 'SOLICITADA').toUpperCase();
    if (raw.includes('APROB'))   return 'APROBADA';
    if (raw.includes('RECH'))    return 'RECHAZADA';
    if (raw.includes('COMPLET')) return 'COMPLETADA';
    return 'SOLICITADA';
  }

  private formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('es-PE');
  }

  private normalizeId(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const parsed = String(value).trim();
    return parsed || null;
  }

  private getApproveUserId(transferencia: TransferListResponseDto): number | null {
    if (typeof transferencia.approveUserId === 'number' && transferencia.approveUserId > 0) return transferencia.approveUserId;
    const approveUser = transferencia.approveUser;
    const user = Array.isArray(approveUser) ? approveUser[0] : approveUser;
    if (!user) return null;
    for (const candidate of [user.idUsuario, user.userId, user.id]) {
      const id = Number(candidate);
      if (Number.isFinite(id) && id > 0) return id;
    }
    return null;
  }

  private loadTransfersPage(page: number, pageSize: number): void {
    const headquartersId = this.activeHeadquarterContextSig().id ?? this.transferUserContext.getCurrentHeadquarterId();
    this.transferStore.loadAll({
      headquartersId: headquartersId ?? undefined,
      page,
      pageSize,
    });
  }

  private connectRealtimeForCurrentHeadquarter(): void {
    const headquartersId = this.activeHeadquarterContextSig().id ?? this.transferUserContext.getCurrentHeadquarterId();
    if (headquartersId) {
      this.transferSocket.connect(headquartersId, 'transfer-page');
      return;
    }

    this.transferSocket.disconnect('transfer-page');
  }

  private belongsToCurrentHeadquarter(transfer: TransferListResponseDto): boolean {
    const context = this.activeHeadquarterContextSig();
    const normalizedOriginId = this.normalizeId(
      transfer.originHeadquartersId ?? transfer.origin?.id_sede ?? transfer.origin?.id,
    );
    const normalizedDestinationId = this.normalizeId(
      transfer.destinationHeadquartersId ?? transfer.destination?.id_sede ?? transfer.destination?.id,
    );
    const normalizedOriginCode = String(transfer.origin?.codigo ?? '').trim().toUpperCase();
    const normalizedDestinationCode = String(transfer.destination?.codigo ?? '').trim().toUpperCase();

    if (
      context.code &&
      (normalizedOriginCode === context.code || normalizedDestinationCode === context.code)
    ) {
      return true;
    }

    if (
      context.id &&
      (normalizedOriginId === context.id || normalizedDestinationId === context.id)
    ) {
      return true;
    }

    return false;
  }

  private resolveHeadquarterDisplayName(
    headquarter: TransferHeadquarterDto | null | undefined,
    headquarterId: string | number | null | undefined,
  ): string {
    const catalog = this.headquarterCatalogSig();
    const normalizedId = this.normalizeId(headquarterId);
    const normalizedCode = String(headquarter?.codigo ?? '').trim().toUpperCase();
    const currentUser = this.authService?.getCurrentUser();
    const currentUserHeadquarterId = this.normalizeId(currentUser?.idSede);
    const currentUserHeadquarterName = String(currentUser?.sedeNombre ?? '').trim();
    const currentUserHeadquarterCode = currentUserHeadquarterId
      ? catalog.codeById.get(currentUserHeadquarterId) ?? ''
      : '';

    if (
      currentUserHeadquarterName &&
      normalizedCode &&
      currentUserHeadquarterCode &&
      normalizedCode === currentUserHeadquarterCode
    ) {
      return currentUserHeadquarterName;
    }

    if (normalizedCode) {
      const mappedByCode = catalog.nameByCode.get(normalizedCode);
      if (mappedByCode) {
        return mappedByCode;
      }
    }

    if (
      currentUserHeadquarterName &&
      normalizedId &&
      currentUserHeadquarterId &&
      normalizedId === currentUserHeadquarterId
    ) {
      return currentUserHeadquarterName;
    }

    if (normalizedId) {
      const mappedById = catalog.nameById.get(normalizedId);
      if (mappedById) {
        return mappedById;
      }
    }

    return (
      String(
        headquarter?.nomSede ??
          headquarter?.nombre ??
          normalizedId ??
          '-',
      ).trim() || '-'
    );
  }

  private isUserFromTransferOrigin(originHeadquartersId: string | number | null | undefined): boolean {
    const userHq = this.activeHeadquarterContextSig().id ?? this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || originHeadquartersId === null || originHeadquartersId === undefined) return false;
    return String(originHeadquartersId).trim() === String(userHq).trim();
  }

  private isUserFromTransferDestination(destinationHeadquartersId: string | number | null | undefined): boolean {
    const userHq = this.activeHeadquarterContextSig().id ?? this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || destinationHeadquartersId === null || destinationHeadquartersId === undefined) return false;
    return String(destinationHeadquartersId).trim() === String(userHq).trim();
  }
}