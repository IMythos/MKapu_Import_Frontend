import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorListado } from './proveedor-listado';

describe('ProveedorListado', () => {
  let component: ProveedorListado;
  let fixture: ComponentFixture<ProveedorListado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorListado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorListado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
