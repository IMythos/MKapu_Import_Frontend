import {
  Component, Input, Output, EventEmitter,
  computed, signal, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginador.component.html',
  styleUrls: ['./Paginador.component.css'],
})
export class PaginadorComponent implements OnChanges {
  @Input() page        = 1;
  @Input() totalPages  = 1;
  @Input() total       = 0;
  @Input() limit       = 10;
  @Input() limitOpciones: number[] = [5, 10, 20, 50];

  @Output() pageChange  = new EventEmitter<number>();
  @Output() limitChange = new EventEmitter<number>();

  /** Páginas visibles con ellipsis — máx 5 botones numéricos */
  get pages(): (number | '...')[] {
    const tp = this.totalPages;
    const p  = this.page;
    if (tp <= 5) return Array.from({ length: tp }, (_, i) => i + 1);

    if (p <= 3)  return [1, 2, 3, '...', tp];
    if (p >= tp - 2) return [1, '...', tp - 2, tp - 1, tp];
    return [1, '...', p - 1, p, p + 1, '...', tp];
  }

  get desde(): number { return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1; }
  get hasta(): number { return Math.min(this.page * this.limit, this.total); }

  ngOnChanges(changes: SimpleChanges): void {
    // Nada que sincronizar — valores vienen del padre
  }

  goTo(p: number | '...'): void {
    if (p === '...' || p === this.page) return;
    this.pageChange.emit(p as number);
  }

  prev(): void { if (this.page > 1) this.pageChange.emit(this.page - 1); }
  next(): void { if (this.page < this.totalPages) this.pageChange.emit(this.page + 1); }
  first(): void { if (this.page !== 1) this.pageChange.emit(1); }
  last(): void  { if (this.page !== this.totalPages) this.pageChange.emit(this.totalPages); }

  onLimitChange(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(val);
  }
}