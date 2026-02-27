import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromocionesListado } from './promociones-listado';

describe('PromocionesListado', () => {
  let component: PromocionesListado;
  let fixture: ComponentFixture<PromocionesListado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromocionesListado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromocionesListado);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
