import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { ReceivingService } from '../../../core/services/receiving.service';

interface ReceivingRecord {
  original_barcode: string;
  brand?: string;
  color: string;
  size: string;
  four_digit?: string;
  unit?: string;
  quantity: number;
  production?: string;
  model: string;
  model_code?: string;
  item?: string;
  date_time: string;
  scan_no: number;
  username: string;
  description?: string;
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
  styleUrl: './scan-receiving.component.scss'
})
export class ScanReceivingComponent implements OnInit, AfterViewInit {
  @ViewChild('barcodeInput') barcodeInput!: ElementRef<HTMLInputElement>;

  scanForm = this.fb.group({
    barcode: ['', [Validators.required, Validators.minLength(1)]]
  });

  receivingList: ReceivingRecord[] = [];
  
  lastScan = {
    model: '-',
    color: '-',
    size: '-',
    quantity: '-'
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pages: number[] = [];

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  username = '';
  userPosition = '';
  isMoving = false;
  isPrintingDetail = false;
  isPrintingSummary = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private receivingService: ReceivingService
  ) {}

  ngOnInit() {
    this.username = this.authService.currentUser()?.username || '';
    this.userPosition = this.authService.currentUser()?.position || '';
    console.log('📦 Scan Receiving initialized for user:', this.username, 'Position:', this.userPosition);
    
    // ✅ LOAD TODAY'S SCANS instead of user history
    this.loadTodayScans();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.focusBarcodeInput();
    }, 100);
  }

  focusBarcodeInput() {
    if (this.barcodeInput) {
      this.barcodeInput.nativeElement.focus();
    }
  }

  /**
   * ✅ NEW: Load today's scans (like dashboard) with pagination
   */
  loadTodayScans() {
    this.isLoading = true;
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };
    
    this.http.get<any>(`${environment.apiUrl}/receiving/today`, { params })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.receivingList = response.data;
            
            if (response.pagination) {
              this.totalItems = response.pagination.total;
              this.totalPages = response.pagination.totalPages;
              this.updatePagination();
            }
            
            console.log('✅ Today receiving scans loaded:', this.receivingList.length, 'records (Page', this.currentPage, 'of', this.totalPages + ')');
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Failed to load today scans:', err);
          this.isLoading = false;
        }
      });
  }

  /**
   * Keep old method for compatibility
   */
  loadReceivingHistory() {
    this.loadTodayScans();
  }

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

    this.http.post<ScanResponse>(`${environment.apiUrl}/receiving/scan`, { barcode })
      .subscribe({
        next: (response) => {
          console.log('✅ Scan response:', response);

          if (response.success) {
            this.lastScan = {
              model: response.data.model,
              color: response.data.color,
              size: response.data.size,
              quantity: String(response.data.quantity)
            };

            this.successMessage = response.message || 'Data Berhasil Diinputkan';
            this.scanForm.reset();
            
            // ✅ Reload today's scans
            this.loadTodayScans();

            setTimeout(() => {
              this.successMessage = '';
            }, 3000);

            this.playSuccessSound();
          } else {
            this.errorMessage = response.message || 'Scan failed';
            this.playErrorSound();
          }

          this.isLoading = false;

          setTimeout(() => {
            this.focusBarcodeInput();
          }, 100);
        },
        error: (err) => {
          console.error('❌ Scan error:', err);
          
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

          this.playErrorSound();
          this.isLoading = false;

          setTimeout(() => {
            this.focusBarcodeInput();
          }, 100);
        }
      });
  }

  playSuccessSound() {
    try {
      const audio = new Audio('assets/sounds/success.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available');
    }
  }

  playErrorSound() {
    try {
      const audio = new Audio('assets/sounds/error.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available');
    }
  }

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

  canManageScans(): boolean {
    const position = this.authService.currentUser()?.position;
    return position === 'IT' || position === 'MANAGEMENT';
  }

  getCurrentDate(): string {
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  trackByScanNo(index: number, item: ReceivingRecord): number {
    return item.scan_no;
  }

  // ==================== PAGINATION METHODS ====================
  
  updatePagination() {
    this.pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      this.pages.push(i);
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadTodayScans();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  changeItemsPerPage(event: any) {
    this.itemsPerPage = parseInt(event.target.value);
    this.currentPage = 1;
    this.loadTodayScans();
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  onMoveData() {
    if (!confirm('Are you sure you want to move all receiving data to history? This action cannot be undone.')) {
      return;
    }

    this.isMoving = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.receivingService.moveData().subscribe({
      next: (response) => {
        console.log('✅ Move data successful:', response);
        this.successMessage = 'Data berhasil dipindahkan ke history!';
        this.loadTodayScans();
        this.isMoving = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Move data error:', err);
        this.errorMessage = err.error?.message || 'Failed to move data';
        this.isMoving = false;

        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  onPrintDetail() {
    this.isPrintingDetail = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.receivingService.printDetail().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receiving_Detail_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.successMessage = 'Detail report downloaded successfully!';
        this.isPrintingDetail = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Print detail error:', err);
        this.errorMessage = 'Failed to download detail report';
        this.isPrintingDetail = false;

        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  onPrintSummary() {
    this.isPrintingSummary = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.receivingService.printSummary().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Receiving_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.successMessage = 'Summary report downloaded successfully!';
        this.isPrintingSummary = false;

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Print summary error:', err);
        this.errorMessage = 'Failed to download summary report';
        this.isPrintingSummary = false;

        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }
}