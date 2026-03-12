import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Sede {
  id_sede: string;
  nombre: string;
  razon_social: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  distrito: string;
  provincia: string;
  departamento: string;
  ubigeo: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SedeService {
  private sedesSubject = new BehaviorSubject<Sede[]>([]);
  public sedes$ = this.sedesSubject.asObservable();

  private sedeActualSubject = new BehaviorSubject<Sede | null>(null);
  public sedeActual$ = this.sedeActualSubject.asObservable();

  constructor() {
    this.inicializarSedes();
  }

  private inicializarSedes(): void {

  }

  getSedes(): Observable<Sede[]> {
    return this.sedesSubject.asObservable();
  }

  getSedeActual(): Observable<Sede> {
    return this.sedeActualSubject.asObservable().pipe(
      map(sede => {
        if (!sede) {
          throw new Error('No hay sede seleccionada');
        }
        return sede;
      })
    );
  }

  getSedeById(idSede: string): Observable<Sede> {
    return this.getSedes().pipe(
      map(sedes => {
        const sede = sedes.find(s => s.id_sede === idSede);
        if (!sede) {
          throw new Error(`Sede con ID ${idSede} no encontrada`);
        }
        return sede;
      })
    );
  }

  setSedeActual(idSede: string): void {
    const sedes = this.sedesSubject.value;
    const sede = sedes.find(s => s.id_sede === idSede);
    
    if (sede) {
      this.sedeActualSubject.next(sede);
    }
  }

  crearSede(sede: Omit<Sede, 'id_sede'>): Sede {
    const sedes = this.sedesSubject.value;
    const nuevoId = `SEDE${String(sedes.length + 1).padStart(3, '0')}`;
    
    const nuevaSede: Sede = {
      ...sede,
      id_sede: nuevoId
    };

    this.sedesSubject.next([...sedes, nuevaSede]);
    return nuevaSede;
  }

  actualizarSede(idSede: string, cambios: Partial<Sede>): boolean {
    const sedes = [...this.sedesSubject.value];
    const index = sedes.findIndex(s => s.id_sede === idSede);

    if (index !== -1) {
      sedes[index] = { ...sedes[index], ...cambios };
      this.sedesSubject.next(sedes);
      return true;
    }
    return false;
  }

  eliminarSede(idSede: string): boolean {
    const sedes = this.sedesSubject.value.filter(s => s.id_sede !== idSede);
    this.sedesSubject.next(sedes);
    return true;
  }


}
