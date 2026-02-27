import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarDespacho } from './editar-despacho';

describe('EditarDespacho', () => {
  let component: EditarDespacho;
  let fixture: ComponentFixture<EditarDespacho>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarDespacho]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarDespacho);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
