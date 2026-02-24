import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../enviroments/enviroment';

export interface FiltrosConteo {
  id_sede: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

@Injectable({ providedIn: 'root' })
export class ConteoInventarioService {
  private apiUrl = `${environment.apiUrl}/logistics/conteo-inventario`;
  private http = inject(HttpClient);

  public loading = signal<boolean>(false);
  public conteosListado = signal<any[]>([]); 
  public conteoOperacion = signal<any | null>(null);

  public totalDiferenciasCalculado = computed(() => {
    const detalles = this.conteoOperacion()?.detalles || [];
    return detalles.reduce((acc: number, det: any) => acc + Math.abs(det.diferencia || 0), 0);
  });
  listarConteos(filtros: FiltrosConteo) {
    this.loading.set(true);
    let params = new HttpParams().set('id_sede', filtros.id_sede);
    if (filtros.fecha_inicio) params = params.set('fecha_inicio', filtros.fecha_inicio);
    if (filtros.fecha_fin) params = params.set('fecha_fin', filtros.fecha_fin);

    this.http.get<{ status: number, data: any[] }>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        this.conteosListado.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching conteos', err);
        this.loading.set(false);
      }
    });
  }

  obtenerDetalle(idConteo: number) {
    this.loading.set(true);
    
    this.http.get<any>(`${this.apiUrl}/${idConteo}`).subscribe({
      next: (res) => {
        const dataPura = res.data ? res.data : res;
        
        this.conteoOperacion.set(dataPura);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error obteniendo detalle fresco:', err);
        this.loading.set(false);
      }
    });
  }

  // =====================================
  // POST: PASO 1 - Iniciar Conteo (Snapshot)
  // =====================================
  iniciarNuevoConteo(payload: { idSede: number, nomSede: string, idUsuario: number,idCategoria?: number,nomCategoria?: string }) {
    this.loading.set(true);
    return this.http.post<any>(this.apiUrl, payload);
  }
  finalizarYajustar(idConteo: number, estado: 'AJUSTADO' | 'ANULADO') {
    const detalles = this.conteoOperacion()?.detalles || [];
    
    const payloadData = detalles.map((det: any) => ({
      id_detalle: det.idDetalle,
      stock_conteo: det.stockConteo || 0
    }));

    return this.http.patch(`${this.apiUrl}/${idConteo}/finalizar`, { 
      estado, 
      totalDiferencias: this.totalDiferenciasCalculado(),
      totalItems: detalles.length,
      data: payloadData
    });
  }
}
