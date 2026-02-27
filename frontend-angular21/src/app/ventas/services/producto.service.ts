import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

import {
  // OUT — responses del backend
  ProductoStockVentasResponse,
  ProductoStockVentas,
  ProductoAutocompleteVentasResponse,
  ProductoAutocompleteVentas,
  ProductoAutocompleteResponse,
  ProductoDetalle,
  CategoriaConStock,
  ProductoUI,
} from '../interfaces';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly apiUrl = `${environment.apiUrl}/logistics`;

  constructor(private readonly http: HttpClient) {}

  obtenerProductosConStock(
    idSede: number,
    idCategoria?: number,
    page: number = 1,
    size: number = 10,
  ): Observable<ProductoStockVentasResponse> {
    let params = new HttpParams()
      .set('id_sede', String(idSede))
      .set('page', String(page))
      .set('size', String(size));

    if (idCategoria) params = params.set('id_categoria', String(idCategoria));

    return this.http.get<ProductoStockVentasResponse>(`${this.apiUrl}/products/ventas/stock`, {
      params,
    });
  }

  obtenerCategoriasConStock(idSede: number): Observable<CategoriaConStock[]> {
    const params = new HttpParams().set('id_sede', String(idSede));
    return this.http.get<CategoriaConStock[]>(`${this.apiUrl}/products/categorias-con-stock`, {
      params,
    });
  }

  obtenerDetalleProducto(idProducto: number, idSede: number): Observable<ProductoDetalle> {
    const params = new HttpParams().set('id_sede', String(idSede));
    return this.http.get<ProductoDetalle>(`${this.apiUrl}/products/${idProducto}/stock`, {
      params,
    });
  }

  buscarProductos(
    query: string,
    idSede: number,
    idCategoria?: number,
  ): Observable<ProductoAutocompleteResponse> {
    let params = new HttpParams().set('search', query).set('id_sede', String(idSede));

    if (idCategoria) params = params.set('id_categoria', String(idCategoria));

    return this.http.get<ProductoAutocompleteResponse>(`${this.apiUrl}/products/autocomplete`, {
      params,
    });
  }

  buscarProductosVentas(
    query: string,
    idSede: number,
    idCategoria?: number,
  ): Observable<ProductoAutocompleteVentasResponse> {
    let params = new HttpParams().set('search', query).set('id_sede', String(idSede));

    if (idCategoria) params = params.set('id_categoria', String(idCategoria));

    return this.http.get<ProductoAutocompleteVentasResponse>(
      `${this.apiUrl}/products/ventas/autocomplete`,
      { params },
    );
  }

  // ─── Mappers: API response → modelo UI ───────────────────────────────────
  mapearProductoConStock(prod: ProductoStockVentas): ProductoUI {
    return {
      id: prod.id_producto,
      codigo: prod.codigo,
      nombre: prod.nombre,
      familia: prod.familia,
      id_categoria: prod.id_categoria,
      stock: prod.stock,
      precioUnidad: prod.precio_unitario,
      precioCaja: prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede: prod.sede,
    };
  }

  mapearAutocompleteVentas(prod: ProductoAutocompleteVentas, sedeNombre: string): ProductoUI {
    return {
      id: prod.id_producto,
      codigo: prod.codigo,
      nombre: prod.nombre,
      familia: prod.familia,
      id_categoria: prod.id_categoria,
      stock: prod.stock,
      precioUnidad: prod.precio_unitario,
      precioCaja: prod.precio_caja,
      precioMayorista: prod.precio_mayor,
      sede: sedeNombre,
    };
  }
}
