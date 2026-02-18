import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface MasterDataItem {
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
  username: string;
  date_time: string;
  stock: number;
}

interface FilterOptions {
  models: string[];
  sizes: string[];
  productions: string[];
  brands: string[];
  units: string[];
  items: string[];
}

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './master-data.component.html',
  styleUrl: './master-data.component.scss'
})
export class MasterDataComponent implements OnInit {
  masterDataList: MasterDataItem[] = [];
  filteredData: MasterDataItem[] = [];

  filterOptions: FilterOptions = {
    models: [],
    sizes: [],
    productions: [],
    brands: ['ADIDAS', 'NEW BALANCE', 'REEBOK', 'ASICS', 'SPECS', 'OTHER BRAND'],
    units: ['PRS', 'PCS'],
    items: ['IP', 'PHYLON', 'BLOKER', 'PAINT', 'RUBBER', 'GOODSOLE']
  };

  barcodeForm!: FormGroup;
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;
  Math = Math;

  // Modal states
  showAddModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showBatchDeleteModal = false;
  showImportModal = false;
  showStockOpnameModal = false;
  showResetStockConfirm = false;


  selectedBarcode: string = '';
  selectedBarcodes: Set<string> = new Set();
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // File upload
  selectedFile: File | null = null;

  // Size to Four Digit Mapping - Will be loaded from database
  sizeMap: { [key: string]: string } = {};

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    console.log('🚀 Master Data Component initialized');
    this.initForm();
    this.loadMasterData();
    this.loadFilterOptions();
  }

  initForm() {
    this.barcodeForm = this.fb.group({
      original_barcode: ['', [Validators.required, Validators.minLength(5)]],
      brand: ['', Validators.required],
      color: ['', Validators.required],
      size: ['', Validators.required],
      four_digit: [''],
      unit: ['', Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],
      production: ['', Validators.required],
      model: ['', Validators.required],
      model_code: [''],
      item: ['', Validators.required],
      stock: [0],
      username: [''],
      date_time: ['']
    });

    // Auto-generate four_digit when size changes
    this.barcodeForm.get('size')?.valueChanges.subscribe(size => {
      if (size) {
        this.generateFourDigit(size);
      }
    });

    // Auto-fetch model_code when model changes
    this.barcodeForm.get('model')?.valueChanges.subscribe(model => {
      if (model) {
        this.fetchModelCode(model);
      }
    });
  }

  loadMasterData() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('📡 Loading master data...', {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm
    });

    this.http.get<any>(`${environment.apiUrl}/master-data/barcodes`, {
      params: {
        page: this.currentPage.toString(),
        limit: this.itemsPerPage.toString(),
        search: this.searchTerm
      }
    }).subscribe({
      next: (response) => {
        console.log('✅ Master data received:', response);

        if (response.success && response.data) {
          this.masterDataList = response.data;
          this.filteredData = response.data;

          if (response.pagination) {
            this.totalItems = response.pagination.total;
            this.totalPages = response.pagination.totalPages;
            this.currentPage = response.pagination.page;
          }

          console.log(`📦 Loaded ${this.masterDataList.length} items (Total: ${this.totalItems})`);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load master data:', err);
        this.errorMessage = err.error?.error || err.error?.message || 'Failed to load data';
        this.isLoading = false;

        this.masterDataList = [];
        this.filteredData = [];
        this.totalItems = 0;
        this.totalPages = 0;
      }
    });
  }

  loadFilterOptions() {
    console.log('📡 Loading filter options from database...');

    this.http.get<any>(`${environment.apiUrl}/master-data/filter-options`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update options dari database
            this.filterOptions.models = response.models || [];
            this.filterOptions.sizes = response.sizes || [];
            this.filterOptions.productions = response.productions || [];

            // Build size map dari database
            if (response.sizeMap) {
              this.sizeMap = response.sizeMap;
              console.log('✅ Size map loaded from database:', Object.keys(this.sizeMap).length, 'entries');
            }

            // Brands, units, items tetap dari static array
            this.filterOptions.brands = response.brands || ['ADIDAS', 'NEW BALANCE', 'REEBOK', 'ASICS', 'SPECS', 'OTHER BRAND'];
            this.filterOptions.units = response.units || ['PRS', 'PCS'];
            this.filterOptions.items = response.items || ['IP', 'PHYLON', 'BLOKER', 'PAINT', 'RUBBER', 'GOODSOLE'];

            console.log('✅ Filter options loaded:', {
              models: this.filterOptions.models.length,
              sizes: this.filterOptions.sizes.length,
              productions: this.filterOptions.productions.length,
              sizeMapEntries: Object.keys(this.sizeMap).length
            });
          }
        },
        error: (err) => {
          console.error('❌ Failed to load filter options:', err);
          this.errorMessage = 'Failed to load dropdown options';
        }
      });
  }

  generateFourDigit(size: string) {
    const fourDigit = this.sizeMap[size] || '';
    this.barcodeForm.patchValue({ four_digit: fourDigit });
    console.log(`🔢 Generated four_digit for size ${size}: ${fourDigit}`);
  }

  fetchModelCode(model: string) {
    console.log('📡 Fetching model_code for:', model);

    this.http.get<any>(`${environment.apiUrl}/master-data/model-code/${model}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const modelCode = response.model_code || '';
            this.barcodeForm.patchValue({ model_code: modelCode });
            console.log(`✅ Model code fetched: ${modelCode}`);
          }
        },
        error: (err) => {
          console.error('❌ Failed to fetch model code:', err);
          this.barcodeForm.patchValue({ model_code: '' });
        }
      });
  }

  onSearch() {
    console.log('🔍 Searching:', this.searchTerm);
    this.currentPage = 1;
    this.loadMasterData();
  }

  get paginatedData() {
    return this.filteredData;
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      console.log(`📄 Going to page ${page}`);
      this.currentPage = page;
      this.loadMasterData();
    }
  }

  onItemsPerPageChange() {
    console.log(`📋 Items per page changed to: ${this.itemsPerPage}`);
    this.currentPage = 1;
    this.loadMasterData();
  }

  // ==================== MODAL FUNCTIONS ====================

  openAddModal() {
    this.showAddModal = true;
    this.barcodeForm.reset({ quantity: 0, stock: 0 });
    this.errorMessage = '';

    // Reload filter options untuk memastikan data terbaru
    this.loadFilterOptions();
    console.log('📝 Opening Add Modal with options:', this.filterOptions);
  }

  openAddByExcelModal() {
    this.showImportModal = true;
    this.selectedFile = null;
    this.errorMessage = '';
  }

  openEditModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.isLoading = true;

    // Reload filter options untuk edit modal
    this.loadFilterOptions();

    this.http.get<any>(`${environment.apiUrl}/master-data/barcode/${barcode}`)
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.barcodeForm.patchValue(response.data);
            this.showEditModal = true;
            console.log('✅ Barcode data loaded for edit:', response.data);
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to load barcode data';
          this.isLoading = false;
        }
      });
  }

  openDeleteModal(barcode: string) {
    this.selectedBarcode = barcode;
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  openStockOpnameModal() {
    this.showStockOpnameModal = true;
    this.selectedFile = null;
    this.errorMessage = '';
  }


  // ==================== CRUD OPERATIONS ====================

  onAdd() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    console.log('📤 Adding barcode:', this.barcodeForm.value);

    this.http.post(`${environment.apiUrl}/master-data/barcode`, this.barcodeForm.value)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode added successfully!';
            this.showAddModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode added successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to add barcode';
          this.isLoading = false;
          console.error('❌ Failed to add barcode:', err);
        }
      });
  }

  onEdit() {
    if (this.barcodeForm.invalid) {
      this.errorMessage = 'Please fill all required fields';
      return;
    }

    this.isLoading = true;
    console.log('📤 Updating barcode:', this.selectedBarcode);

    this.http.put(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`, this.barcodeForm.value)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode updated successfully!';
            this.showEditModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode updated successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to update barcode';
          this.isLoading = false;
          console.error('❌ Failed to update barcode:', err);
        }
      });
  }

  onDelete() {
    this.isLoading = true;
    console.log('🗑️ Deleting barcode:', this.selectedBarcode);

    this.http.delete(`${environment.apiUrl}/master-data/barcode/${this.selectedBarcode}`)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Barcode deleted successfully!';
            this.showDeleteModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Barcode deleted successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to delete barcode';
          this.isLoading = false;
          console.error('❌ Failed to delete barcode:', err);
        }
      });
  }

  // ==================== BATCH DELETE ====================

  toggleBarcodeSelection(barcode: string) {
    if (this.selectedBarcodes.has(barcode)) {
      this.selectedBarcodes.delete(barcode);
    } else {
      this.selectedBarcodes.add(barcode);
    }
    console.log('📋 Selected barcodes:', this.selectedBarcodes.size);
  }

  isBarcodeSelected(barcode: string): boolean {
    return this.selectedBarcodes.has(barcode);
  }

  selectAllBarcodes() {
    this.selectedBarcodes.clear();
    this.filteredData.forEach(item => {
      this.selectedBarcodes.add(item.original_barcode);
    });
    console.log('✅ Selected all barcodes:', this.selectedBarcodes.size);
  }

  deselectAllBarcodes() {
    this.selectedBarcodes.clear();
    console.log('❌ Deselected all barcodes');
  }

  get hasSelectedBarcodes(): boolean {
    return this.selectedBarcodes.size > 0;
  }

  get allBarcodesSelected(): boolean {
    return this.filteredData.length > 0 &&
      this.filteredData.every(item => this.selectedBarcodes.has(item.original_barcode));
  }

  openBatchDeleteModal() {
    if (this.selectedBarcodes.size === 0) {
      this.errorMessage = 'Please select at least one barcode to delete';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    this.showBatchDeleteModal = true;
    this.errorMessage = '';
  }

  onBatchDelete() {
    this.isLoading = true;
    const barcodesToDelete = Array.from(this.selectedBarcodes);
    console.log(`🗑️ Batch deleting ${barcodesToDelete.length} barcodes`);

    this.http.post(`${environment.apiUrl}/master-data/batch-delete`, { barcodes: barcodesToDelete })
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const message = `Successfully deleted ${response.successCount} barcode(s)`;
            if (response.errorCount > 0) {
              this.successMessage = `${message}. ${response.errorCount} error(s) occurred.`;
              if (response.errors) {
                this.errorMessage = response.errors.slice(0, 3).join('\n');
              }
            } else {
              this.successMessage = message;
            }
            this.showBatchDeleteModal = false;
            this.selectedBarcodes.clear();
            this.loadMasterData();
            setTimeout(() => {
              this.successMessage = '';
              this.errorMessage = '';
            }, 5000);
            console.log('✅ Batch delete completed:', response);
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to batch delete barcodes';
          this.isLoading = false;
          console.error('❌ Batch delete failed:', err);
        }
      });
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showBatchDeleteModal = false;
    this.showImportModal = false;
    this.showStockOpnameModal = false;
    this.showResetStockConfirm = false;
    this.selectedBarcode = '';
    this.selectedFile = null;
    this.errorMessage = '';
  }

  openResetStockConfirm() {
    this.showResetStockConfirm = true;
    this.errorMessage = '';
  }

  closeResetStockConfirm() {
    this.showResetStockConfirm = false;
    this.errorMessage = '';
  }

  onResetStock() {
    this.isLoading = true;
    console.log('🔄 Resetting all stock to 0');

    this.http.post(`${environment.apiUrl}/master-data/reset-stock`, {})
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = response.message || 'Stock reset successfully!';
            this.showResetStockConfirm = false;
            this.showStockOpnameModal = false;
            this.loadMasterData();
            setTimeout(() => this.successMessage = '', 3000);
            console.log('✅ Stock reset successfully');
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Failed to reset stock';
          this.isLoading = false;
          console.error('❌ Failed to reset stock:', err);
        }
      });
  }

  // ==================== FILE HANDLING ====================

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];

      if (allowedTypes.includes(file.type)) {
        this.selectedFile = file;
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Please select a valid Excel or CSV file';
        this.selectedFile = null;
      }
    }
  }

  onImportExcel() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/master-data/import-barcode`, formData)
      .subscribe({
        next: (response: any) => {
          this.successMessage = response.message || 'Import successful!';
          this.closeModal();
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Import failed';
          this.isLoading = false;
        }
      });
  }

  onImportStockOpname() {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      return;
    }

    this.isLoading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post(`${environment.apiUrl}/master-data/import-stock-opname`, formData)
      .subscribe({
        next: (response: any) => {
          if (response.errorCount && response.errorCount > 0) {
            // Show partial success with errors
            this.successMessage = `✅ Import completed: ${response.successCount} updated. ⚠️ ${response.errorCount} errors.`;
            if (response.errors && response.errors.length > 0) {
              const errorDetails = response.errors.slice(0, 5).join('\n');
              this.errorMessage = `Some rows failed:\n${errorDetails}${response.errors.length > 5 ? '\n... and more' : ''}`;
            }
          } else {
            this.successMessage = response.message || `✅ All ${response.successCount} barcodes updated successfully!`;
            this.closeModal();
          }
          this.loadMasterData();
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || err.error?.message || 'Import failed';
          if (err.error?.errors) {
            this.errorMessage += '\n\nDetails:\n' + err.error.errors.join('\n');
          }
          this.isLoading = false;
        }
      });
  }

  // ==================== EXPORT FUNCTIONS ====================

  downloadFormatExcel() {
    console.log('📥 Downloading format Excel...');

    const headers = [
      'ORIGINAL_BARCODE', 'BRAND', 'COLOR', 'SIZE', 'FOUR_DIGIT', 'UNIT',
      'QUANTITY', 'PRODUCTION', 'MODEL', 'MODEL_CODE', 'ITEM', 'STOCK'
    ];

    const sampleRow = [
      'SAMPLE123', 'ADIDAS', 'BLACK', '10', '0036', 'PRS',
      '100', 'PT HSK REMBANG', 'BOOST', 'BST', 'IP', '0'
    ];

    let csvContent = headers.join(',') + '\n';
    csvContent += sampleRow.join(',') + '\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Format_Import_Master_Data.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    this.successMessage = 'Format Excel downloaded successfully!';
    setTimeout(() => this.successMessage = '', 3000);
  }

  printMasterData() {
    console.log('🖨️ Printing master data...');
    window.print();
  }
}