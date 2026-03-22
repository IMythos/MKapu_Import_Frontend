import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';
import { finalize, tap, catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

export type CommissionTargetType = 'PRODUCTO' | 'CATEGORIA';
export type CommissionRewardType = 'PORCENTAJE' | 'MONTO_FIJO';
export type CommissionStatus     = 'PENDIENTE' | 'LIQUIDADA' | 'ANULADA';

// ── DTOs ──────────────────────────────────────────────────────────────────────
export interface CreateCommissionRuleDto {
  nombre:           string;
  descripcion?:     string;
  tipo_objetivo?:   CommissionTargetType;
  id_objetivo:      number;
  meta_unidades?:   number;
  tipo_recompensa:  CommissionRewardType;
  valor_recompensa: number;
  fecha_inicio:     string;
  fecha_fin?:       string;
}

export interface CommissionRule {
  id_regla:         number;
  nombre:           string;
  descripcion?:     string;
  tipo_objetivo:    CommissionTargetType;
  id_objetivo:      number;
  meta_unidades:    number;
  tipo_recompensa:  CommissionRewardType;
  valor_recompensa: number;
  activo:           boolean;
  fecha_inicio:     Date;
  fecha_fin?:       Date;
}

export interface CommissionReport {
  id_comision:        number;
  id_vendedor_ref:    string;
  nombre_vendedor:    string;
  id_comprobante:     number;
  id_sede:            number;
  nombre_sede:        string;
  porcentaje:         number;
  monto:              number;
  estado:             CommissionStatus;
  fecha_registro:     Date;
  fecha_liquidacion?: Date;
  id_regla?:          number;
}

export interface CommissionRuleUsage {
  id_regla:    number;
  usos:        number;
  monto_total: number;
}

@Injectable({ providedIn: 'root' })
export class CommissionService {
  private readonly api = environment.apiUrl;

  private readonly _rules       = signal<CommissionRule[]>([]);
  private readonly _report      = signal<CommissionReport[]>([]);
  private readonly _usageByRule = signal<CommissionRuleUsage[]>([]);
  private readonly _loading     = signal(false);
  private readonly _error       = signal<string | null>(null);

  readonly rules       = computed(() => this._rules());
  readonly report      = computed(() => this._report());
  readonly usageByRule = computed(() => this._usageByRule());
  readonly loading     = computed(() => this._loading());
  readonly error       = computed(() => this._error());

  readonly activeRules   = computed(() => this._rules().filter(r => r.activo));
  readonly productRules  = computed(() => this._rules().filter(r => r.tipo_objetivo === 'PRODUCTO'));
  readonly categoryRules = computed(() => this._rules().filter(r => r.tipo_objetivo === 'CATEGORIA'));

  readonly totalCommissions = computed(() =>
    this._report().reduce((acc, c) => acc + Number(c.monto), 0),
  );

  constructor(private readonly http: HttpClient) {}

  private headers(role = 'Administrador'): HttpHeaders {
    return new HttpHeaders({ 'x-role': role });
  }

  // ── Reglas ─────────────────────────────────────────────────────────────────

  loadRules(role = 'Administrador'): Observable<CommissionRule[]> {
    this._loading.set(true);
    this._error.set(null);
    return this.http
      .get<any[]>(`${this.api}/sales/commissions/rules`, { headers: this.headers(role) })
      .pipe(
        map(res => res.map((i: any) => i.props ?? i)),
        tap(res => this._rules.set(res)),
        catchError(err => { this._error.set('Error al cargar las reglas'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  createCategoryRule(dto: CreateCommissionRuleDto, role = 'Administrador'): Observable<CommissionRule> {
    this._loading.set(true);
    return this.http
      .post<any>(`${this.api}/sales/commissions/rules/category`, dto, { headers: this.headers(role) })
      .pipe(
        map(res => res.props ?? res),
        tap(r => this._rules.update(rules => [...rules, r])),
        catchError(err => { this._error.set('Error al crear la regla'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  createProductRule(dto: CreateCommissionRuleDto, role = 'Administrador'): Observable<CommissionRule> {
    this._loading.set(true);
    return this.http
      .post<any>(`${this.api}/sales/commissions/rules/product`, dto, { headers: this.headers(role) })
      .pipe(
        map(res => res.props ?? res),
        tap(r => this._rules.update(rules => [...rules, r])),
        catchError(err => { this._error.set('Error al crear la regla'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  updateRule(id: number, dto: CreateCommissionRuleDto, role = 'Administrador'): Observable<CommissionRule> {
    this._loading.set(true);
    return this.http
      .put<any>(`${this.api}/sales/commissions/rules/${id}`, dto, { headers: this.headers(role) })
      .pipe(
        map(res => res?.props ?? res),
        tap(updated => this._rules.update(rules =>
          rules.map(r => r.id_regla === id ? { ...r, ...updated } : r)
        )),
        catchError(err => { this._error.set('Error al actualizar la regla'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  toggleRuleStatus(id: number, isActive: boolean, role = 'Administrador'): Observable<CommissionRule> {
    this._loading.set(true);
    return this.http
      .patch<CommissionRule>(
        `${this.api}/sales/commissions/rules/${id}/status`,
        { isActive },
        { headers: this.headers(role) },
      )
      .pipe(
        tap(updated => this._rules.update(rules => rules.map(r => r.id_regla === id ? updated : r))),
        catchError(err => { this._error.set('Error al cambiar el estado'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  // ── Reporte ────────────────────────────────────────────────────────────────

  loadReport(from: Date, to: Date, role = 'Administrador'): Observable<CommissionReport[]> {
    this._loading.set(true);
    this._error.set(null);
    const params = new HttpParams()
      .set('from', from.toISOString().split('T')[0])
      .set('to',   to.toISOString().split('T')[0]);

    return this.http
      .get<any[]>(`${this.api}/sales/commissions/report`, {
        headers: this.headers(role),
        params,
      })
      .pipe(
        map(data => (Array.isArray(data) ? data : []).map((i: any) => i.props ?? i)),
        tap(data => this._report.set(data)),
        catchError(err => { this._error.set('Error al cargar el reporte'); return throwError(() => err); }),
        finalize(() => this._loading.set(false)),
      );
  }

  loadUsageByRule(role = 'Administrador'): Observable<CommissionRuleUsage[]> {
    return this.http
      .get<CommissionRuleUsage[]>(`${this.api}/sales/commissions/usage-by-rule`, {
        headers: this.headers(role),
      })
      .pipe(
        tap(data => this._usageByRule.set(data)),
        catchError(err => { this._error.set('Error al cargar uso de reglas'); return throwError(() => err); }),
      );
  }

  calculateCommissions(from: Date, to: Date, role = 'Administrador'): Observable<CommissionReport[]> {
    return this.loadReport(from, to, role);
  }

  atender(id: number, role = 'Administrador'): Observable<CommissionReport> {
    return this.http
      .patch<any>(`${this.api}/sales/commissions/${id}/atender`, {}, {
        headers: this.headers(role),
      })
      .pipe(
        map(res => res?.props ?? res),
        tap(updated => this._report.update(list =>
          list.map(c => c.id_comision === id ? { ...c, ...updated } : c),
        )),
        catchError(err => {
          this._error.set('Error al atender la comisión');
          return throwError(() => err);
        }),
      );
  }

  clearError(): void  { this._error.set(null); }
  clearReport(): void { this._report.set([]); }
}