import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosDetalles } from './productos-detalles';

describe('ProductosDetalles', () => {
  let component: ProductosDetalles;
  let fixture: ComponentFixture<ProductosDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosDetalles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
