import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormularioCotizacion } from './formulario-cotizacion';

describe('FormularioCotizaciones', () => {
  let component: FormularioCotizacion;
  let fixture: ComponentFixture<FormularioCotizacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCotizacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormularioCotizacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
