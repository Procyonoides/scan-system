import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanReceivingComponent } from './scan-receiving.component';

describe('ScanReceivingComponent', () => {
  let component: ScanReceivingComponent;
  let fixture: ComponentFixture<ScanReceivingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanReceivingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScanReceivingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
