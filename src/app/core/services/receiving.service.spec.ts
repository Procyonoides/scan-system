import { TestBed } from '@angular/core/testing';

import { ReceivingService } from './receiving.service';

describe('ReceivingService', () => {
  let service: ReceivingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceivingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
