import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShippingService } from '../../../core/services/shipping.service';

@Component({
  selector: 'app-scan-shipping',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './scan-shipping.component.html',
  styleUrl: './scan-shipping.component.scss'
})
export class ScanShippingComponent implements OnInit {
  scanForm = this.fb.group({
    original_barcode: ['', Validators.required]
  });

  shippingList: any[] = [];
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private shippingService: ShippingService
  ) {}

  ngOnInit() {
    this.loadShippingList();
  }

  loadShippingList() {
    this.shippingService.getList().subscribe({
      next: (data) => {
        this.shippingList = data;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to load data';
      }
    });
  }

  onScan() {
    if (this.scanForm.invalid) return;

    const scanData = {
      ...this.scanForm.value,
      warehouse_id: 1,
      model: 'N/A',
      color: 'N/A',
      size: 'N/A',
      quantity: 1
    };

    this.shippingService.recordScan(scanData as any).subscribe({
      next: () => {
        this.successMessage = 'Scan recorded successfully!';
        this.scanForm.reset();
        this.loadShippingList();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to record scan';
      }
    });
  }
}
