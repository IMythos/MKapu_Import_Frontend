import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';

interface ProductoDetalle {
  codigo: string;
  producto: string;
  stockSistema: number;
  conteoReal: number;
}

@Component({
  selector: 'app-conteo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    ProgressBarModule,
    RouterModule
  ],
  templateUrl: './conteodetalle.html',
  styleUrls: ['./conteodetalle.css']
})
export class ConteoDetalle implements OnInit {

  private router = inject(Router);

  conteo = signal<any>(null);
  productos = signal<ProductoDetalle[]>([]);
  exactitud = signal<number>(92); // Si en el futuro lo calculas, puede pasar a ser un computed()

  
  totalSistema = computed(() => 
    this.productos().reduce((acc, item) => acc + item.stockSistema, 0)
  );
  
  totalReal = computed(() => 
    this.productos().reduce((acc, item) => acc + item.conteoReal, 0)
  );
  
  diferenciaNeta = computed(() => 
    this.totalReal() - this.totalSistema()
  );


  ngOnInit() {
    const estadoConteo = history.state.conteo;

    if (!estadoConteo) {
      this.router.navigate(['/administracion/conteo-inventario']);
    } else {
      this.conteo.set(estadoConteo);
    }

    this.cargarDetalleMock();
  }

  cargarDetalleMock() {
    this.productos.set([
      { codigo: 'MK-7721', producto: 'Licuadora Industrial 2L', stockSistema: 45, conteoReal: 45 },
      { codigo: 'MK-8816', producto: 'Freidora Aire Digital', stockSistema: 12, conteoReal: 10 },
      { codigo: 'MK-1022', producto: 'Hervidor Eléctrico 1.7L', stockSistema: 30, conteoReal: 31 },
      { codigo: 'MK-5541', producto: 'Cafetera Expreso Duo', stockSistema: 8, conteoReal: 8 }
    ]);
  }


  calcularDiferencia(row: ProductoDetalle): number {
    return row.conteoReal - row.stockSistema;
  }

  regresar() {
    this.router.navigate(['/conteo-inventario']);
  }

  descargarPDF() {
    console.log('Descargar PDF de:', this.conteo());
  }
}
