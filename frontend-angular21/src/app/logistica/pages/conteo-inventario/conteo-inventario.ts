import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

interface ConteoResumen {
  idConteo: number;
  sede: string;
  fechaInicio: Date;
  estado: 'INICIADO' | 'FINALIZADO' | 'ANULADO';
  totalItems: number;
  totalDiferencias: number;
}

@Component({
  selector: 'app-conteo-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TagModule,
    CardModule,
    TooltipModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './conteo-inventario.html',
  styleUrl: './conteo-inventario.css',
})
export class ConteoInventario implements OnInit {
  private router = inject(Router);

  // Signal para almacenar la lista de conteos previos
  historialConteos = signal<ConteoResumen[]>([]);
  loading = signal<boolean>(false);

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.loading.set(true);
    setTimeout(() => {
      this.historialConteos.set([
        { idConteo: 1, sede: 'SJL', fechaInicio: new Date('2024-02-10'), estado: 'FINALIZADO', totalItems: 150, totalDiferencias: -2 },
        { idConteo: 2, sede: 'SJL', fechaInicio: new Date('2024-02-15'), estado: 'ANULADO', totalItems: 150, totalDiferencias: 0 },
        { idConteo: 3, sede: 'SJL', fechaInicio: new Date(), estado: 'INICIADO', totalItems: 155, totalDiferencias: 0 },
      ]);
      this.loading.set(false);
    }, 500);
  }

  irACrearConteo() {
    this.router.navigate(['/logistica/conteo-crear']);
  }

  verDetalleConteo(conteo: ConteoResumen) {
    this.router.navigate(['/administracion/conteo-detalle', conteo.idConteo]);
  }

  getEstadoSeverity(estado: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (estado) {
      case 'FINALIZADO': return 'success';
      case 'INICIADO': return 'info';
      case 'ANULADO': return 'danger';
      default: return 'warn';
    }
  }
}