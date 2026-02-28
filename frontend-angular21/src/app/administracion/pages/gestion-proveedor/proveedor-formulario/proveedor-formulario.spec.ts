import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProveedorFormulario } from './proveedor-formulario';

describe('ProveedorFormulario', () => {
  let component: ProveedorFormulario;
  let fixture: ComponentFixture<ProveedorFormulario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorFormulario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProveedorFormulario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
