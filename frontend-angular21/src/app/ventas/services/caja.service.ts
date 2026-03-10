import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface CajaHistorialItem {
  id_caja:      string;
  id_sede_ref:  number;
  estado:       'ABIERTA' | 'CERRADA';
  fec_apertura: string;
  fec_cierre:   string | null;
  monto_inicial: number | null;
}

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly apiUrl = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  getActiveCashbox(idSede: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/cashbox/active/${idSede}`);
  }

  openCashbox(idSede: number, montoInicial?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cashbox/open`, {
      id_sede_ref: idSede,
      ...(montoInicial != null && { monto_inicial: montoInicial }),
    });
  }

  getResumenDia(idSede: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cashbox/resumen/${idSede}`);
  }

  closeCashbox(idCaja: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/cashbox/close`, { id_caja: idCaja });
  }

  // ── Reporte térmico del resumen ───────────────────────────────────

  /** Abre el PDF en nueva pestaña y dispara print() automáticamente */
  printResumenThermal(idSede: number): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.apiUrl}/cashbox/resumen/${idSede}/export/thermal`, {
        responseType: 'blob',
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const win = window.open(url, '_blank');
          if (win) {
            win.onload = () => { win.focus(); win.print(); };
            setTimeout(() => { try { win.focus(); win.print(); } catch { } }, 1500);
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
          observer.next();
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  /** Descarga el PDF al disco */
  downloadResumenThermal(idSede: number): Observable<void> {
    return new Observable((observer) => {
      const link    = document.createElement('a');
      link.href     = `${this.apiUrl}/cashbox/resumen/${idSede}/export/thermal`;
      link.download = `resumen-caja-sede-${idSede}.pdf`;
      link.target   = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      observer.next();
      observer.complete();
    });
  }

  // ── Historial de cajas por sede ───────────────────────────────────

  getHistorial(idSede: number): Observable<CajaHistorialItem[]> {
    return this.http.get<CajaHistorialItem[]>(
      `${this.apiUrl}/cashbox/historial/${idSede}`
    );
  }

  /** Reporte térmico de una caja histórica por su id_caja */
  printResumenThermalById(idCaja: string): Observable<void> {
    return new Observable((observer) => {
      this.http.get(`${this.apiUrl}/cashbox/${idCaja}/export/thermal`, {
        responseType: 'blob',
      }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
          const win = window.open(url, '_blank');
          if (win) {
            win.onload = () => { win.focus(); win.print(); };
            setTimeout(() => { try { win.focus(); win.print(); } catch { } }, 1500);
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
          observer.next();
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}