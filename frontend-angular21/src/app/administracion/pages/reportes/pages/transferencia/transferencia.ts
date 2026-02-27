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
import { TableLazyLoadEvent } from 'primeng/table';
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
  ],
  templateUrl: './transferencia.html',
  styleUrl: './transferencia.css',
  providers: [MessageService, ConfirmationService],
})
export class Transferencia {
  private readonly transferStore = inject(TransferStore);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transferUserContext = inject(TransferUserContextService);

  private readonly searchTermSig = signal('');
  private readonly estadoFilterSig = signal<TransferStatus | null>(null);
  private readonly solicitudFilterSig = signal<string | null>(null);
  private readonly lastErrorShown = signal<string | null>(null);
  private readonly paginationSig = this.transferStore.pagination;

  readonly transferenciasSig = computed(() =>
    this.transferStore.transfers().map((transferencia) => this.mapTransferencia(transferencia)),
  );

  readonly filteredTransferenciasSig = computed(() => {
    const search = this.searchTermSig().toLowerCase();
    const estado = this.estadoFilterSig();
    const solicitud = this.solicitudFilterSig();

    return this.transferenciasSig().filter((transferencia) => {
      const textMatch = [
        transferencia.codigo,
        transferencia.producto,
        transferencia.origen,
        transferencia.destino,
        transferencia.responsable,
        transferencia.solicitud,
      ].some((value) => value.toLowerCase().includes(search));

      const estadoMatch = estado ? transferencia.estado === estado : true;
      const solicitudMatch = solicitud
        ? transferencia.solicitud.toLowerCase().startsWith(solicitud.toLowerCase())
        : true;

      return textMatch && estadoMatch && solicitudMatch;
    });
  });

  readonly solicitadasSig = computed(
    () => this.transferenciasSig().filter((item) => item.estado === 'SOLICITADA').length,
  );
  readonly aprobadasSig = computed(
    () => this.transferenciasSig().filter((item) => item.estado === 'APROBADA').length,
  );
  readonly completadasSig = computed(
    () => this.transferenciasSig().filter((item) => item.estado === 'COMPLETADA').length,
  );
  readonly rechazadasSig = computed(
    () => this.transferenciasSig().filter((item) => item.estado === 'RECHAZADA').length,
  );
  readonly displayCountSig = computed(() =>
    this.hasActiveFilters ? this.filteredTransferenciasSig().length : this.paginationSig().totalRecords,
  );

  readonly estadoOptions = [
    { label: 'Todos', value: null },
    { label: 'SOLICITADA', value: 'SOLICITADA' as const },
    { label: 'APROBADA', value: 'APROBADA' as const },
    { label: 'RECHAZADA', value: 'RECHAZADA' as const },
    { label: 'COMPLETADA', value: 'COMPLETADA' as const },
  ];

  readonly solicitudOptions = [
    { label: 'Todas', value: null },
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
  }

  ngOnInit(): void {
    this.transferStore.loadAll({
      page: this.paginationSig().page,
      pageSize: this.paginationSig().pageSize,
    });
  }

  get transferencias(): TransferenciaRow[] {
    return this.transferenciasSig();
  }

  get filteredTransferencias(): TransferenciaRow[] {
    return this.filteredTransferenciasSig();
  }

  get transferenciaSuggestions(): TransferenciaRow[] {
    return this.filteredTransferenciasSig();
  }

  get searchTerm(): string {
    return this.searchTermSig();
  }

  set searchTerm(value: string) {
    this.searchTermSig.set(value ?? '');
  }

  get estadoFilter(): TransferStatus | null {
    return this.estadoFilterSig();
  }

  set estadoFilter(value: TransferStatus | null) {
    this.estadoFilterSig.set(value ?? null);
  }

  get solicitudFilter(): string | null {
    return this.solicitudFilterSig();
  }

  set solicitudFilter(value: string | null) {
    this.solicitudFilterSig.set(value ?? null);
  }

