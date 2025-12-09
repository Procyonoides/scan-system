import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

interface ReceivingRecord {
  original_barcode: string;
  brand: string;
  color: string;
  size: string;
  four_digit: string;
  unit: string;
  quantity: number;
  production: string;
  model: string;
  model_code: string;
  item: string;
  date_time: string;
  scan_no: number;
  username: string;
  description: string;
}

interface ScanResponse {
  success: boolean;
  message: string;
  data: {
    scan_no: number;
    original_barcode: string;
    model: string;
    color: string;
    size: string;
    quantity: number;
    date_time: string;
    username: string;
  };
  error?: string;
}

@Component({
  selector: 'app-scan-receiving',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './scan-receiving.component.html',
  styleUrl: './scan-receiving.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class ScanReceivingComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;

  scanForm = this.fb.group({
    barcode: ['', [Validators.required, Validators.minLength(1)]]
  });

  receivingList: ReceivingRecord[] = [];
  
  // Last scan result
  lastScan = {
    model: '-',
    color: '-',
    size: '-',
    quantity: '-'
  };

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isDeleting = false;
  username = '';
  userPosition = '';

  // Modal states
  showEditModal = false;
  showDeleteModal = false;
  selectedItem: ReceivingRecord | null = null;
  editForm: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.username = this.authService.currentUser()?.username || '';
    this.userPosition = this.authService.currentUser()?.position || '';
    console.log('📦 Scan Receiving initialized for user:', this.username, 'Position:', this.userPosition);
    this.loadReceivingHistory();
  }

  ngAfterViewInit() {
    // Auto-focus pada input barcode setelah view init
    setTimeout(() => {
      this.focusBarcodeInput();
    }, 100);
  }

  /**
   * Focus ke input barcode
   */
  focusBarcodeInput() {
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  /**
   * Load receiving history (last 10 records)
   */
  loadReceivingHistory() {
    this.http.get<any>(`${environment.apiUrl}/receiving/history`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.receivingList = response.data;
            console.log('✅ Receiving history loaded:', this.receivingList.length, 'records');
          }
        },
        error: (err) => {
          console.error('❌ Failed to load receiving history:', err);
        }
      });
  }

  /**
   * Handle scan submit
   */
  onScan() {
    if (this.scanForm.invalid) {
      this.errorMessage = 'Please enter a barcode';
      return;
    }

    const barcode = this.scanForm.value.barcode?.trim();
    
    if (!barcode) {
      this.errorMessage = 'Barcode cannot be empty';
      return;
    }

    console.log('📷 Scanning barcode:', barcode);

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // ✅ FIXED: Sesuai dengan backend PHP - POST dengan parameter 'barcode'
    this.http.post<ScanResponse>(`${environment.apiUrl}/receiving/scan`, { barcode })
      .subscribe({
        next: (response) => {
          console.log('✅ Scan response:', response);

          if (response.success) {
            // Update last scan display
            this.lastScan = {
              model: response.data.model,
              color: response.data.color,
              size: response.data.size,
              quantity: String(response.data.quantity)
            };

            // Show success message
            this.successMessage = response.message || 'Data Berhasil Diinputkan';

            // Clear form
            this.scanForm.reset();

            // Reload history
            this.loadReceivingHistory();

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);

            // Play success sound (optional)
            this.playSuccessSound();
          } else {
            // Handle unsuccessful response
            this.errorMessage = response.message || 'Scan failed';
            this.playErrorSound();
          }

          this.isLoading = false;

          // Auto-focus back to input
          setTimeout(() => {
            this.focusBarcodeInput();
          }, 100);
        },
        error: (err) => {
          console.error('❌ Scan error:', err);
          
          // ✅ FIXED: Handle specific error types sesuai backend PHP
          if (err.error?.error === 'SYSTEM_MAINTENANCE') {
            this.errorMessage = 'Harap tidak melakukan transaksi, sedang proses perpindahan data';
            this.lastScan = { model: '-', color: '-', size: '-', quantity: '-' };
          } else if (err.error?.error === 'BARCODE_NOT_FOUND') {
            this.errorMessage = 'Data Gagal Diinputkan - Barcode tidak ditemukan';
            this.lastScan = { model: '-', color: '-', size: '-', quantity: '-' };
          } else if (err.error?.error === 'BARCODE_REQUIRED') {
            this.errorMessage = 'Barcode harus diisi';
          } else if (err.error?.error === 'INVALID_POSITION') {
            this.errorMessage = 'Username tidak sesuai - Harus posisi RECEIVING';
          } else {
            this.errorMessage = err.error?.message || 'Scan failed';
          }

          // Play error sound
          this.playErrorSound();

          this.isLoading = false;

          // Auto-focus back to input
          setTimeout(() => {
            this.focusBarcodeInput();
          }, 100);
        }
      });
  }

  /**
   * Play success sound
   */
  playSuccessSound() {
    try {
      const audio = new Audio('assets/sounds/success.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available');
    }
  }

  /**
   * Play error sound
   */
  playErrorSound() {
    try {
      const audio = new Audio('assets/sounds/error.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available');
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * Get item badge class
   */
  getItemBadgeClass(item: string): string {
    const classes: { [key: string]: string } = {
      'IP': 'badge-ip',
      'PHYLON': 'badge-phylon',
      'BLOKER': 'badge-bloker',
      'PAINT': 'badge-paint',
      'RUBBER': 'badge-rubber',
      'GOODSOLE': 'badge-goodsole'
    };
    return classes[item] || 'badge-default';
  }

  /**
   * Check if user can manage scans (Edit/Delete)
   * Only IT and MANAGEMENT can manage
   */
  canManageScans(): boolean {
    const position = this.authService.currentUser()?.position;
    return position === 'IT' || position === 'MANAGEMENT';
  }

  /**
   * Open Edit Modal
   */
  openEditModal(item: ReceivingRecord) {
    this.selectedItem = item;
    this.editForm = this.fb.group({
      original_barcode: [item.original_barcode],
      brand: [item.brand],
      color: [item.color],
      size: [item.size],
      four_digit: [item.four_digit],
      model: [item.model],
      item: [item.item],
      production: [item.production],
      quantity: [item.quantity],
      username: [item.username]
    });
    this.showEditModal = true;
  }

  /**
   * Close Edit Modal
   */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedItem = null;
    this.editForm = null;
  }

  /**
   * Open Delete Modal
   */
  openDeleteModal(item: ReceivingRecord) {
    this.selectedItem = item;
    this.showDeleteModal = true;
  }

  /**
   * Close Delete Modal
   */
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedItem = null;
  }

  /**
   * Confirm Delete
   */
  confirmDelete() {
    if (!this.selectedItem) return;

    this.isDeleting = true;

    this.http.delete(`${environment.apiUrl}/receiving/${this.selectedItem.date_time}/${this.selectedItem.scan_no}/${this.selectedItem.username}`)
      .subscribe({
        next: (response: any) => {
          console.log('✅ Delete successful:', response);
          this.successMessage = 'Record deleted successfully!';
          this.closeDeleteModal();
          this.loadReceivingHistory();
          this.isDeleting = false;

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (err) => {
          console.error('❌ Delete error:', err);
          this.errorMessage = err.error?.message || 'Failed to delete record';
          this.isDeleting = false;

          setTimeout(() => {
            this.errorMessage = '';
          }, 5000);
        }
      });
  }
}