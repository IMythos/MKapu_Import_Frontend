import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, Injectable, inject, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroment';
import {
  AssignWarehouseToSedeRequestDto,
  SedeAlmacenListResponseDto,
  SedeAlmacenResponseDto,
  WarehouseSelectOption,
} from '../interfaces/sede-almacen.interface';

@Injectable({ providedIn: 'root' })
export class SedeAlmacenService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  private readonly _warehouseOptionsBySede = signal<Record<string, WarehouseSelectOption[]>>({});
  private readonly _loadingBySede = signal<Record<string, boolean>>({});
  private readonly _errorBySede = signal<Record<string, string | null>>({});

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
        map((response) => this.mapToWarehouseOptions(response)),
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

  private mapToWarehouseOptions(response: SedeAlmacenListResponseDto): WarehouseSelectOption[] {
    const uniqueWarehouseIds = new Set<number>();

    return (response.almacenes ?? [])
      .map((item) => {
        const warehouseId = Number(item.almacen?.id_almacen ?? item.id_almacen ?? 0);
        if (!Number.isFinite(warehouseId) || warehouseId <= 0 || uniqueWarehouseIds.has(warehouseId)) {
          return null;
        }

        uniqueWarehouseIds.add(warehouseId);

        const warehouseCode = String(item.almacen?.codigo ?? '').trim();
        const warehouseName = String(item.almacen?.nombre ?? '').trim();
        const label = [warehouseCode, warehouseName]
          .filter(Boolean)
          .join(' - ')
          .trim();

        return {
          value: warehouseId,
          label: label || `Almacen ${warehouseId}`,
        };
      })
      .filter((option): option is WarehouseSelectOption => option !== null);
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

  private buildHeaders(role: string): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }
}