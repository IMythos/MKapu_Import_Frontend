import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAlmacen } from './dashboard-almacen';

describe('DashboardAlmacen', () => {
  let component: DashboardAlmacen;
  let fixture: ComponentFixture<DashboardAlmacen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAlmacen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAlmacen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
