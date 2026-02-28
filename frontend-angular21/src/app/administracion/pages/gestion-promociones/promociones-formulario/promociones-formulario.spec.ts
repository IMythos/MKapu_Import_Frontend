import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromocionesFormulario } from './promociones-formulario';

describe('PromocionesFormulario', () => {
  let component: PromocionesFormulario;
  let fixture: ComponentFixture<PromocionesFormulario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromocionesFormulario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromocionesFormulario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
