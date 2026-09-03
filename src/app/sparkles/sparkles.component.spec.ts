import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SparklesComponent } from './sparkles.component';

describe('SparklesComponent', () => {
  let component: SparklesComponent;
  let fixture: ComponentFixture<SparklesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SparklesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SparklesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
