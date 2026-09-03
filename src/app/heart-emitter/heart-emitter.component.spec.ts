import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeartEmitterComponent } from './heart-emitter.component';

describe('HeartEmitterComponent', () => {
  let component: HeartEmitterComponent;
  let fixture: ComponentFixture<HeartEmitterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HeartEmitterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeartEmitterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
