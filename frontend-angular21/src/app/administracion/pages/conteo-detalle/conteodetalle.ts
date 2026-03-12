import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';

/* SERVICE */
import { ConteoService, ConteoInventario } from '../../services/conteo.service';

interface ProductoDetalle {
  codigo: string;
  producto: string;
  categoria: string;
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
    ProgressBarModule
  ],
  templateUrl: './conteodetalle.html',
})
export class ConteoDetalle implements OnInit {

  conteo!: ConteoInventario;
  productos: ProductoDetalle[] = [];

  totalSistema = 0;
  totalReal = 0;
  diferenciaNeta = 0;
  exactitud = 0;

  sede = 'SJL - Principal';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private conteoService: ConteoService
  ) {}

  ngOnInit(): void {

    const id = Number(this.route.snapshot.paramMap.get('id'));
    const conteoEncontrado = this.conteoService.getConteoById(id);

    if (!conteoEncontrado) {
      this.router.navigate(['/admin/conteo-inventario']);
      return;
    }

    this.conteo = conteoEncontrado;

    /*  LÓGICA INTELIGENTE */
    if (this.conteo.productos && this.conteo.productos.length > 0) {

      // Usa los productos reales guardados
      this.productos = this.conteo.productos.map(p => ({
        codigo: p.codigo,
        producto: p.producto,
        categoria: p.categoria,
        stockSistema: p.stockSistema,
        conteoReal: p.conteoReal
      }));

    } else {

      // Usa tu mock si no hay productos guardados
      this.cargarProductosPorFamilia(this.conteo.familia);

    }

    this.calcularTotales();
  }

  cargarProductosPorFamilia(familia: string) {

    const dataMock: { [key: string]: ProductoDetalle[] } = {

      Licuadoras: [
        { codigo: 'LIC-01', producto: 'Licuadora Industrial 2L', categoria: 'Licuadoras', stockSistema: 40, conteoReal: 39 },
        { codigo: 'LIC-02', producto: 'Licuadora Portátil USB', categoria: 'Licuadoras', stockSistema: 25, conteoReal: 25 }
      ],

      Freidoras: [
        { codigo: 'FRE-01', producto: 'Freidora Aire Digital', categoria: 'Freidoras', stockSistema: 12, conteoReal: 10 },
        { codigo: 'FRE-02', producto: 'Freidora Industrial 8L', categoria: 'Freidoras', stockSistema: 6, conteoReal: 6 }
      ],

      Refris: [
        { codigo: 'REF-01', producto: 'Refrigeradora 300L', categoria: 'Refris', stockSistema: 15, conteoReal: 14 },
        { codigo: 'REF-02', producto: 'Frigobar Ejecutivo', categoria: 'Refris', stockSistema: 9, conteoReal: 9 }
      ],

      Cocinas: [
        { codigo: 'COC-01', producto: 'Cocina Industrial 4 Hornillas', categoria: 'Cocinas', stockSistema: 8, conteoReal: 7 },
        { codigo: 'COC-02', producto: 'Cocina Empotrable 5Q', categoria: 'Cocinas', stockSistema: 11, conteoReal: 11 }
      ]
    };

    this.productos = dataMock[familia] || [];
  }

  calcularDiferencia(row: ProductoDetalle) {
    return row.conteoReal - row.stockSistema;
  }

  getEstadoSeverity(row: ProductoDetalle) {
    const dif = this.calcularDiferencia(row);
    if (dif === 0) return 'success';
    if (dif < 0) return 'danger';
    return 'warn';
  }

  calcularTotales() {
    this.totalSistema = this.productos.reduce((a, b) => a + b.stockSistema, 0);
    this.totalReal = this.productos.reduce((a, b) => a + b.conteoReal, 0);
    this.diferenciaNeta = this.totalReal - this.totalSistema;

    this.exactitud = this.totalSistema > 0
      ? Number(((this.totalReal / this.totalSistema) * 100).toFixed(1))
      : 0;
  }

  regresar() {
    this.router.navigate(['/admin/conteo-inventario']);
  }

}
