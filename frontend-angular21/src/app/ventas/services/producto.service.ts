import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  Producto,
  ProductoAutocompleteResponse,
  ProductoAutocompleteVentas,
  ProductoAutocompleteVentasResponse,
  ProductoDetalle,
  ProductoStockVentas,
  ProductoStockVentasResponse,
} from '../interfaces';

export interface CategoriaConStock {
  id_categoria: number;
  nombre:       string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}/logistics`;

  constructor(private readonly http: HttpClient) {}

  // ─── Lista paginada con precios (ventas) ─────────────────────────────────
  obtenerProductosConStock(
    idSede:       number,
    idCategoria?: number,
    page:         number = 1,
    size:         number = 10,
  ): Observable<ProductoStockVentasResponse> {
    let params = new HttpParams()
      .set('id_sede', idSede.toString())
      .set('page',    page.toString())
      .set('size',    size.toString());

    if (idCategoria) {
      params = params.set('id_categoria', idCategoria.toString());
    }

    return this.http.get<ProductoStockVentasResponse>(
      `${this.apiUrl}/products/productos_stock_ventas`,
      { params },
    );
  }

  // ─── Categorías con stock por sede ───────────────────────────────────────
  obtenerCategoriasConStock(idSede: number): Observable<CategoriaConStock[]> {
    const params = new HttpParams().set('id_sede', idSede.toString());
    return this.http.get<CategoriaConStock[]>(
      `${this.apiUrl}/products/categorias-con-stock`,
      { params },
    );
  }

  // ─── Detalle individual ───────────────────────────────────────────────────
  obtenerDetalleProducto(idProducto: number, idSede: number): Observable<ProductoDetalle> {
    const params = new HttpParams().set('id_sede', idSede.toString());
    return this.http.get<ProductoDetalle>(
      `${this.apiUrl}/products/${idProducto}/stock`,
      { params },
    );
  }

  // ─── Autocomplete estándar logistics (sin precios) ────────────────────────
  buscarProductos(
    query:        string,
    idSede:       number,
    idCategoria?: number,
  ): Observable<ProductoAutocompleteResponse> {
    let params = new HttpParams()
      .set('search',  query)
      .set('id_sede', idSede.toString());

    if (idCategoria) {
      params = params.set('id_categoria', idCategoria.toString());
    }

    return this.http.get<ProductoAutocompleteResponse>(
      `${this.apiUrl}/products/autocomplete`,
      { params },
    );
  }

  // ─── Autocomplete ventas (con precios) ────────────────────────────────────
  buscarProductosVentas(
    query:        string,
    idSede:       number,
    idCategoria?: number,
  ): Observable<ProductoAutocompleteVentasResponse> {
    let params = new HttpParams()
      .set('search',  query)
      .set('id_sede', idSede.toString());

    if (idCategoria) {
      params = params.set('id_categoria', idCategoria.toString());
    }

    return this.http.get<ProductoAutocompleteVentasResponse>(
      `${this.apiUrl}/products/autocomplete-ventas`,
      { params },
    );
  }

  // ─── Mappers ──────────────────────────────────────────────────────────────
  mapearProductoConStock(prod: ProductoStockVentas): Producto {
    return {
      id:              prod.id_producto,
      codigo:          prod.codigo,
      nombre:          prod.nombre,
      familia:         prod.familia,
      id_categoria:    prod.id_categoria,
      stock:           prod.stock,
      precioUnidad:    prod.precio_unitario,
      precioCaja:      prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede:            prod.sede,
    };
  }

  mapearAutocompleteVentas(prod: ProductoAutocompleteVentas, sedeNombre: string): Producto {
    return {
      id:              prod.id_producto,
      codigo:          prod.codigo,
      nombre:          prod.nombre,
      familia:         prod.familia,
      id_categoria:    prod.id_categoria,
      stock:           prod.stock,
      precioUnidad:    prod.precio_unitario,
      precioCaja:      prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede:            sedeNombre,
    };
  }
}