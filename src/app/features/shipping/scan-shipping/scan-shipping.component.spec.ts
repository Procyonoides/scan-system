import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanShippingComponent } from './scan-shipping.component';

describe('ScanShippingComponent', () => {
  let component: ScanShippingComponent;
  let fixture: ComponentFixture<ScanShippingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanShippingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ScanShippingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
