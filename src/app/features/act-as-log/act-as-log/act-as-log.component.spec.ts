import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActAsLogComponent } from './act-as-log.component';

describe('ActAsLogComponent', () => {
  let component: ActAsLogComponent;
  let fixture: ComponentFixture<ActAsLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActAsLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActAsLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
