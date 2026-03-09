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
  TransferListResponseDto,
  TransferStatus,
  TransferenciaUserResponse,
} from '../../../../interfaces/transferencia.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransferUserContextService } from '../../../../services/transfer-user-context.service';
import { LoadingOverlayComponent } from '../../../../../shared/components/loading-overlay/loading-overlay.component';
import { PaginadorComponent } from '../../../../../shared/components/paginador/Paginador.component';

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

  private readonly searchTermSig      = signal('');
  private readonly estadoFilterSig    = signal<TransferStatus | null>(null);
  private readonly solicitudFilterSig = signal<string | null>(null);
  private readonly lastErrorShown     = signal<string | null>(null);
  private readonly paginationSig      = this.transferStore.pagination;

  readonly transferenciasSig = computed(() =>
    this.transferStore.transfers().map((t) => this.mapTransferencia(t)),
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
      if (!error || this.lastErrorShown() === error) return;
      this.lastErrorShown.set(error);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error });
    });
  }

  ngOnInit(): void {
    this.transferStore.loadAll({
      page:     this.paginationSig().page,
      pageSize: this.paginationSig().pageSize,
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
    this.transferStore.loadAll({ page, pageSize: this.paginationSig().pageSize });
  }

  onPaginadorLimitChange(limit: number): void {
    this.transferStore.loadAll({ page: 1, pageSize: limit });
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
      this.messageService.add({ severity: 'warn', summary: 'Acción no permitida',
        detail: 'Solo un administrador de la sede destino, distinto al que aprobó, puede completar esta transferencia.' });
      return;
    }

    const dto: ConfirmReceiptTransferDto = { userId: this.transferUserContext.getCurrentUserId() };
    this.transferStore.confirmReceipt(row.id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((response) => {
      if (!response) return;
      this.messageService.add({ severity: 'success', summary: 'Recepción confirmada',
        detail: `La transferencia #${row.codigo} pasó a COMPLETADA` });
    });
  }

  // ── Mapeo ─────────────────────────────────────────────────────────────────
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
      origen:                    transferencia.origin?.nomSede || this.normalizeId(transferencia.originHeadquartersId) || '-',
      destino:                   transferencia.destination?.nomSede || this.normalizeId(transferencia.destinationHeadquartersId) || '-',
      cantidad:                  transferencia.totalQuantity ?? this.getTotalQuantityFromItems(transferencia),
      solicitud:                 `${solicitudTipo}: ${transferencia.observation?.trim() || '-'}`,
      responsable:               this.getFullUserName(transferencia.creatorUser),
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

  private getFullUserName(user: TransferenciaUserResponse | TransferenciaUserResponse[] | undefined): string {
    if (!user) return '-';
    const first    = Array.isArray(user) ? user[0] : user;
    const fullName = [first.usuNom || first.nombres || '', first.apellidos || [first.apePat, first.apeMat].filter(Boolean).join(' ')]
      .filter(Boolean).join(' ').trim();
    return fullName || `Usuario #${first.idUsuario ?? first.userId ?? first.id ?? '-'}`;
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

  private isUserFromTransferOrigin(originHeadquartersId: string | number | null | undefined): boolean {
    const userHq = this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || originHeadquartersId === null || originHeadquartersId === undefined) return false;
    return String(originHeadquartersId).trim() === String(userHq).trim();
  }

  private isUserFromTransferDestination(destinationHeadquartersId: string | number | null | undefined): boolean {
    const userHq = this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || destinationHeadquartersId === null || destinationHeadquartersId === undefined) return false;
    return String(destinationHeadquartersId).trim() === String(userHq).trim();
  }
}