  get loading(): boolean {
    return this.transferStore.loading();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTermSig() || this.estadoFilterSig() || this.solicitudFilterSig());
  }

  get solicitadas(): number {
    return this.solicitadasSig();
  }

  get aprobadas(): number {
    return this.aprobadasSig();
  }

  get completadas(): number {
    return this.completadasSig();
  }

  get rechazadas(): number {
    return this.rechazadasSig();
  }

  get totalRecords(): number {
    return this.displayCountSig();
  }

  get firstRowIndex(): number {
    const pagination = this.paginationSig();
    return Math.max(0, (pagination.page - 1) * pagination.pageSize);
  }

  get rowsPerPage(): number {
    return this.paginationSig().pageSize;
  }

  trackByTransferId = (_: number, item: TransferenciaRow): number => item.id;

  onSearch(event: { query: string }): void {
    this.searchTerm = event.query ?? '';
  }

  onSearchChange(term: string | { producto?: string } | null): void {
    this.searchTerm = this.obtenerValor(term);
  }

  onSelectTransferencia(event: { value?: string | { producto?: string } } | null): void {
    this.searchTerm = this.obtenerValor(event?.value ?? this.searchTerm);
  }

  onTableLazyLoad(event: TableLazyLoadEvent): void {
    if (this.hasActiveFilters) {
      return;
    }

    const rows = Math.max(1, Number(event.rows ?? this.rowsPerPage));
    const first = Math.max(0, Number(event.first ?? 0));
    const page = Math.floor(first / rows) + 1;

    this.transferStore.loadAll({ page, pageSize: rows });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.estadoFilter = null;
    this.solicitudFilter = null;
  }

  filtrar(valor: string): void {
    this.searchTerm = valor || '';
  }

  obtenerValor(term: string | { producto?: string } | null | undefined): string {
    if (!term) return '';
    if (typeof term === 'string') return term;
    return term.producto ?? '';
  }

  getEstadoSeverity(estado: TransferStatus): 'success' | 'warn' | 'info' | 'danger' {
    switch (estado) {
      case 'COMPLETADA':
        return 'success';
      case 'SOLICITADA':
        return 'warn';
      case 'APROBADA':
        return 'info';
      case 'RECHAZADA':
      default:
        return 'danger';
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Acción no permitida',
        detail:
          'Solo un administrador de la sede origen (y no de destino) puede aprobar esta solicitud.',
      });
      return;
    }

    const dto: ApproveTransferDto = {
      userId: this.transferUserContext.getCurrentUserId(),
    };

    this.transferStore
      .approve(row.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (!response) return;

        this.messageService.add({
          severity: 'success',
          summary: 'Transferencia aprobada',
          detail: `Se aprobó la transferencia #${row.codigo}`,
        });
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
        summary: 'Acción no permitida',
        detail:
          'Solo un administrador de la sede destino, distinto al que aprobó, puede completar esta transferencia.',
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
          summary: 'Recepción confirmada',
          detail: `La transferencia #${row.codigo} pasó a COMPLETADA`,
        });
      });
  }

  private mapTransferencia(transferencia: TransferListResponseDto): TransferenciaRow {
    const estado = this.normalizeStatus(transferencia.status);
    const solicitudTipo = transferencia.observation?.trim()
      ? 'Con observacion'
      : 'Sin observacion';

    return {
      id: transferencia.id,
      codigo: String(transferencia.id),
      originHeadquartersId: String(
        transferencia.originHeadquartersId ??
          transferencia.origin?.id_sede ??
          transferencia.origin?.id ??
          '',
      ),
      destinationHeadquartersId: String(
        transferencia.destinationHeadquartersId ??
          transferencia.destination?.id_sede ??
          transferencia.destination?.id ??
          '',
      ),
      approveUserId: this.getApproveUserId(transferencia),
      producto: this.getProductName(transferencia),
      origen:
        transferencia.origin?.nomSede ||
        this.normalizeId(transferencia.originHeadquartersId) ||
        '-',
      destino:
        transferencia.destination?.nomSede ||
        this.normalizeId(transferencia.destinationHeadquartersId) ||
        '-',
      cantidad: transferencia.totalQuantity ?? this.getTotalQuantityFromItems(transferencia),
      solicitud: `${solicitudTipo}: ${transferencia.observation?.trim() || '-'}`,
      responsable: this.getFullUserName(transferencia.creatorUser),
      estado,
      fechaEnvio: this.formatDate(transferencia.requestDate),
      fechaLlegada: '-',
    };
  }

  private getProductName(transferencia: TransferListResponseDto): string {
    const rootProductName = String(transferencia.nomProducto ?? '').trim();
    if (rootProductName) {
      return rootProductName;
    }

    const firstItem = transferencia.items?.[0];
    const producto = firstItem?.producto;
    const parsed = Array.isArray(producto) ? producto[0] : producto;
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const nomProducto = 'nomProducto' in record ? String(record['nomProducto'] ?? '') : '';
      const nombre = 'nombre' in record ? String(record['nombre'] ?? '') : '';
      const anexo = 'anexo' in record ? String(record['anexo'] ?? '') : '';
      const descripcion = 'descripcion' in record ? String(record['descripcion'] ?? '') : '';
      const codigo = 'codigo' in record ? String(record['codigo'] ?? '') : '';

      const resolvedName = nomProducto || nombre || anexo || descripcion || codigo;
      if (resolvedName) {
        return resolvedName;
      }
    }

    const productId = this.extractProductId(firstItem, parsed);
    if (productId !== null) {
      return `Producto #${productId}`;
    }

    return '-';
  }

  private extractProductId(
    item: unknown,
    parsedProducto: unknown,
  ): number | null {
    const itemRecord = (item ?? {}) as Record<string, unknown>;
    const parsedRecord =
      parsedProducto && typeof parsedProducto === 'object'
        ? (parsedProducto as Record<string, unknown>)
        : null;

    const candidates: unknown[] = [
      itemRecord['productId'],
      itemRecord['id_producto'],
      itemRecord['idProducto'],
      itemRecord['productoId'],
      parsedRecord?.['id_producto'],
      parsedRecord?.['idProducto'],
      parsedRecord?.['productId'],
      parsedRecord?.['id'],
    ];

    for (const candidate of candidates) {
      const normalized = Number(candidate);
      if (Number.isFinite(normalized) && normalized > 0) {
        return normalized;
      }
    }

    return null;
  }

  private getTotalQuantityFromItems(transferencia: TransferListResponseDto): number {
    return (transferencia.items ?? []).reduce(
      (acc, item) => acc + (item.quantity ?? item.series?.length ?? 0),
      0,
    );
  }

  private getFullUserName(
    user: TransferenciaUserResponse | TransferenciaUserResponse[] | undefined,
  ): string {
    if (!user) return '-';

    const first = Array.isArray(user) ? user[0] : user;
    const fullName = [
      first.usuNom || first.nombres || '',
      first.apellidos || [first.apePat, first.apeMat].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || `Usuario #${first.idUsuario ?? first.userId ?? first.id ?? '-'}`;
  }

  private normalizeStatus(value: string | TransferStatus | undefined): TransferStatus {
    const raw = String(value ?? 'SOLICITADA').toUpperCase();

    if (raw.includes('APROB')) return 'APROBADA';
    if (raw.includes('RECH')) return 'RECHAZADA';
    if (raw.includes('COMPLET')) return 'COMPLETADA';
    return 'SOLICITADA';
  }

  private formatDate(value?: string): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleDateString('es-PE');
  }

  private normalizeId(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const parsed = String(value).trim();
    return parsed || null;
  }

  private getApproveUserId(transferencia: TransferListResponseDto): number | null {
    if (typeof transferencia.approveUserId === 'number' && transferencia.approveUserId > 0) {
      return transferencia.approveUserId;
    }

    const approveUser = transferencia.approveUser;
    const user = Array.isArray(approveUser) ? approveUser[0] : approveUser;
    if (!user) {
      return null;
    }

    const candidates = [user.idUsuario, user.userId, user.id];
    for (const candidate of candidates) {
      const id = Number(candidate);
      if (Number.isFinite(id) && id > 0) {
        return id;
      }
    }

    return null;
  }

  private isUserFromTransferOrigin(originHeadquartersId: string | number | null | undefined): boolean {
    const userHq = this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || originHeadquartersId === null || originHeadquartersId === undefined) {
      return false;
    }

    return String(originHeadquartersId).trim() === String(userHq).trim();
  }

  private isUserFromTransferDestination(
    destinationHeadquartersId: string | number | null | undefined,
  ): boolean {
    const userHq = this.transferUserContext.getCurrentHeadquarterId();
    if (!userHq || destinationHeadquartersId === null || destinationHeadquartersId === undefined) {
      return false;
    }

    return String(destinationHeadquartersId).trim() === String(userHq).trim();
  }
}
