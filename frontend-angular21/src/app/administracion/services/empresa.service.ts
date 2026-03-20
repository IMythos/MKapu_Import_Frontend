import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { tap } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

export interface Empresa {
  id:              number;
  nombreComercial: string;
  razonSocial:     string | null;
  ruc:             string;
  sitioWeb:        string | null;
  direccion:       string | null;
  ciudad:          string | null;
  departamento:    string | null;
  telefono:        string | null;
  email:           string | null;
  logoUrl:         string | null;
  updatedAt:       string;
}

export interface UpdateEmpresaPayload {
  nombreComercial: string;
  razonSocial?:    string;
  ruc:             string;
  sitioWeb?:       string;
  direccion?:      string;
  ciudad?:         string;
  departamento?:   string;
  telefono?:       string;
  email?:          string;
  logoUrl?:        string;
  logoPublicId?:   string;
}

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/empresa`;
  private socket!: Socket;

  empresaActual = signal<Empresa | null>(null);

  constructor() {
    this.conectarSocket(); // WS por separado, no bloquea HTTP
  }

  private conectarSocket(): void {
    try {
      this.socket = io(`${environment.apiUrlSocket}/admin/empresa`, {
        transports: ['websocket'],
        reconnectionAttempts: 3,  // no reintentar infinito
        timeout: 5000,
      });

      this.socket.on('empresa:updated', (data: Empresa) => {
        this.empresaActual.set(data);
      });

      this.socket.on('connect_error', (err) => {
        console.warn('WS empresa no disponible:', err.message);
      });
    } catch (e) {
      console.warn('WS empresa no pudo iniciar');
    }
  }

  getEmpresa() {
    return this.http.get<Empresa>(this.baseUrl).pipe(
      tap(data => this.empresaActual.set(data)),
    );
  }

  updateEmpresa(payload: UpdateEmpresaPayload) {
    return this.http.put<Empresa>(this.baseUrl, payload).pipe(
      tap(data => this.empresaActual.set(data)),
    );
  }
  uploadLogo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<{ url: string; publicId: string }>(
    `${this.baseUrl}/logo`,
    formData
  );
}
}