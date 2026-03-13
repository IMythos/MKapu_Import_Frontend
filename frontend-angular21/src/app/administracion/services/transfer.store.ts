import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, take, tap } from 'rxjs/operators';
import {
  ApproveTransferDto,
  ConfirmReceiptTransferDto,
  RejectTransferDto,
  RequestTransferAggregatedDto,
  RequestTransferAggregatedItemDto,
  TransferApiError,
  TransferByIdResponseDto,
  TransferListPaginatedResponseDto,
  TransferListPaginationDto,
  TransferListQueryDto,
  TransferListResponseDto,
  TransferResponseDto,
  TransferStatus,
} from '../interfaces/transferencia.interface';
import { TransferApiService } from './transferencia.service';
import { TransferUserContextService } from './transfer-user-context.service';

interface TransferDraftItemSelection {
  productId: number;
  quantity: number;
}

const EMPTY_DRAFT: RequestTransferAggregatedDto = {
  originHeadquartersId: '',
  originWarehouseId: 0,
  destinationHeadquartersId: '',
  destinationWarehouseId: 0,
  observation: null,
  userId: 0,
  items: [],
};

const DEFAULT_TRANSFER_PAGINATION: TransferListPaginationDto = {
  page: 1,
  pageSize: 5,
  totalRecords: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

@Injectable({ providedIn: 'root' })
export class TransferStore {
  private readonly transferApiService = inject(TransferApiService);
  private readonly transferUserContext = inject(TransferUserContextService);

  readonly transfers = signal<TransferListResponseDto[]>([]);
  readonly selected = signal<TransferByIdResponseDto | TransferResponseDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<TransferListPaginationDto>({
    ...DEFAULT_TRANSFER_PAGINATION,
  });

  readonly requestDraft = signal<RequestTransferAggregatedDto>({ ...EMPTY_DRAFT });
  readonly selectedItems = signal<TransferDraftItemSelection[]>([]);
  readonly conflictProductId = signal<number | null>(null);

  // Compatibilidad con implementación anterior
  readonly transfersList = this.transfers;
  readonly transferDetail = this.selected;

  readonly hasError = computed(() => !!this.error());
  readonly count = computed(() => this.transfers().length);
  readonly total = this.count;
  readonly totalRecords = computed(() => this.pagination().totalRecords);
  readonly totalQuantity = computed(() =>
    this.selectedItems().reduce((acc, item) => acc + item.quantity, 0),
  );
  readonly canSubmit = computed(() => {
    const draft = this.requestDraft();
    const hasRoute =
      !!draft.originHeadquartersId &&
      !!draft.destinationHeadquartersId &&
      draft.originWarehouseId > 0 &&
      draft.destinationWarehouseId > 0;

    const differentRoute =
      draft.originHeadquartersId !== draft.destinationHeadquartersId ||
      draft.originWarehouseId !== draft.destinationWarehouseId;

    const hasValidItems =
      this.selectedItems().length > 0 && this.selectedItems().every((i) => i.quantity > 0);

    return hasRoute && differentRoute && hasValidItems && draft.userId > 0;
  });

  readonly filteredByStatus = computed(
    () => (status: TransferStatus) => this.transfers().filter((item) => item.status === status),
  );

  private readonly lastLoadedHqId = signal<string | null>(null);

  loadAll(query: TransferListQueryDto = {}): void {
    const currentPagination = this.pagination();
    const page =
      Number.isFinite(Number(query.page)) && Number(query.page) > 0
        ? Math.floor(Number(query.page))
        : currentPagination.page;
    const pageSize =
      Number.isFinite(Number(query.pageSize)) && Number(query.pageSize) > 0
        ? Math.floor(Number(query.pageSize))
        : currentPagination.pageSize;
    const headquartersId = String(
      query.headquartersId ?? this.transferUserContext.getCurrentHeadquarterId() ?? '',
    ).trim();

    if (!headquartersId) {
      this.loading.set(false);
      this.error.set('No se pudo determinar la sede del usuario para listar transferencias.');
      this.transfers.set([]);
      this.pagination.set({
        ...DEFAULT_TRANSFER_PAGINATION,
        page,
        pageSize,
      });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.transferApiService
      .listAll({ headquartersId, page, pageSize })
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.lastLoadedHqId.set(headquartersId);
          const normalizedPagination = this.normalizePagination(
            response,
            page,
            pageSize,
          );

          this.transfers.set(response?.data ?? []);
          this.pagination.set(normalizedPagination);
        },
        error: (error: TransferApiError) => {
          this.error.set(this.resolveErrorMessage(error));
          this.transfers.set([]);
          this.pagination.set({
            ...DEFAULT_TRANSFER_PAGINATION,
            page,
            pageSize,
          });
        },
      });
  }

  loadByHq(hqId: string | number): void {
    const normalizedHqId = String(hqId).trim();
    this.loadAll({
      headquartersId: normalizedHqId,
      page: 1,
      pageSize: this.pagination().pageSize,
    });
  }

  loadById(id: number | string): void {
    const transferId = Number(id);
    if (!transferId) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.transferApiService
      .getById(transferId)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (transfer) => {
          this.selected.set(transfer);
          this.upsertTransfer(transfer);
        },
        error: (error: TransferApiError) => {
          this.error.set(this.resolveErrorMessage(error));
          this.selected.set(null);
        },
      });
  }

  createAggregated(dto: RequestTransferAggregatedDto): Observable<TransferResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);
    this.conflictProductId.set(null);

    return this.transferApiService.requestAggregated(dto, 'JEFE DE ALMACEN', 'aggregated').pipe(
      tap((created) => {
        this.upsertTransfer(created, true);
        this.selected.set(created);
      }),
      catchError((error: TransferApiError) => {
        this.error.set(this.resolveErrorMessage(error));
        this.conflictProductId.set(error?.conflict?.productId ?? null);
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  approve(id: number | string, dto: ApproveTransferDto): Observable<TransferResponseDto | null> {
    return this.updateStatus(this.transferApiService.approve(Number(id), dto, 'ADMINISTRADOR'));
  }

  confirmReceipt(
    id: number | string,
    dto: ConfirmReceiptTransferDto,
  ): Observable<TransferResponseDto | null> {
    return this.updateStatus(
      this.transferApiService.confirmReceipt(Number(id), dto, 'ADMINISTRADOR'),
    );
  }

  reject(id: number | string, dto: RejectTransferDto): Observable<TransferResponseDto | null> {
    return this.updateStatus(this.transferApiService.reject(Number(id), dto, 'ADMINISTRADOR'));
  }

  // Compatibilidad con llamadas existentes
  createRequest(): Observable<TransferResponseDto | null> {
    const payload = this.buildDraftRequest();
    if (!payload) {
      return of(null);
    }

    return this.createAggregated(payload);
  }

  requestTransfer(payload: RequestTransferAggregatedDto): Observable<TransferResponseDto | null> {
    return this.createAggregated(payload);
  }

  setDraftOrigin(headquartersId: string, warehouseId?: number): void {
    this.requestDraft.update((draft) => ({
      ...draft,
      originHeadquartersId: headquartersId,
      originWarehouseId: warehouseId ?? draft.originWarehouseId,
    }));
  }

  setDraftDestination(headquartersId: string, warehouseId?: number): void {
    this.requestDraft.update((draft) => ({
      ...draft,
      destinationHeadquartersId: headquartersId,
      destinationWarehouseId: warehouseId ?? draft.destinationWarehouseId,
    }));
  }

  setDraftUserId(userId: number): void {
    this.requestDraft.update((draft) => ({ ...draft, userId }));
  }

  setDraftObservation(observation: string): void {
    this.requestDraft.update((draft) => ({ ...draft, observation }));
  }

  setDraftOriginWarehouse(warehouseId: number): void {
    this.requestDraft.update((draft) => ({ ...draft, originWarehouseId: warehouseId }));
  }

  setDraftDestinationWarehouse(warehouseId: number): void {
    this.requestDraft.update((draft) => ({ ...draft, destinationWarehouseId: warehouseId }));
  }

  addOrUpdateItem(productId: number, deltaQuantity: number): void {
    this.selectedItems.update((items) => {
      const currentIndex = items.findIndex((item) => item.productId === productId);

      if (currentIndex === -1) {
        return [...items, { productId, quantity: Math.max(1, deltaQuantity) }];
      }

      const nextQuantity = Math.max(0, items[currentIndex].quantity + deltaQuantity);
      if (nextQuantity === 0) {
        return items.filter((item) => item.productId !== productId);
      }

      const next = [...items];
      next[currentIndex] = { ...next[currentIndex], quantity: nextQuantity };
      return next;
    });
  }

  removeItem(productId: number): void {
    this.selectedItems.update((items) => items.filter((item) => item.productId !== productId));
  }

  setItemQuantity(productId: number, quantity: number): void {
    const normalized = Math.max(0, Math.floor(quantity));

    this.selectedItems.update((items) => {
      const currentIndex = items.findIndex((item) => item.productId === productId);
      if (currentIndex === -1) {
        if (normalized === 0) {
          return items;
        }

        return [...items, { productId, quantity: normalized }];
      }

      if (normalized === 0) {
        return items.filter((item) => item.productId !== productId);
      }

      const next = [...items];
      next[currentIndex] = { ...next[currentIndex], quantity: normalized };
      return next;
    });
  }

  resetDraft(): void {
    this.requestDraft.set({
      ...EMPTY_DRAFT,
      userId: this.transferUserContext.getCurrentUserId(),
    });
    this.selectedItems.set([]);
    this.conflictProductId.set(null);
  }

  private updateStatus(
    source$: Observable<TransferResponseDto>,
  ): Observable<TransferResponseDto | null> {
    this.loading.set(true);
    this.error.set(null);

    return source$.pipe(
      tap((updated) => {
        this.upsertTransfer(updated);

        const currentSelected = this.selected();
        if (currentSelected?.id === updated.id) {
          this.selected.set({
            ...currentSelected,
            ...updated,
          });
          return;
        }

        this.selected.set(updated);
      }),
      catchError((error: TransferApiError) => {
        this.error.set(this.resolveErrorMessage(error));
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private upsertTransfer(transfer: TransferResponseDto, prepend: boolean = false): void {
    this.transfers.update((current) => {
      const index = current.findIndex((item) => item.id === transfer.id);
      if (index === -1) {
        return prepend ? [transfer, ...current] : [...current, transfer];
      }

      const next = [...current];
      next[index] = { ...next[index], ...transfer };
      return next;
    });
  }

  private buildDraftRequest(): RequestTransferAggregatedDto | null {
    const draft = this.requestDraft();
    const userId = draft.userId || this.transferUserContext.getCurrentUserId();

    const items = this.selectedItems()
      .filter((item) => item.quantity > 0)
      .map<RequestTransferAggregatedItemDto>((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

    if (!items.length || !this.canSubmit()) {
      this.error.set('Completa origen, destino e items válidos antes de enviar la transferencia.');
      return null;
    }

    return {
      ...draft,
      userId,
      items,
      observation: draft.observation?.trim() || null,
    };
  }


  private normalizePagination(
    response: TransferListPaginatedResponseDto | null | undefined,
    fallbackPage: number,
    fallbackPageSize: number,
  ): TransferListPaginationDto {
    const pagination = response?.pagination;
    if (!pagination) {
      return {
        ...DEFAULT_TRANSFER_PAGINATION,
        page: fallbackPage,
        pageSize: fallbackPageSize,
      };
    }

    const page =
      Number.isFinite(Number(pagination.page)) && Number(pagination.page) > 0
        ? Math.floor(Number(pagination.page))
        : fallbackPage;
    const pageSize =
      Number.isFinite(Number(pagination.pageSize)) &&
      Number(pagination.pageSize) > 0
        ? Math.floor(Number(pagination.pageSize))
        : fallbackPageSize;
    const totalRecords = Math.max(0, Number(pagination.totalRecords ?? 0));
    const totalPages =
      Number.isFinite(Number(pagination.totalPages)) &&
      Number(pagination.totalPages) >= 0
        ? Math.floor(Number(pagination.totalPages))
        : totalRecords === 0
          ? 0
          : Math.ceil(totalRecords / pageSize);

    return {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasNextPage:
        typeof pagination.hasNextPage === 'boolean'
          ? pagination.hasNextPage
          : totalPages > 0 && page < totalPages,
      hasPreviousPage:
        typeof pagination.hasPreviousPage === 'boolean'
          ? pagination.hasPreviousPage
          : totalPages > 0 && page > 1,
    };
  }

  private resolveErrorMessage(error: TransferApiError | null | undefined): string {
    return error?.message || 'No se pudo completar la operación de transferencias.';
  }
}

