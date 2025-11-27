import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReceivingService } from '../../../core/services/receiving.service';

@Component({
  selector: 'app-scan-receiving',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './scan-receiving.component.html',
  styleUrl: './scan-receiving.component.scss'
})
export class ScanReceivingComponent implements OnInit{

  scanForm = this.fb.group({
    original_barcode: ['', Validators.required]
  });

  receivingList: any[] = [];
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private receivingService: ReceivingService
  ) {}

  ngOnInit() {
    this.loadReceivingList();
  }

  loadReceivingList() {
    this.receivingService.getList().subscribe({
      next: (data) => {
        this.receivingList = data;
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

    this.receivingService.recordScan(scanData as any).subscribe({
      next: () => {
        this.successMessage = 'Scan recorded successfully!';
        this.scanForm.reset();
        this.loadReceivingList();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Failed to record scan';
      }
    });
  }

}
