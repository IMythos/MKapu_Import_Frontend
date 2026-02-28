import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromocionesDetalles } from './promociones-detalles';

describe('PromocionesDetalles', () => {
  let component: PromocionesDetalles;
  let fixture: ComponentFixture<PromocionesDetalles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromocionesDetalles]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromocionesDetalles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
