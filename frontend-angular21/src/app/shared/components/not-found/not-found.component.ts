// shared/components/not-found/not-found.component.ts
import { Component, input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { Router }           from '@angular/router';

@Component({
  selector:   'app-not-found',
  standalone: true,
  imports:    [CommonModule],
  templateUrl: './not-found.component.html',
  styleUrl:    './not-found.component.css',
})
export class NotFoundComponent {
  /** Ruta a la que vuelve el botón. Por defecto va al inicio. */
  rutaVolver  = input<string>('/');
  labelVolver = input<string>('Volver al inicio');

  /** Mensaje personalizable — útil para 403, recurso no encontrado, etc. */
  titulo  = input<string>('Página no encontrada');
  detalle = input<string>('La ruta que buscas no existe o fue movida.');
  codigo  = input<string>('404');

  constructor(private router: Router) {}

  volver() { this.router.navigate([this.rutaVolver()]); }
}