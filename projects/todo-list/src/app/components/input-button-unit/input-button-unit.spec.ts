import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputButtonUnit } from './input-button-unit';

describe('InputButtonUnit', () => {
  let component: InputButtonUnit;
  let fixture: ComponentFixture<InputButtonUnit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputButtonUnit],
    }).compileComponents();

    fixture = TestBed.createComponent(InputButtonUnit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
