import { Component, input } from '@angular/core';
import { CommonModule }     from '@angular/common';

@Component({
  selector:    'app-loading-overlay',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './loading-overlay.component.html',
  styleUrl:    './loading-overlay.component.css',
})
export class LoadingOverlayComponent {
  visible = input<boolean>(false);
  mensaje = input<string | null>(null);
  paso    = input<string | null>(null);
  modo = input<'overlay' | 'inline' | 'page'>('overlay');
}