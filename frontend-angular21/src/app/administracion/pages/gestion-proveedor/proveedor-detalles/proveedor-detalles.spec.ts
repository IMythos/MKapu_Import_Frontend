import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorDetalles } from './proveedor-detalles';

describe('ProveedorDetalles', () => {
  let component: ProveedorDetalles;
  let fixture: ComponentFixture<ProveedorDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorDetalles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
