import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import {
  AssignWarehouseToSedeRequestDto,
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
  SedeAlmacenWarehouseDto,
  WarehouseSelectOption,
} from '../interfaces/sede-almacen.interface';

type WarehouseCatalogMap = Record<number, SedeAlmacenWarehouseDto>;

type WarehouseOptionCandidate = {
  id: number;
  codigo: string;
  nombre: string;
};

type WarehouseOptionsParseResult = {
  options: WarehouseSelectOption[];
  missingWarehouseIds: number[];
};

@Injectable({ providedIn: 'root' })
export class SedeAlmacenService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private readonly _warehouseOptionsBySede = signal<Record<string, WarehouseSelectOption[]>>({});
  private readonly _loadingBySede = signal<Record<string, boolean>>({});
  private readonly _errorBySede = signal<Record<string, string | null>>({});
  private readonly _warehouseCatalogById = signal<WarehouseCatalogMap>({});
  private readonly _warehouseCatalogLoading = signal(false);

  readonly warehouseOptionsBySede = computed(() => this._warehouseOptionsBySede());
  readonly loadingBySede = computed(() => this._loadingBySede());
  readonly errorBySede = computed(() => this._errorBySede());

  assignWarehouseToSede(
    payload: AssignWarehouseToSedeRequestDto,
    role: string = 'Administrador',
  ): Observable<SedeAlmacenResponseDto> {
    return this.http.post<SedeAlmacenResponseDto>(
      `${this.api}/admin/sede-almacen/assign`,
      payload,
      {
        headers: this.buildHeaders(role),
      },
    );
  }

  loadWarehouseOptionsBySede(
    sedeId: string | number,
    role: string = 'Administrador',
  ): Observable<WarehouseSelectOption[]> {
    const sedeKey = this.normalizeSedeId(sedeId);
    if (!sedeKey) {
      return throwError(() => new Error('El id de sede es invalido.'));
    }

    this.patchLoading(sedeKey, true);
    this.patchError(sedeKey, null);

    return this.http
      .get<SedeAlmacenListResponseDto>(`${this.api}/admin/sede-almacen/sede/${sedeKey}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        switchMap((response) => {
          const parsedWithCache = this.mapToWarehouseOptions(
            response,
            this._warehouseCatalogById(),
          );

          if (parsedWithCache.missingWarehouseIds.length === 0) {
            return of(parsedWithCache.options);
          }

          return this.ensureWarehouseCatalog(role).pipe(
            map((catalog) => this.mapToWarehouseOptions(response, catalog).options),
          );
        }),
        tap((options) => {
          this._warehouseOptionsBySede.update((cache) => ({
            ...cache,
            [sedeKey]: options,
          }));
        }),
        catchError((error) => {
          this.patchError(
            sedeKey,
            'No se pudieron cargar los almacenes de la sede seleccionada.',
          );
          return throwError(() => error);
        }),
        finalize(() => this.patchLoading(sedeKey, false)),
      );
  }

  getWarehouseOptionsBySede(sedeId: string | number | null | undefined): WarehouseSelectOption[] {
    const sedeKey = this.normalizeSedeId(sedeId);
    if (!sedeKey) {
      return [];
    }

    return this._warehouseOptionsBySede()[sedeKey] ?? [];
  }

  private mapToWarehouseOptions(
    response: SedeAlmacenListResponseDto,
    catalog: WarehouseCatalogMap = {},
  ): WarehouseOptionsParseResult {
    const uniqueWarehouseIds = new Set<number>();
    const missingWarehouseIds: number[] = [];
    const options: WarehouseSelectOption[] = [];

    for (const rawItem of response.almacenes ?? []) {
      const candidate = this.extractWarehouseCandidate(rawItem, catalog);
      if (!candidate || uniqueWarehouseIds.has(candidate.id)) {
        continue;
      }

      uniqueWarehouseIds.add(candidate.id);
      if (!candidate.codigo && !candidate.nombre) {
        missingWarehouseIds.push(candidate.id);
      }

      const label = [candidate.codigo, candidate.nombre]
        .filter(Boolean)
        .join(' - ')
        .trim();

      options.push({
        value: candidate.id,
        label: label || `Almacen ${candidate.id}`,
      });
    }

    return {
      options,
      missingWarehouseIds,
    };
  }

  private extractWarehouseCandidate(
    item: unknown,
    catalog: WarehouseCatalogMap,
  ): WarehouseOptionCandidate | null {
    const itemRecord = this.toRecord(item);
    const nestedRecord = this.toRecord(itemRecord?.['almacen']);
    const warehouseId = this.toPositiveNumber(
      nestedRecord?.['id_almacen'] ??
        nestedRecord?.['id'] ??
        itemRecord?.['id_almacen'] ??
        itemRecord?.['id_almacen_ref'] ??
        itemRecord?.['id'],
    );

    if (!warehouseId) {
      return null;
    }

    const catalogWarehouse = catalog[warehouseId];
    const warehouseCode = this.toCleanString(
      nestedRecord?.['codigo'] ?? itemRecord?.['codigo'] ?? catalogWarehouse?.codigo,
    );
    const warehouseName = this.toCleanString(
      nestedRecord?.['nombre'] ??
        nestedRecord?.['nomAlm'] ??
        itemRecord?.['nombre'] ??
        itemRecord?.['nomAlm'] ??
        catalogWarehouse?.nombre,
    );

    return {
      id: warehouseId,
      codigo: warehouseCode,
      nombre: warehouseName,
    };
  }

  private normalizeSedeId(sedeId: string | number | null | undefined): string {
    const normalized = String(sedeId ?? '').trim();
    if (!normalized || normalized === '0') {
      return '';
    }

    return normalized;
  }

  private patchLoading(sedeKey: string, loading: boolean): void {
    this._loadingBySede.update((current) => ({
      ...current,
      [sedeKey]: loading,
    }));
  }

  private patchError(sedeKey: string, message: string | null): void {
    this._errorBySede.update((current) => ({
      ...current,
      [sedeKey]: message,
    }));
  }

  private ensureWarehouseCatalog(role: string): Observable<WarehouseCatalogMap> {
    const cachedCatalog = this._warehouseCatalogById();
    if (Object.keys(cachedCatalog).length > 0 || this._warehouseCatalogLoading()) {
      return of(cachedCatalog);
    }

    this._warehouseCatalogLoading.set(true);

    return this.http
      .get<unknown>(`${this.api}/logistics/warehouses`, {
        headers: this.buildHeaders(role),
        params: { page: '1', pageSize: '1000' },
      })
      .pipe(
        map((response) => this.extractWarehouseCatalog(response)),
        tap((catalog) => {
          this._warehouseCatalogById.set(catalog);
        }),
        catchError(() => of(cachedCatalog)),
        finalize(() => this._warehouseCatalogLoading.set(false)),
      );
  }

  private extractWarehouseCatalog(response: unknown): WarehouseCatalogMap {
    const root = this.toRecord(response);
    const list = this.toUnknownArray(
      root?.['warehouses'] ?? root?.['data'] ?? root?.['items'] ?? response,
    );
    const catalog: WarehouseCatalogMap = {};

    for (const row of list) {
      const record = this.toRecord(row);
      const id = this.toPositiveNumber(record?.['id_almacen'] ?? record?.['id']);
      if (!id) {
        continue;
      }

      const codigo = this.toCleanString(record?.['codigo']);
      const nombre = this.toCleanString(record?.['nombre'] ?? record?.['nomAlm']);
      if (!codigo && !nombre) {
        continue;
      }

      catalog[id] = {
        id_almacen: id,
        codigo,
        nombre: nombre || null,
      };
    }

    return catalog;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value as Record<string, unknown>;
  }

  private toUnknownArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private toPositiveNumber(value: unknown): number | null {
    const normalized = Number(value);
    if (!Number.isFinite(normalized) || normalized <= 0) {
      return null;
    }
    return normalized;
  }

  private toCleanString(value: unknown): string {
    return String(value ?? '').trim();
  }

  private buildHeaders(role: string): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }
}
