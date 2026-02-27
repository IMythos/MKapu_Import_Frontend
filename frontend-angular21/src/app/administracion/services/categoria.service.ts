import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { finalize, tap, catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CategoriaResponse, Categoria } from '../interfaces/categoria.interface';

export type CreateCategoriaRequest = Omit<Categoria, 'id_categoria' | 'activo'>;
export type UpdateCategoriaRequest = Partial<Omit<Categoria, 'id_categoria'>>;

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly api = environment.apiUrl;

  private readonly _categoriasResponse = signal<CategoriaResponse | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categoriasResponse = computed(() => this._categoriasResponse());
  readonly categorias = computed(() => this._categoriasResponse()?.categories ?? []);
  readonly total = computed(() => this._categoriasResponse()?.total ?? 0);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  constructor(private http: HttpClient) {}

  private buildHeaders(role: string = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role ?? '' });
  }

  getCategorias(activo?: boolean, search?: string): Observable<CategoriaResponse> {
    let params = new HttpParams().set('pageSize', '200');
    if (activo !== undefined) params = params.set('activo', activo);
    if (search) params = params.set('search', search);
    return this.http.get<CategoriaResponse>(`${this.api}/logistics/categories`, { params });
  }

  loadCategorias(role: string = 'Administrador'): Observable<CategoriaResponse> {
    this._loading.set(true);
    this._error.set(null);

    const params = new HttpParams().set('pageSize', '200');

    return this.http
      .get<CategoriaResponse>(`${this.api}/logistics/categories`, {
        headers: this.buildHeaders(role),
        params,
      })
      .pipe(
        tap((res) => {
          // Normaliza activo por si el backend aún devuelve Buffer
          const normalized: CategoriaResponse = {
            ...res,
            categories: res.categories.map((c: any) => ({
              ...c,
              activo:
                typeof c.activo === 'boolean'
                  ? c.activo
                  : c.activo?.data?.[0] === 1,
            })),
          };
          this._categoriasResponse.set(normalized);
        }),
        catchError((err) => {
          this._error.set('No se pudo cargar las categorías.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  getCategoriaById(id: number, role: string = 'Administrador'): Observable<Categoria> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .get<Categoria>(`${this.api}/logistics/categories/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        catchError((err) => {
          this._error.set('No se pudo cargar la categoría.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  createCategoria(
    payload: CreateCategoriaRequest,
    role: string = 'Administrador'
  ): Observable<Categoria> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .post<Categoria>(`${this.api}/logistics/categories`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((created) => {
          const prev = this._categoriasResponse();
          if (!prev) return;
          this._categoriasResponse.set({
            ...prev,
            categories: [created, ...prev.categories],
            total: prev.total + 1,
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo crear la categoría.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  updateCategoria(
    id: number,
    payload: UpdateCategoriaRequest,
    role: string = 'Administrador'
  ): Observable<Categoria> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .put<Categoria>(`${this.api}/logistics/categories/${id}`, payload, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap((updated) => this.patchCachedCategoria(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar la categoría.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  updateCategoriaStatus(
    id: number,
    activo: boolean,
    role: string = 'Administrador'
  ): Observable<Categoria> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .put<Categoria>(
        `${this.api}/logistics/categories/${id}/status`,
        { activo },
        { headers: this.buildHeaders(role) }
      )
      .pipe(
        tap((updated) => this.patchCachedCategoria(id, updated)),
        catchError((err) => {
          this._error.set('No se pudo actualizar el estado de la categoría.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  deleteCategoria(id: number, role: string = 'Administrador'): Observable<any> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .delete(`${this.api}/logistics/categories/${id}`, {
        headers: this.buildHeaders(role),
      })
      .pipe(
        tap(() => {
          const prev = this._categoriasResponse();
          if (!prev) return;
          this._categoriasResponse.set({
            ...prev,
            categories: prev.categories.filter((c) => c.id_categoria !== id),
            total: prev.total - 1,
          });
        }),
        catchError((err) => {
          this._error.set('No se pudo eliminar la categoría.');
          return throwError(() => err);
        }),
        finalize(() => this._loading.set(false))
      );
  }

  private patchCachedCategoria(id: number, updated: Categoria): void {
    const prev = this._categoriasResponse();
    if (!prev) return;
    this._categoriasResponse.set({
      ...prev,
      categories: prev.categories.map((c) => (c.id_categoria === id ? updated : c)),
    });
  }

}

