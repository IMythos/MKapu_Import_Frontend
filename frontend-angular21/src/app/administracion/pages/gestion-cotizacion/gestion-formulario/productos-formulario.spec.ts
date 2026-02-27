import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductosFormulario } from './productos-formulario';

describe('ProductosForm', () => {
  let component: ProductosFormulario;
  let fixture: ComponentFixture<ProductosFormulario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductosFormulario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductosFormulario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
